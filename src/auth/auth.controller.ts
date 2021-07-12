import { Body, Controller, Get, Header, HttpCode, Patch, Post, Session, UseGuards } from '@nestjs/common'
import { Session as SessionType } from 'express-session'
import { UserRoleTypes } from 'src/users/user.schema'
import { AuthService } from './auth.service'
import { LoginUserDto, RegisterUserDto } from './dtos/auth.dto'
import { FinishRegDto } from './dtos/finish-reg.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { Roles } from './roles.decorator'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    @HttpCode(200)
    login(@Body() loginDto: LoginUserDto, @Session() session: SessionType) {
        return this.authService.login(loginDto, session)
    }

    @UseGuards(JwtAuthGuard)
    @Roles(UserRoleTypes.ADMIN)
    @Post('register')
    register(@Body() registerDto: RegisterUserDto) {
        return this.authService.register(registerDto)
    }

    @Get('logout')
    logout(@Session() session: SessionType) {
        return this.authService.logout(session)
    }

    @UseGuards(JwtAuthGuard)
    @Header('Cache-Control', 'none')
    @Get('checkSession')
    checkAuth(@Session() session) {
        return session.user
    }

    @UseGuards(JwtAuthGuard)
    @Patch('finishRegistartion')
    finishRegistartion(@Body() dtoIn: FinishRegDto, @Session() session) {
        return this.authService.finishRegistration(dtoIn, session.user)
    }
}
