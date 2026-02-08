import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './entities/role.entity';
import { Permission, PermissionSchema } from './entities/permission.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
        MongooseModule.forFeature([
            { name: Permission.name, schema: PermissionSchema },
        ]),
    ],
    providers: [RoleService],
    controllers: [RoleController],
    exports: [RoleService],
})
export class RoleModule {}
