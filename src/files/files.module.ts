import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MulterModule } from '@nestjs/platform-express'
import { File, FileSchema } from './file.schema'
import { FilesController } from './files.controller'
import { FilesService } from './files.service'
import * as path from 'path'
import { NotificationsModule } from 'src/notifications/notifications.module'
import { TasksModule } from 'src/tasks/tasks.module'
import { UsersModule } from 'src/users/users.module'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
        NotificationsModule,
        forwardRef(() => TasksModule),
        UsersModule,
        MulterModule.register({
            dest: path.resolve(__dirname, '../../..', 'userFiles'),
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService],
})
export class FilesModule {}
