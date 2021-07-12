import { Controller, Get, Query, UseGuards, Session, Post, Body, Patch, Delete } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import ListPaginateDto from 'src/pagination/list-paginate.dto'
import { TaskCreateDto } from './dtos/task-create.dto'
import { TaskManageModes, TaskManageUsers } from './dtos/task-manage-users.dto'
import { TaskStateDto } from './dtos/task-state.dto'
import { TasksService } from './tasks.service'

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get()
    getById(@Query('taskId') taskId: string, @Session() session) {
        return this.tasksService.getById(taskId, session.user)
    }

    @Get('list')
    listPaginate(@Query() paginationQuery: ListPaginateDto, @Session() session) {
        return this.tasksService.listPaginate(paginationQuery, session.user)
    }

    @Post('create')
    createTask(@Body() dto: TaskCreateDto, @Session() session) {
        return this.tasksService.createTask(dto, session.user)
    }

    @Patch('setExecutans')
    setExecutans(@Body() dto: TaskManageUsers, @Session() session) {
        return this.tasksService.manageAccess(dto, session.user, TaskManageModes.SET_USERS)
    }

    @Patch('setState')
    setState(@Body() dto: TaskStateDto, @Session() session) {
        return this.tasksService.setTaskState(dto, session.user, dto.value)
    }

    @Delete()
    removeTask(@Query('taskId') taskId: string, @Session() session) {
        return this.tasksService.removeTask(taskId, session.user)
    }
}
