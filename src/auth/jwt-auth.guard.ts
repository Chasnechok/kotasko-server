import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { User } from "src/users/user.schema";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();
        try {
            const session = req.session;
            
            if(!session || !session.user) {
                throw new Error();
            }
            const user: User = session.user;
            /**
             * Roles: only specific roles allowed
             * selfOrAdmin: useCase only allowed for callers with their id matching the target id or for admins
             */
            const roles = this.reflector.get<string[]>('roles', context.getHandler());
            const selfOrAdmin = this.reflector.get<string>('selfOrAdmin', context.getHandler())
            req.user = user;

            if (!roles && !selfOrAdmin) {
                return true;
            }

            if(!selfOrAdmin) {
                return this.compareRoles(roles, user.role);
            }
            
            const targetEntity = req.body[selfOrAdmin];
            if(!roles) {
                return targetEntity === user.id || user.role === 'admin';
            }

            return this.compareRoles(roles, user.role) && (targetEntity === user.id || user.role === 'admin')

        } catch (error) {
            throw new UnauthorizedException('User is not authorized!')
        }
    }

    private compareRoles(allowedRoles: string[], userRole: string): boolean {
        return allowedRoles.some(role => role === userRole)
    }


}