import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { UsersService } from 'src/users/users.service'
import { Department } from './department.schema'
import { CreateDepartmentDto } from './dtos/department.dto'
import { SetDepHeadDto } from './dtos/set-head.dto'

@Injectable()
export class DepartmentsService {
    constructor(
        @Inject(forwardRef(() => UsersService)) private userService: UsersService,
        @InjectModel(Department.name) private departmentModel: Model<Department>
    ) {}

    async create(CreateDepartmentDto: CreateDepartmentDto): Promise<Department> {
        const createdDepartment = new this.departmentModel(CreateDepartmentDto)
        return createdDepartment.save()
    }

    async findAll(): Promise<Department[]> {
        return this.departmentModel.find().sort({
            createdAt: 'desc',
        })
    }

    async getWorkers(departmentId: string) {
        const dep = await this.findById(departmentId)
        return await this.userService.findByDepartment(dep._id)
    }

    async setDepHead(setDepHeadDto: SetDepHeadDto): Promise<Department> {
        const dep = await this.findById(setDepHeadDto.depId)
        dep.head = await this.userService.findById(setDepHeadDto.userId)
        return dep.save()
    }

    async findById(departmentId: string): Promise<Department> {
        const dep = await this.departmentModel.findById(departmentId)
        if (!dep) throw new NotFoundException(`Department with ${departmentId} id was not found!`)
        return dep
    }
}
