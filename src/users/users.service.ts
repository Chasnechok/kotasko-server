import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User, UserRoleTypes, UserStatesTypes } from './user.schema'
import { FilterQuery, Model } from 'mongoose'
import { UpdateUserRoleDto } from './dtos/update-role.dto'
import { UpdateUserStateDto } from './dtos/update-state.dto'
import { SetUserPasswordDto } from './dtos/set-password.dto'
import * as bcryptjs from 'bcryptjs'
import { ResetUserDto } from './dtos/reset-user.dto'
import { customAlphabet } from 'nanoid'
import { DeleteUsersDto } from './dtos/delete-user.dto'
import { AddDepDto } from './dtos/register-to-dep.dto'
import { DepartmentsService } from 'src/departments/departments.service'
import { CreateUserDto } from './dtos/create-user.dto'
import { UpdateUserDto } from './dtos/update-user.dto'
import { AuthService } from 'src/auth/auth.service'

const nanoid = customAlphabet('0123456789ABCDEF', 4)

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private departmentsService: DepartmentsService,
        private authService: AuthService
    ) {}

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const createdUser = new this.userModel(createUserDto)
        return createdUser.save()
    }

    async findByLogin(login: string): Promise<User> {
        return this.userModel.findOne({ login })
    }

    async addUserRole(dtoIn: UpdateUserRoleDto): Promise<User> {
        const user = await this.findById(dtoIn.userId)
        if (!user.roles.includes(dtoIn.value)) {
            user.roles.push(dtoIn.value)
        }
        return user.save()
    }

    async updateUser(dtoIn: UpdateUserDto): Promise<User> {
        const user = await this.findById(dtoIn.userId)
        user.details = dtoIn.details || user.details
        user.roles = dtoIn.roles || user.roles
        user.quota = typeof dtoIn.quota !== undefined ? dtoIn.quota : user.quota
        await this.updateUserInSession(user)
        return user.save()
    }

    async removeUserRole(dtoIn: UpdateUserRoleDto): Promise<User> {
        const user = await this.findById(dtoIn.userId)
        user.roles = user.roles.filter((role) => role !== dtoIn.value)
        return user.save()
    }

    async updateUserState(updateStateDto: UpdateUserStateDto): Promise<User> {
        const user = await this.findById(updateStateDto.userId)
        user.state = updateStateDto.value
        return user.save()
    }

    async setUserPassword(setPasswordDto: SetUserPasswordDto, caller: User): Promise<User> {
        const user = await this.findById(setPasswordDto.userId)
        if (user.id !== caller.id && !caller.roles.includes(UserRoleTypes.ADMIN)) {
            throw new ForbiddenException()
        }
        user.password = await bcryptjs.hash(setPasswordDto.value, 5)
        if (user.state === UserStatesTypes.CREATED) user.state = UserStatesTypes.ACTIVE
        return user.save()
    }

    async resetUser(resetUserDto: ResetUserDto): Promise<User> {
        const user = await this.findById(resetUserDto.userId)
        const OTP = nanoid() + '-' + nanoid() + '-' + nanoid()
        const hashedPassword = await bcryptjs.hash(OTP, 5)
        user.state = UserStatesTypes.CREATED
        user.password = hashedPassword
        const userSessions = await this.authService.sessionByUserId(user.id)
        userSessions.forEach((s) => {
            s.remove()
        })
        await user.save()
        return { ...user.toJSON(), password: OTP } as User
    }

    async deleteUsers(dtoIn: DeleteUsersDto) {
        for (const userId of dtoIn.userIds) {
            const userSessions = await this.authService.sessionByUserId(userId)
            userSessions.forEach((s) => s.remove())
        }
        return this.userModel.deleteMany({
            _id: {
                $in: dtoIn.userIds,
            },
        })
    }

    async manageUserDepartment(dtoIn: AddDepDto, clear = false) {
        const user = await this.findById(dtoIn.userId)
        if (!clear) {
            user.department = await this.departmentsService.findById(dtoIn.departmentId)
        } else {
            user.department = null
        }
        await this.updateUserInSession(user)
        return user.save()
    }

    async findByDepartment(departmentId): Promise<User[]> {
        return this.userModel.find(
            {
                department: departmentId,
            },
            {
                details: 1,
            }
        )
    }

    async findAll(query?: FilterQuery<User>): Promise<User[]> {
        return this.userModel.find(query || {}).sort({
            createdAt: 'desc',
        })
    }

    async findAllActive() {
        return this.userModel
            .find({
                state: UserStatesTypes.ACTIVE,
            })
            .sort({
                createdAt: 'desc',
            })
    }

    async findById(id: string): Promise<User> {
        const user = await this.userModel.findById(id)
        if (!user) throw new NotFoundException(`User with ${id} id was not found!`)
        return user
    }

    async getInfo(user: User): Promise<User> {
        return await this.findById(user.id)
    }

    async findTechnicians(): Promise<User[]> {
        return this.userModel.find({ roles: UserRoleTypes.TECHNICIAN })
    }

    private async updateUserInSession(user: User) {
        const userSessions = await this.authService.sessionByUserId(user.id)
        userSessions.forEach((s) => {
            const data = JSON.parse(s.session)
            data.user = user
            s.session = JSON.stringify(data)
            s.save()
        })
    }
}
