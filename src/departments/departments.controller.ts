import { Post, Controller, Body, Get, Patch, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { Roles } from 'src/auth/roles.decorator'
import { UserRoleTypes } from 'src/users/user.schema'
import { DepartmentsService } from './departments.service'
import { CreateDepartmentDto, DepartmentIdDto } from './dtos/department.dto'
import { SetDepHeadDto } from './dtos/set-head.dto'

@Controller('department')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) {}

    @Roles(UserRoleTypes.ADMIN)
    @Post('/create')
    createDepartment(@Body() CreateDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(CreateDepartmentDto)
    }

    @Get('/list')
    getDepartments() {
        return this.departmentsService.findAll()
    }

    @Get('/getWorkers')
    getWorkers(@Body() departmentIdDto: DepartmentIdDto) {
        return this.departmentsService.getWorkers(departmentIdDto.depId)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('/setHead')
    setDepHead(@Body() setDepHeadDto: SetDepHeadDto) {
        return this.departmentsService.setDepHead(setDepHeadDto)
    }
}
