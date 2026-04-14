import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,

        private userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.get<string[]>(
            'roles',
            context.getHandler(),
        );
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = await this.userService.findById(request.user.id);

        // Super-admins bypass all role checks
        if (user.user_type === 'admin') {
            return true;
        }

        if (!user.role_id || !user.role_id.permissions) {
            return false;
        }

        const found = user.role_id.permissions.some(
            (r) => roles.indexOf(r) >= 0,
        );
        return found;
    }
}
