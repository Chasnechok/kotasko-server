import { forwardRef, Global, Module } from '@nestjs/common'
import { UsersModule } from 'src/users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Global()
@Module({
    imports: [forwardRef(() => UsersModule)],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
