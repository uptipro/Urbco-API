import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './entities/role.entity';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { permissions } from 'src/utils/data';

@Injectable({})
export class RoleService {
    constructor(
        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,

        @InjectModel(Permission.name)
        private readonly permissionModel: Model<PermissionDocument>,
    ) {}

    getPermissions() {
        return this.permissionModel.find({}).exec();
    }

    findAll() {
        return this.roleModel.find({}).exec();
    }

    count() {
        return this.roleModel.countDocuments();
    }

    async loadPermissions() {
        let find = await this.getPermissions();
        if (permissions.length > find.length) {
            let created = [];
            await Promise.all(
                permissions.map(async (permission) => {
                    let findPermissions = await this.permissionModel.findOne({
                        code: permission.code,
                    });
                    if (!findPermissions) {
                        let createPermission =
                            await this.permissionModel.create({
                                name: permission.name,
                                code: permission.code,
                            });
                        if (createPermission) {
                            created.push(permission);
                        }
                    }
                }),
            );
            return created;
        } else {
            return find;
        }
    }

    getRoles() {
        return this.roleModel.find({}).exec();
    }

    async createRole(createRoleDto: CreateRoleDto) {
        let find = await this.roleModel.findOne({ name: createRoleDto.name });

        if (find) {
            throw new HttpException('Role already exists', 401);
        }

        let create = await this.roleModel.create(createRoleDto);
        return create;
    }

    async updateRole(id: string, createRoleDto: CreateRoleDto) {
        let find = await this.roleModel.findById(id);

        if (!find) {
            throw new HttpException('Role not found', 404);
        }

        find.name = createRoleDto.name || find.name;
        find.permissions = createRoleDto.permissions || find.permissions;

        await find.save();

        return find;
    }

    async loadSuperAdmin() {
        let getList = permissions.map((p) => {
            return p.code;
        });

        let find = await this.roleModel.findOne({ name: 'Super Admin' });

        if (!find) {
            let create = await this.roleModel.create({
                name: 'Super Admin',
                permissions: getList,
            });
            return create;
        } else {
            find.permissions = getList;

            await find.save();

            return find;
        }
    }
}
