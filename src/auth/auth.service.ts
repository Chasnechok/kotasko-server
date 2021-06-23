import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/users/user.schema';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto, RegisterUserDto } from './dtos/auth.dto';
import * as bcryptjs from 'bcryptjs';
import { customAlphabet } from 'nanoid'
import { Session } from 'express-session';
const nanoid = customAlphabet("0123456789ABCDEF", 4)

@Injectable()
export class AuthService {
    constructor(private userService: UsersService){}

    async login(loginUserDto: LoginUserDto, session): Promise<User> {
        const user = await this.validateUser(loginUserDto);
        session.user = user;
        return user;
    }

    async logout(session: Session): Promise<Session> {
        return session.destroy((err) => {
            if(err) console.error(err);
        })
    }
    async register(registerUserDto: RegisterUserDto, session): Promise<Object> {

        // check if there is an existing user with provided login
        const candidate = await this.userService.findByLogin(registerUserDto.login);
        if(candidate) throw new BadRequestException('A user with that login already exists!');

        const OTP = nanoid() + '-' + nanoid() + '-' + nanoid();
        const hashPassword = await bcryptjs.hash(OTP, 5);
        const user = await this.userService.createUser({...registerUserDto, password: hashPassword});
        session.user = { id: user.id, role: user.role, };
        return {...user.toObject(), password: OTP};
    }

    private async validateUser(loginUserDto: LoginUserDto) {
        const candidate = await this.userService.findByLogin(loginUserDto.login);
        if(candidate && candidate.password) {
            const passwordsAreEqual = await bcryptjs.compare(loginUserDto.password, candidate.password)
            if(passwordsAreEqual) {
                return candidate;
            }
        }
        throw new UnauthorizedException('Неверный логин или пароль!')
    }

}
