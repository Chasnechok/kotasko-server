import { forwardRef, Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Session } from './session.schema'
import { UsersModule } from 'src/users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { SessionSchema } from './session.schema'

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]), UsersModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
