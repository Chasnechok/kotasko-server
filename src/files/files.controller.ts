import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    Res,
    Session,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Query,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { FileStoreAccessDto, FileStoreDto } from './dtos/file-create.dto'
import { FilesService } from './files.service'
import { Response } from 'express'
import contentDisposition = require('content-disposition')
import { FileAccessDto, ManageAccessModes } from './dtos/file-access.dto'
import { ValidationPipe } from 'src/validation.pipe'

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private filesService: FilesService) {}

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files'))
    createFile(
        @UploadedFiles() files: Array<FileStoreDto & Express.Multer.File>,
        @Req() request,
        @Body(new ValidationPipe()) dtoIn: FileStoreAccessDto
    ) {
        return this.filesService.uploadFiles(files, request.user, dtoIn.shared)
    }

    @Delete()
    removeFile(@Query('fileId') fileId: string, @Req() request) {
        return this.filesService.removeFile(fileId, request.user)
    }

    @Get('list')
    listFiles() {
        return this.filesService.listFiles()
    }

    @Get('download/:id')
    async downloadFile(@Param('id') id: string, @Res() res: Response, @Req() request) {
        const fileMeta = await this.filesService.downloadFile(id, request.user._id)
        const stream = this.filesService.getReadableStream(this.filesService.getStoringPath(fileMeta.filename))
        res.set({
            'Content-Type': fileMeta.mimetype,
            'Content-Length': fileMeta.size,
            'Content-Disposition': contentDisposition(fileMeta.originalname),
        })
        stream.pipe(res)
    }

    @Get('listForUser')
    listForUser(@Session() session, @Query('page') page?: string, @Query('perPage') perPage?: string) {
        return this.filesService.listForUser(session.user._id, page, perPage)
    }

    @Patch('shareFile')
    shareFile(@Body(new ValidationPipe()) shareFileDto: FileAccessDto, @Req() request) {
        return this.filesService.manageAccess(shareFileDto, request.user, ManageAccessModes.SHARE)
    }
    @Patch('unshareFile')
    unshareFile(@Body(new ValidationPipe()) shareFileDto: FileAccessDto, @Req() request) {
        return this.filesService.manageAccess(shareFileDto, request.user, ManageAccessModes.UNSHARE)
    }
}