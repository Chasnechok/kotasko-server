import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UsersModule } from 'src/users/users.module'
import { Department, DepartmentSchema } from './department.schema'
import { DepartmentsController } from './departments.controller'
import { DepartmentsService } from './departments.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }]),
        forwardRef(() => UsersModule),
    ],
    controllers: [DepartmentsController],
    providers: [DepartmentsService],
    exports: [DepartmentsService],
})
export class DepartmentsModule {}
