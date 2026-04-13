import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { permissions } from 'src/utils/data';

@Injectable({})
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,

        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) { }

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
}
