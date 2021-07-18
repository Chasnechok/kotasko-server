import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { MainModelNames } from 'src/main'
import { User, UserRoleTypes } from '../users/user.schema'

export enum ChoreTypes {
    VIRUS = 'VIRUS',
    PRINTER_BROKE = 'PRINTER_BROKE',
    FILES_MISSING = 'FILES_MISSING',
    OS_SLOW = 'OS_SLOW',
    OS_REINSTALL = 'OS_REINSTALL',
    CONNECTION = 'CONNECTION',
    APP_INSTALL = 'APP_INSTALL',
    APP_HELP = 'APP_HELP',
    OTHER = 'OTHER',
}

export enum ChoreStates {
    CREATED = 'CREATED',
    SOLVING = 'SOLVING',
    SOLVED = 'SOLVED',
}
/**
 * Represents a service task
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Chore extends Document {
    @Prop({ required: true })
    details: string

    @Prop({ required: true, default: ChoreStates.CREATED })
    state: ChoreStates

    @Prop({ required: false })
    types: ChoreTypes[]

    @Prop({
        type: [
            {
                type: MongooseSchema.Types.ObjectId,
                ref: 'User',
                autopopulate: { select: 'details department', maxDepth: 2 },
            },
        ],
    })
    solvers: User[]

    @Prop({ type: MongooseSchema.Types.Date, required: false })
    solvedAt: Date

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: { select: 'details department room', maxDepth: 2 },
    })
    creator: User

    @Prop({ index: -1 })
    createdAt: Date

    /**
     * strict ? solvers contains user : user is technician
     */
    hasAccess: (user: User, strict?: boolean) => boolean

    getModelName: () => MainModelNames
}

export const ChoreSchema = SchemaFactory.createForClass(Chore)

ChoreSchema.methods.hasAccess = function (user: User, strict?: boolean) {
    const isCreator = this.creator && this.creator.id == user.id
    if (strict) {
        return isCreator || this.solvers.some((u) => u.id == user.id)
    }
    return isCreator || user.roles.includes(UserRoleTypes.TECHNICIAN)
}

ChoreSchema.methods.getModelName = () => MainModelNames.CHORES
