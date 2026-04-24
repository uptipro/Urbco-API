import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { permissions } from 'src/utils/data';

@Injectable({})
export class RoleService implements OnModuleInit {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,

        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) { }

    async onModuleInit() {
        await this.loadPermissions();
        await this.loadSuperAdmin();
        await this.seedRoles();
    }

    getPermissions() {
        return this.permissionRepository.find();
    }

    findAll() {
        return this.roleRepository.find();
    }

    count() {
        return this.roleRepository.count();
    }

    async loadPermissions() {
        let find = await this.getPermissions();
        if (permissions.length > find.length) {
            let created = [];
            await Promise.all(
                permissions.map(async (permission) => {
                    let findPermissions = await this.permissionRepository.findOne({
                        where: { code: permission.code },
                    });
                    if (!findPermissions) {
                        let createPermission = await this.permissionRepository.save(
                            this.permissionRepository.create({
                                name: permission.name,
                                code: permission.code,
                            }),
                        );
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
        return this.roleRepository.find();
    }

    async createRole(createRoleDto: CreateRoleDto) {
        let find = await this.roleRepository.findOne({ where: { name: createRoleDto.name } });

        if (find) {
            throw new HttpException('Role already exists', 401);
        }

        let create = await this.roleRepository.save(
            this.roleRepository.create(createRoleDto),
        );
        return create;
    }

    async updateRole(id: string, createRoleDto: CreateRoleDto) {
        let find = await this.roleRepository.findOne({ where: { id } });

        if (!find) {
            throw new HttpException('Role not found', 404);
        }

        find.name = createRoleDto.name || find.name;
        find.permissions = createRoleDto.permissions || find.permissions;

        return this.roleRepository.save(find);
    }

    async loadSuperAdmin() {
        let getList = permissions.map((p) => p.code);

        let find = await this.roleRepository.findOne({ where: { name: 'Super Admin' } });

        if (!find) {
            let create = await this.roleRepository.save(
                this.roleRepository.create({
                    name: 'Super Admin',
                    permissions: getList,
                }),
            );
            return create;
        } else {
            find.permissions = getList;
            return this.roleRepository.save(find);
        }
    }

    async seedRoles() {
        const adminPermissions = [
            'dashboard-stats',
            'get-users', 'create-user', 'edit-user',
            'get-roles', 'create-role', 'edit-role',
            'view-features', 'create-features', 'edit-features',
            'view-properties', 'create-properties', 'edit-properties',
            'view-types', 'create-types', 'edit-types',
            'get-investors', 'view-investments', 'view-transactions', 'create-investment',
        ];
        const viewerPermissions = [
            'dashboard-stats',
            'view-properties', 'view-types', 'view-features',
            'get-investors', 'view-investments', 'view-transactions',
        ];

        const rolesToSeed = [
            { name: 'Admin', permissions: adminPermissions },
            { name: 'Viewer', permissions: viewerPermissions },
        ];

        for (const roleData of rolesToSeed) {
            let find = await this.roleRepository.findOne({ where: { name: roleData.name } });
            if (!find) {
                await this.roleRepository.save(
                    this.roleRepository.create({
                        name: roleData.name,
                        permissions: roleData.permissions,
                    }),
                );
            } else {
                find.permissions = roleData.permissions;
                await this.roleRepository.save(find);
            }
        }
    }
}
