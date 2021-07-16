import { CanActivate, ExecutionContext, Global, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SESSION_PARSER } from 'src/main'
import { User } from 'src/users/user.schema'

@Global()
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const session = await this.getSession(context)

            if (!session || !session.user) {
                throw new Error()
            }
            const user: User = session.user
            const roles = this.reflector.get<string[]>('roles', context.getHandler())
            if (!roles) {
                return true
            }
            return this.compareRoles(roles, user.roles)
        } catch (error) {
            throw new UnauthorizedException('User is not authorized!')
        }
    }

    private compareRoles(allowedRoles: string[], userRoles: string[]): boolean {
        return allowedRoles.some((role) => userRoles.includes(role))
    }

    private async getSession(context: ExecutionContext) {
        if (context.getType() == 'ws') {
            const client = context.switchToWs().getClient()
            const handshake = client.handshake
            await new Promise((res) => SESSION_PARSER(handshake, context.switchToHttp().getResponse(), res))
            return handshake.session
        }
        const req = context.switchToHttp().getRequest()
        return req.session
    }
}
