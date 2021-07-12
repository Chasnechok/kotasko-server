import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { User, UserStatesTypes } from 'src/users/user.schema'
import { UsersService } from 'src/users/users.service'
import { LoginUserDto, RegisterUserDto } from './dtos/auth.dto'
import * as bcryptjs from 'bcryptjs'
import { customAlphabet } from 'nanoid'
import { Session } from 'express-session'
import { FinishRegDto } from './dtos/finish-reg.dto'
const nanoid = customAlphabet('0123456789ABCDEF', 4)

@Injectable()
export class AuthService {
    constructor(private userService: UsersService) {}

    async login(loginUserDto: LoginUserDto, session): Promise<User> {
        const user = await this.validateUser(loginUserDto)
        session.user = user.toJSON()
        return user
    }

    async logout(session: Session): Promise<Session> {
        return session.destroy((err) => {
            if (err) console.error(err)
        })
    }
    async register(registerUserDto: RegisterUserDto): Promise<Object> {
        // if there is an existing user add some random numbers to login
        let login = registerUserDto.login
        while (true) {
            const candidate = await this.userService.findByLogin(login)
            if (candidate) login += ~~(Math.random() * login.length)
            if (!candidate) break
        }
        const OTP = nanoid() + '-' + nanoid() + '-' + nanoid()
        const hashPassword: string = await bcryptjs.hash(OTP, 5)
        const user = await this.userService.createUser({ ...registerUserDto, login, password: hashPassword })
        return { ...user.toJSON(), password: OTP }
    }

    async finishRegistration(dtoIn: FinishRegDto, caller: User) {
        const target = await this.userService.findById(caller.id)
        if (!dtoIn.password && target.state === UserStatesTypes.CREATED) {
            throw new BadRequestException('You must provide a valid password to activate user!')
        }
        if (dtoIn.password && target.state === UserStatesTypes.CREATED) {
            target.password = await bcryptjs.hash(dtoIn.password, 5)
        }
        target.department = dtoIn.department || target.department
        target.room = dtoIn.room || target.room
        target.details.mobile = dtoIn.mobile || target.details.mobile
        target.state = UserStatesTypes.ACTIVE
        await target.save()
        const targetSessions = await this.userService.sessionByUserId(target.id)
        targetSessions.forEach((s) => {
            const data = JSON.parse(s.session)
            data.user = target
            s.session = JSON.stringify(data)
            s.save()
        })
        return target
    }

    private async validateUser(loginUserDto: LoginUserDto) {
        const candidate = await this.userService.findByLogin(loginUserDto.login)
        if (candidate && candidate.password) {
            const passwordsAreEqual = await bcryptjs.compare(loginUserDto.password, candidate.password)
            if (passwordsAreEqual) {
                return candidate
            }
        }
        throw new UnauthorizedException('Неверный логин или пароль!')
    }
}
