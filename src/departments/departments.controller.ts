import { Post, Controller, Body, Get, Patch, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'src/auth/auth.guard'
import { Roles } from 'src/auth/roles.decorator'
import { UserRoleTypes } from 'src/users/user.schema'
import { DepartmentsService } from './departments.service'
import { CreateDepartmentDto, DepartmentIdDto } from './dtos/department.dto'
import { SetDepHeadDto } from './dtos/set-head.dto'

@Controller('department')
@UseGuards(AuthGuard)
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) {}

    @Roles(UserRoleTypes.ADMIN)
    @Post('/create')
    createDepartment(@Body() dtoIn: CreateDepartmentDto) {
        return this.departmentsService.create(dtoIn)
    }

    @Get('/list')
    getDepartments() {
        return this.departmentsService.findAll()
    }

    /**
     * TODO
     * Remove, Update
     */

    @Get('/getWorkers')
    getWorkers(@Body() dtoIn: DepartmentIdDto) {
        return this.departmentsService.getWorkers(dtoIn.depId)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('/setHead')
    setDepHead(@Body() dtoIn: SetDepHeadDto) {
        return this.departmentsService.setDepHead(dtoIn)
    }
}
