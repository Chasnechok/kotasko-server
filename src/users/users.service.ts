import { forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { RegisterUserDto } from "src/auth/dtos/auth.dto";
import { UpdateUserRoleDto } from "./dtos/update-role.dto";
import { UpdateUserStateDto } from "./dtos/update-state.dto";
import { SetUserPasswordDto } from "./dtos/set-password.dto";
import * as bcryptjs from 'bcryptjs';
import { ResetUserDto } from "./dtos/reset-user.dto";
import { customAlphabet } from 'nanoid'
import { DeleteUsersDto } from "./dtos/delete-user.dto";
import { ManageDepDto } from "./dtos/register-to-dep.dto";
import { DepartmentsService } from "src/departments/departments.service";
const nanoid = customAlphabet('0123456789ABCDEF', 4)

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>, private departmentsService: DepartmentsService) {}

    async createUser(createUserDto: RegisterUserDto): Promise<User> {
      const createdUser = new this.userModel(createUserDto);
      return createdUser.save();
    }

    async findByLogin(login: string): Promise<User> {
      const user = await this.userModel.findOne({login})
      return user;
    }

    async updateUserRole(updateRoleDto: UpdateUserRoleDto): Promise<User> {
      const user = await this.findById(updateRoleDto.userId)
      user.role = updateRoleDto.value;
      return user.save();
    }

    async updateUserState(updateStateDto: UpdateUserStateDto): Promise<User> {
      const user = await this.findById(updateStateDto.userId);
      user.state = updateStateDto.value;
      return user.save();
    }

    async setUserPassword(setPasswordDto: SetUserPasswordDto): Promise<User> {
      const user = await this.findById(setPasswordDto.userId);
      const hashedPassword = await bcryptjs.hash(setPasswordDto.value, 5);
      user.password = hashedPassword;
      if(user.state === 'created') user.state = 'active';
      return user.save();
    }

    async resetUser(resetUserDto: ResetUserDto): Promise<Object> {
      const user = await this.findById(resetUserDto.userId);
      const OTP = nanoid() + '-' + nanoid() + '-' + nanoid();
      const hashedPassword = await bcryptjs.hash(OTP, 5);
      user.state = 'created';
      user.password = hashedPassword;
      user.save();
      return { resetUser: user.id, role: user.role, details: user.details, login: user.login, password: OTP };
    }

    async deleteUsers(deleteUsersDto: DeleteUsersDto) {
      return await this.userModel.deleteMany({
        _id: {
          $in: deleteUsersDto.userIds
        }
      })
    }

    async manageUserDepartment(registerToDepDto: ManageDepDto, register: boolean) {
      const user = await this.findById(registerToDepDto.userId);
      const dtoOut = {
        success: [],
        skipped: [],
        allDepartments: []
      }
      await Promise.all(registerToDepDto.departmentIds.map(async (depId) => {
        const department = await this.departmentsService.findById(depId);
        if(department && register ? !user.departments.some(dep => dep.id === depId) : user.departments.some(dep => dep.id === depId)) {
          if(register) user.departments.push(department);
          dtoOut.success.push(department.id);
        } else {
          dtoOut.skipped.push(depId)
        }
      }))
      if(!register) user.departments = user.departments.filter(dep => !dtoOut.success.includes(dep.id));
      dtoOut.allDepartments = user.departments;
      user.save();
      return dtoOut;
    }

    async findByDepartment(departmentId: string): Promise<User[]> {
      return this.userModel.find({
        departments: departmentId
      }, {
        details: 1
      })
    }

    async findAll(): Promise<User[]> {
      return this.userModel.find({}, {password: 0}).populate({ 
        path: 'departments',
        populate: {
          path: 'organisation',
          populate: {
            path: 'head',
            select: 'details'
          }
        } 
     });
    }

    async findById(id: string): Promise<User> {
      const user = await this.userModel.findById(id, {password: 0}).populate('departments')
      if(!user) throw new NotFoundException(`User with ${id} id was not found!`)
      return user;
    }

}  