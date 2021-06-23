import { Post, Controller, Body, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ValidationPipe } from 'src/validation.pipe';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, DepartmentIdDto } from './dtos/department.dto';
import { SetDepHeadDto } from './dtos/set-head.dto';

@Controller('department')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) {}
    
    @Roles('admin')
    @Post('/create') 
    createDepartment(@Body(new ValidationPipe()) CreateDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(CreateDepartmentDto)
    }
    
    @Get('/list')
    getDepartments() {
        return this.departmentsService.findAll()
    }

    @Get('/getWorkers')
    getWorkers(@Body(new ValidationPipe()) departmentIdDto: DepartmentIdDto) {
        return this.departmentsService.getWorkers(departmentIdDto.depId)
    }

    @Roles('admin')
    @Patch('/setHead')
    setDepHead(@Body(new ValidationPipe()) setDepHeadDto: SetDepHeadDto) {
        return this.departmentsService.setDepHead(setDepHeadDto);
    }
}
