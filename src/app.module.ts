import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module'
import { DepartmentsModule } from './departments/departments.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGO_URI, { useNewUrlParser: true }),
        UsersModule,
        DepartmentsModule,
        OrganisationsModule,
        AuthModule,
        TasksModule,
        FilesModule,
        NotificationsModule,
    ]
 })
export class AppModule {}