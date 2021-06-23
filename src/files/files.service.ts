import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileStoreDto } from './dtos/file-create.dto';
import { File } from './file.schema';
import { access, unlink } from 'fs/promises';
import { constants, createReadStream } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { FileAccessDto, ManageAccessModes } from './dtos/file-access.dto';

@Injectable()
export class FilesService {
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {}

  async listFiles(filters?: Object) {
    return this.fileModel.find(filters || {});
  }

  async listForUser(userId: string) {
    const files = await this.fileModel
      .find({ $or: [{ owner: userId }, { shared: userId }] })
      .sort({ createdAt: -1 })
      .populate({ path: 'owner', select: 'details' })
      .populate({ path: 'shared', select: 'details' })
      .populate({ path: 'linkedTasks' });
    const dtoOut = {
      owns: [],
      hasAccess: [],
    };
    files.forEach((file) => {
      if (file.owner.id === userId) {
        dtoOut.owns.push(file);
      } else dtoOut.hasAccess.push(file);
    });
    return dtoOut;
  }

  async manageAccess(
    dto: FileAccessDto,
    callerId: string,
    mode: ManageAccessModes,
  ) {
    const target = await this.getById(dto.fileId);

    if (target.owner.id !== callerId) {
      throw new ForbiddenException(
        `You are not allowed to manage ${dto.fileId} file.`,
      );
    }
    switch (mode) {
      case ManageAccessModes.SHARE:
        if (dto.userIds.includes(target.owner.id)) {
          throw new BadRequestException('You own the file already.');
        }
        if (dto.rewrite) {
          target.shared = dto.userIds;
        } else {
          const additions = dto.userIds.filter(
            (f) => !target.shared.includes(f),
          );
          target.shared = [...target.shared, ...additions];
        }
        break;
      case ManageAccessModes.UNSHARE:
        target.shared = target.shared.filter(
          (userId) => !dto.userIds.includes(userId),
        );
        break;
    }

    return target.save();
  }

  async downloadFile(fileId: string, callerId: string): Promise<File> {
    const fileMeta = await this.getById(fileId);
    if (fileMeta.owner.id !== callerId && !fileMeta.shared.includes(callerId)) {
      throw new ForbiddenException();
    }
    const filePath = this.getStoringPath(fileMeta.filename);
    try {
      await access(filePath, constants.F_OK);
    } catch (error) {
      await this.removeFromDB([fileId]);
      throw new NotFoundException(
        `File with ${fileId} id was not found in the file system!`,
      );
    }
    return fileMeta;
  }

  async uploadFiles(
    files: Array<FileStoreDto & Express.Multer.File>,
    callerId: string,
    shared?: string[],
  ): Promise<File[]> {
    const areValid =
      files.every(
        (file) =>
          file.originalname && file.mimetype && file.path && file.filename,
      ) && callerId;
    if (!areValid) {
      await Promise.all(
        files.map((file) => unlink(file.path).catch(console.error)),
      );
      throw new BadRequestException('Uploading failed: files are not valid!');
    }
    files.forEach((file) => (file.owner = callerId));
    console.log(shared);

    if (shared && shared.length) {
      files.forEach((file) => (file.shared = shared));
    }
    console.log(files);

    const storedFiles = await this.storeToDB(files);
    return storedFiles;
  }

  async removeFile(fileId: string, callerId: string) {
    const target = await this.getById(fileId);
    if (target.owner._id !== callerId) {
      throw new ForbiddenException(
        'You are trying to remove another user`s file!',
      );
    }
    const removed = await this.removeFromDB([fileId]);
    try {
      await unlink(this.getStoringPath(target.filename));
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return removed;
  }

  private async storeToDB(
    files: Array<FileStoreDto & Express.Multer.File>,
  ): Promise<File[]> {
    const dtoIn = files.map((file) => ({
      originalname: file.originalname,
      filename: file.filename,
      owner: file.owner,
      mimetype: file.mimetype,
      size: file.size,
      shared: file.shared || [],
    }));
    const storedFiles = await this.fileModel.insertMany(dtoIn).catch((err) => {
      throw new InternalServerErrorException(err);
    });
    return storedFiles;
  }

  private async removeFromDB(fileIds: string[]): Promise<Object> {
    return await this.fileModel.deleteMany({
      _id: {
        $in: fileIds,
      },
    });
  }

  private async getById(fileId: string): Promise<File> {
    const file = await this.fileModel
      .findById(fileId)
      .populate('owner')
      .catch((err) => {
        throw new NotFoundException(
          `DB error or ${fileId} is not a valid ObjectId.`,
        );
      });
    if (!file)
      throw new NotFoundException(`File with ${fileId} id was not found!`);
    return file;
  }

  getReadableStream(filePath: string): Readable {
    try {
      const stream = createReadStream(filePath);
      return stream;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `There was a problem while downloading a file.`,
      );
    }
  }

  getStoringPath(filename?: string) {
    return path.resolve(__dirname, '..', `userFiles/${filename || ''}`);
  }
}
