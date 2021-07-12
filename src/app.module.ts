import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from 'src/users/users.module'
import { DepartmentsModule } from './departments/departments.module'
import { OrganisationsModule } from './organisations/organisations.module'
import { AuthModule } from './auth/auth.module'
import { TasksModule } from './tasks/tasks.module'
import { FilesModule } from './files/files.module'
import { NotificationsModule } from './notifications/notifications.module'
import { MessagesModule } from './messages/messages.module'
import { ChoresModule } from './chores/chores.module'
import { PaginationModule } from './pagination/pagination.module'
import { SignalsModule } from './signals/signals.module'

// import * as mongoose from 'mongoose'
/// mongoose.set('debug', true)

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            connectionFactory: (connection) => {
                connection.plugin(require('mongoose-autopopulate'), {
                    functions: ['find', 'save', 'findOne', 'findOneAndUpdate'],
                })
                return connection
            },
        }),
        UsersModule,
        DepartmentsModule,
        OrganisationsModule,
        AuthModule,
        FilesModule,
        TasksModule,
        NotificationsModule,
        MessagesModule,
        ChoresModule,
        PaginationModule,
        SignalsModule,
    ],
})
export class AppModule {}
