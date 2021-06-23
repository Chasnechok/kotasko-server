import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from 'src/auth/auth.module';
import { FileSchema, File } from './file.schema';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import * as path from 'path';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    AuthModule,
    MulterModule.register({
      dest: path.resolve(__dirname, '..', 'userFiles'),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService]
})
export class FilesModule {}
