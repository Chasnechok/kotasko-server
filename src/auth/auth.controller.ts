import { Body, Controller, Get, Header, HttpCode, Patch, Post, Session, UseGuards } from '@nestjs/common'
import { Session as ExpressSession } from 'express-session'
import { UserRoleTypes } from 'src/users/user.schema'
import { AuthService } from './auth.service'
import { LoginUserDto, RegisterUserDto } from './dtos/auth.dto'
import { FinishRegDto } from './dtos/finish-reg.dto'
import { AuthGuard } from './auth.guard'
import { Roles } from './roles.decorator'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    @HttpCode(200)
    login(@Body() loginDto: LoginUserDto, @Session() session: ExpressSession) {
        return this.authService.login(loginDto, session)
    }

    @UseGuards(AuthGuard)
    @Roles(UserRoleTypes.ADMIN)
    @Post('register')
    register(@Body() registerDto: RegisterUserDto) {
        return this.authService.register(registerDto)
    }

    @Get('logout')
    logout(@Session() session: ExpressSession) {
        return this.authService.logout(session)
    }

    @UseGuards(AuthGuard)
    @Header('Cache-Control', 'none')
    @Get('checkSession')
    checkAuth(@Session() session) {
        return session.user
    }

    @UseGuards(AuthGuard)
    @Patch('finishRegistration')
    finishRegistration(@Body() dtoIn: FinishRegDto, @Session() session) {
        return this.authService.finishRegistration(dtoIn, session.user)
    }
}
