import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Session,
    Res,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Query,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { FileStoreAccessDto } from './dtos/file-create.dto'
import { FilesService } from './files.service'
import { Response } from 'express'
import contentDisposition = require('content-disposition')
import { FileAccessUserDto, FileAccessModes, FileLinkedTasksDto } from './dtos/file-access.dto'
import { File } from './file.schema'
import ListPaginateDto from 'src/pagination/list-paginate.dto'

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private filesService: FilesService) {}

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files'))
    createFile(
        @UploadedFiles() files: Array<File & Express.Multer.File>,
        @Session() session,
        @Body() dtoIn: FileStoreAccessDto
    ) {
        return this.filesService.uploadFiles(files, session.user, dtoIn.shared, dtoIn.linkedTasks)
    }

    @Delete()
    removeFile(@Query('fileId') fileId: string, @Session() session) {
        return this.filesService.removeFile(fileId, session.user)
    }

    @Get('list')
    listPaginate(@Query() paginationQuery: ListPaginateDto, @Session() session) {
        return this.filesService.listPaginate(paginationQuery, session.user)
    }

    @Get('space')
    calcSpaceUsed(@Session() session) {
        return this.filesService.calcSpaceUsed(session.user)
    }

    @Get('download/:id')
    async downloadFile(@Param('id') id: string, @Res() res: Response, @Session() session) {
        const fileMeta = await this.filesService.downloadFile(id, session.user)
        const stream = this.filesService.getReadableStream(this.filesService.getStoringPath(fileMeta.filename))
        res.set({
            'Content-Type': fileMeta.mimetype,
            'Content-Length': fileMeta.size,
            'Content-Disposition': contentDisposition(fileMeta.originalname),
        })
        stream.pipe(res)
    }

    @Patch('setSharedUsers')
    setShareUsers(@Body() dtoIn: FileAccessUserDto, @Session() session) {
        return this.filesService.manageUsersAccess(dtoIn, session.user, FileAccessModes.SET_SHARE)
    }

    @Patch('shareFileUser')
    shareFile(@Body() dtoIn: FileAccessUserDto, @Session() session) {
        return this.filesService.manageUsersAccess(dtoIn, session.user, FileAccessModes.SHARE)
    }
    @Patch('unshareFileUser')
    unshareFile(@Body() dtoIn: FileAccessUserDto, @Session() session) {
        return this.filesService.manageUsersAccess(dtoIn, session.user, FileAccessModes.UNSHARE)
    }

    @Patch('setLinkedTasks')
    setLinkedTasks(@Body() dtoIn: FileLinkedTasksDto, @Session() session) {
        return this.filesService.manageLinkedTasks(dtoIn, session.user, FileAccessModes.SET_LINKED_TASKS)
    }

    @Patch('linkTask')
    linkTask(@Body() dtoIn: FileLinkedTasksDto, @Session() session) {
        return this.filesService.manageLinkedTasks(dtoIn, session.user, FileAccessModes.LINK_TASK)
    }
    @Patch('unlinkTask')
    unlinkTask(@Body() dtoIn: FileLinkedTasksDto, @Session() session) {
        return this.filesService.manageLinkedTasks(dtoIn, session.user, FileAccessModes.UNLINK_TASK)
    }
}
