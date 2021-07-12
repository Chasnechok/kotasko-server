import { Body, Controller, Delete, Get, Patch, Post, Query, Session, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { Roles } from 'src/auth/roles.decorator'
import ListPaginateDto from 'src/pagination/list-paginate.dto'
import { UserRoleTypes } from 'src/users/user.schema'
import { ChoresService } from './chores.service'
import { CreateChoreDto } from './dto/create-chore.dto'
import { IdChoreDto } from './dto/id-chore.dto'
import { SetChoreSolvers } from './dto/set-chore-solvers.dto'
import SetChoreState from './dto/set-chore-state.dto'
import SetChoreType from './dto/set-chore-type.dto'

@Controller('chores')
@UseGuards(JwtAuthGuard)
export class ChoresController {
    constructor(private readonly choresService: ChoresService) {}

    @Post('create')
    create(@Body() dtoIn: CreateChoreDto, @Session() session) {
        return this.choresService.create(dtoIn, session.user)
    }

    @Get('list')
    listPaginate(@Query() paginationQuery: ListPaginateDto, @Session() session) {
        return this.choresService.listPaginate(paginationQuery, session.user)
    }

    @Roles(UserRoleTypes.TECHNICIAN)
    @Patch('setType')
    setType(@Body() dtoIn: SetChoreType, @Session() session) {
        return this.choresService.setType(dtoIn, session.user)
    }

    @Roles(UserRoleTypes.TECHNICIAN)
    @Patch('setState')
    setState(@Body() dtoIn: SetChoreState, @Session() session) {
        return this.choresService.setState(dtoIn, session.user)
    }

    @Get()
    getInfo(@Query() query: IdChoreDto, @Session() session) {
        return this.choresService.getInfo(query.choreId, session.user)
    }

    @Delete()
    delete(@Query() query: IdChoreDto, @Session() session) {
        return this.choresService.remove(query.choreId, session.user)
    }

    @Roles(UserRoleTypes.TECHNICIAN)
    @Patch('setSolvers')
    setSolvers(@Body() dtoIn: SetChoreSolvers, @Session() session) {
        return this.choresService.setSolvers(dtoIn, session.user)
    }
}
