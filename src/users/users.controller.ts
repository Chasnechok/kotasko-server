import { Body, Controller, Get, UseGuards, Patch, Put, Delete, Session, Header } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { Roles } from 'src/auth/roles.decorator'
import { SelfOrAdmin } from 'src/auth/self-admin.decorator'
import { DeleteUsersDto } from './dtos/delete-user.dto'
import { AddDepDto, ClearDepDto } from './dtos/register-to-dep.dto'
import { ResetUserDto } from './dtos/reset-user.dto'
import { SetUserPasswordDto } from './dtos/set-password.dto'
import { UpdateUserRoleDto } from './dtos/update-role.dto'
import { UpdateUserStateDto } from './dtos/update-state.dto'
import { UpdateUserDto } from './dtos/update-user.dto'
import { UserRoleTypes } from './user.schema'
import { UsersService } from './users.service'

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('findActive')
    getUsers() {
        return this.usersService.findAllActive()
    }

    @Roles(UserRoleTypes.ADMIN)
    @Get('findAll')
    getAllUsers() {
        return this.usersService.findAll()
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('addRole')
    updateUserRole(@Body() dtoIn: UpdateUserRoleDto) {
        return this.usersService.addUserRole(dtoIn)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('removeRole')
    removeUserRole(@Body() dtoIn: UpdateUserRoleDto) {
        return this.usersService.removeUserRole(dtoIn)
    }

    @SelfOrAdmin('userId')
    @Patch('setPassword')
    setUserPassword(@Body() setPasswordDto: SetUserPasswordDto) {
        return this.usersService.setUserPassword(setPasswordDto)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Put('reset')
    resetUser(@Body() resetUserDto: ResetUserDto) {
        return this.usersService.resetUser(resetUserDto)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Delete('delete')
    deleteUsers(@Body() deleteUsersDto: DeleteUsersDto) {
        return this.usersService.deleteUsers(deleteUsersDto)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('updateUserState')
    updateUserState(@Body() updateStateDto: UpdateUserStateDto) {
        return this.usersService.updateUserState(updateStateDto)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('registerToDepartment')
    registerToDepartment(@Body() dtoIn: AddDepDto) {
        return this.usersService.manageUserDepartment(dtoIn)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Patch('clearDepartments')
    unregisterFromDepartment(@Body() dtoIn: ClearDepDto) {
        return this.usersService.manageUserDepartment(dtoIn, true)
    }

    @Get('info')
    @Header('Cache-Control', 'none')
    getUserInfo(@Session() session) {
        return this.usersService.getInfo(session.user)
    }

    @Roles(UserRoleTypes.ADMIN)
    @Put('update')
    updateUser(@Body() dtoIn: UpdateUserDto) {
        return this.usersService.updateUser(dtoIn)
    }
}
