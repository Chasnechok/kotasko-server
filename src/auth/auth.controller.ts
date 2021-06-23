import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Session,
  UseGuards,
} from '@nestjs/common';
import { Session as SessionType } from 'express-session';
import { ValidationPipe } from 'src/validation.pipe';
import { AuthService } from './auth.service';
import { LoginUserDto, RegisterUserDto } from './dtos/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ValidationPipe()) loginDto: LoginUserDto,
    @Session() session: SessionType,
  ) {
    return this.authService.login(loginDto, session);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Post('register')
  register(
    @Body(new ValidationPipe()) registerDto: RegisterUserDto,
    @Session() session: SessionType,
  ) {
    return this.authService.register(registerDto, session);
  }

  @Get('logout')
  logout(@Session() session: SessionType) {
    return this.authService.logout(session);
  }

  // will throw 400 if session cookie is not valid
  @UseGuards(JwtAuthGuard)
  @Get('checkSession')
  checkAuth() {
    return;
  }
}
