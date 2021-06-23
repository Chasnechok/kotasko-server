import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from 'src/users/users.service';
import { UsersController } from 'src/users/users.controller'
import { User, UserSchema } from './user.schema';
import { AuthModule } from 'src/auth/auth.module';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => DepartmentsModule)
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}