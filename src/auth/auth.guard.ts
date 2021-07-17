import { CanActivate, ExecutionContext, Global, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { WsException } from '@nestjs/websockets'
import { Response } from 'express'
import { SESSION_PARSER } from 'src/main'
import { User } from 'src/users/user.schema'

@Global()
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const session = await this.getSession(context)
        const user: User = session.user
        const roles = this.reflector.get<string[]>('roles', context.getHandler())
        if (!roles) {
            return true
        }
        return this.compareRoles(roles, user.roles)
    }

    private compareRoles(allowedRoles: string[], userRoles: string[]): boolean {
        return allowedRoles.some((role) => userRoles.includes(role))
    }

    private async getSession(context: ExecutionContext) {
        if (context.getType() == 'ws') {
            const client = context.switchToWs().getClient()
            const handshake = client.handshake
            await new Promise((res) => SESSION_PARSER(handshake, {} as Response, res))
            if (!handshake.session || !handshake.session.user) {
                throw new WsException('User is not authorized!')
            }
            return handshake.session
        }
        const req = context.switchToHttp().getRequest()
        if (!req.session || !req.session.user) {
            throw new UnauthorizedException('User is not authorized!')
        }
        return req.session
    }
}
