import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { IsMobilePhone, IsOptional, IsString } from 'class-validator'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { Department } from '../departments/department.schema'

export class IUserDetails {
    @IsString()
    firstName: string
    @IsString()
    lastName: string
    @IsOptional()
    @IsString()
    @IsMobilePhone('uk-UA')
    mobile: string
}

export enum UserRoleTypes {
    ADMIN = 'ADMIN',
    TECHNICIAN = 'TECHNICIAN',
    USER = 'USER',
    REVISOR = 'REVISOR',
}

export enum UserStatesTypes {
    CREATED = 'CREATED',
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
}

@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret, options) {
            delete ret.password
            delete ret.__v
        },
    },
})
export class User extends Document {
    @Prop({ required: true })
    login: string

    @Prop({ required: true })
    password: string

    @Prop({ required: true, default: [UserRoleTypes.USER], type: [{ type: MongooseSchema.Types.String }] })
    roles: UserRoleTypes[]

    // maxDepth 2 to get org name
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Department',
        autopopulate: { maxDepth: 2 },
    })
    department: Department

    @Prop(
        raw({
            firstName: { type: String },
            lastName: { type: String },
            mobile: { type: String },
        })
    )
    details: IUserDetails

    @Prop({ required: true, default: UserStatesTypes.CREATED })
    state: UserStatesTypes

    @Prop({ required: false })
    room: string

    // 500MB default
    @Prop({ required: true, default: 500 * 1e6 })
    quota: number

    @Prop({ required: true, default: 0 })
    spaceUsed: number
}

export const UserSchema = SchemaFactory.createForClass(User)
