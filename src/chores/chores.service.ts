import { ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import ListPaginateDto from 'src/pagination/list-paginate.dto'
import { User, UserRoleTypes } from 'src/users/user.schema'
import { Chore, ChoreStates } from './chore.schema'
import { CreateChoreDto } from './dto/create-chore.dto'
import SetChoreState from './dto/set-chore-state.dto'
import SetChoreType from './dto/set-chore-type.dto'
import { PaginationService } from 'src/pagination/pagination.service'
import { Types } from 'mongoose'
import { MessagesService } from 'src/messages/messages.service'
import { NotificationsService } from 'src/notifications/notifications.service'
import { SetChoreSolvers } from './dto/set-chore-solvers.dto'
import { UsersService } from 'src/users/users.service'
import { NotificationsTypes } from 'src/notifications/notification.schema'

@Injectable()
export class ChoresService {
    constructor(
        @InjectModel(Chore.name) private choreModel: Model<Chore>,
        private paginationService: PaginationService,
        @Inject(forwardRef(() => MessagesService))
        private messagesService: MessagesService,
        private usersService: UsersService,
        private notificationsService: NotificationsService
    ) {}

    async create(dtoIn: CreateChoreDto, creator: User): Promise<Chore> {
        const chore = new this.choreModel({ ...dtoIn, creator })
        const techs = await this.usersService.findTechnicians()
        this.notificationsService.create(creator, NotificationsTypes.NEW_CHORE, techs, chore)
        return chore.save()
    }

    async setType(dtoIn: SetChoreType, caller: User) {
        const target = await this.getById(dtoIn.choreId)
        if (!target.hasAccess(caller, true)) {
            throw new ForbiddenException()
        }
        target.types = dtoIn.types
        return target.save()
    }

    async listPaginate(dtoIn: ListPaginateDto, caller: User) {
        const addQuery = !caller.roles.includes(UserRoleTypes.TECHNICIAN) ? { creator: Types.ObjectId(caller.id) } : {}
        const { query, sort } = this.paginationService.generatePaginationQuery(dtoIn.cursor, addQuery, dtoIn.sort)
        const chores = await this.choreModel.aggregate([
            { $match: query },
            {
                $sort: { createdAt: sort },
            },
            { $limit: dtoIn.limit },
            {
                $lookup: {
                    from: 'users',
                    let: { creatorId: '$creator' },
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                details: 1,
                                department: 1,
                                roles: 1,
                                room: 1,
                                bid: { $toObjectId: '$$creatorId' },
                            },
                        },
                        { $match: { $expr: { $eq: ['$_id', '$bid'] } } },
                        {
                            $lookup: {
                                from: 'departments',
                                localField: 'department',
                                foreignField: '_id',
                                as: 'department',
                            },
                        },
                        { $unwind: '$department' },
                        { $project: { bid: 0 } },
                    ],
                    as: 'creator',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'solvers',
                    foreignField: '_id',
                    as: 'solvers',
                },
            },
            { $unwind: '$creator' },
            {
                $project: {
                    solvers: { details: 1, _id: 1 },
                    creator: 1,
                    details: 1,
                    types: 1,
                    state: 1,
                    solvedAt: 1,
                    createdAt: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    data: {
                        $push: '$$ROOT',
                    },
                    nextCursor: { $last: '$_id' },
                },
            },
            {
                $project: { _id: 0 },
            },
        ])
        return chores && chores.length ? chores[0] : {}
    }

    async setState(dtoIn: SetChoreState, caller: User) {
        const target = await this.getById(dtoIn.choreId)
        if (!target.hasAccess(caller, true)) {
            throw new ForbiddenException()
        }
        target.state = dtoIn.state
        if (dtoIn.state === ChoreStates.SOLVED) {
            const techs = await this.usersService.findTechnicians()
            this.notificationsService.removeForEntity<Chore>(target, techs)
        }
        return target.save()
    }

    async setSolvers(dtoIn: SetChoreSolvers, caller: User) {
        const target = await this.getById(dtoIn.choreId)
        if (dtoIn.mode === 'add' && !target.solvers.some((u) => u.id === caller.id)) {
            target.solvers = [caller.id, ...target.solvers]
        } else target.solvers = target.solvers.filter((s) => s.id !== caller.id)
        return target.save()
    }

    async getInfo(choreId: string, caller: User): Promise<Chore> {
        const target = await this.getById(choreId)
        if (!target.hasAccess(caller)) {
            throw new ForbiddenException()
        }
        return target
    }

    async getById(choreId: string): Promise<Chore> {
        const chore = await this.choreModel.findById(choreId)
        if (!chore) throw new NotFoundException(`Chore with ${choreId} id was not found!`)
        return chore
    }

    async remove(choreId: string, caller: User) {
        const target = await this.getById(choreId)
        if (!target.hasAccess(caller)) {
            throw new ForbiddenException()
        }
        await this.messagesService.removeForEntity<Chore>(target)
        const techs = await this.usersService.findTechnicians()
        await this.notificationsService.removeForEntity<Chore>(target, techs)
        return target.remove()
    }
}
