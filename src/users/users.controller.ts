import {
  Body,
  Controller,
  Get,
  UseGuards,
  Patch,
  Put,
  Delete,
  Session,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { SelfOrAdmin } from 'src/auth/self-admin.decorator';
import { ValidationPipe } from 'src/validation.pipe';
import { DeleteUsersDto } from './dtos/delete-user.dto';
import { ManageDepDto } from './dtos/register-to-dep.dto';
import { ResetUserDto } from './dtos/reset-user.dto';
import { SetUserPasswordDto } from './dtos/set-password.dto';
import { UpdateUserRoleDto } from './dtos/update-role.dto';
import { UpdateUserStateDto } from './dtos/update-state.dto';
import { UsersService } from './users.service';

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('list')
  getUsers() {
    return this.usersService.findAll();
  }

  @Roles('admin')
  @Patch('updateRole')
  updateUserRole(
    @Body(new ValidationPipe()) updateUserRole: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(updateUserRole);
  }

  @SelfOrAdmin('userId')
  @Patch('setPassword')
  setUserPassword(
    @Body(new ValidationPipe()) setPasswordDto: SetUserPasswordDto,
  ) {
    return this.usersService.setUserPassword(setPasswordDto);
  }

  @Roles('admin')
  @Put('resetUser')
  resetUser(@Body(new ValidationPipe()) resetUserDto: ResetUserDto) {
    return this.usersService.resetUser(resetUserDto);
  }

  @Roles('admin')
  @Delete('delete')
  deleteUsers(@Body(new ValidationPipe()) deleteUsersDto: DeleteUsersDto) {
    return this.usersService.deleteUsers(deleteUsersDto);
  }

  @Roles('admin')
  @Patch('updateUserState')
  updateUserState(
    @Body(new ValidationPipe()) updateStateDto: UpdateUserStateDto,
  ) {
    return this.usersService.updateUserState(updateStateDto);
  }

  @Roles('admin')
  @Patch('registerToDepartment')
  registerToDepartment(
    @Body(new ValidationPipe()) registerToDepDto: ManageDepDto,
  ) {
    return this.usersService.manageUserDepartment(registerToDepDto, true);
  }

  @Roles('admin')
  @Patch('unregisterFromDepartment')
  unregisterFromDepartment(
    @Body(new ValidationPipe()) unregisterFromDepDto: ManageDepDto,
  ) {
    return this.usersService.manageUserDepartment(unregisterFromDepDto, false);
  }

  @Get('info')
  getUserInfo(@Session() session) {
    return this.usersService.findById(session.user._id);
  }

  @Roles('admin')
  @Patch('updateDetails')
  updateDetails() {}
}
