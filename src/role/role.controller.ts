import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';

@Controller('role')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @UseGuards(JwtAuthGuard)
    @Get('')
    async listRoles() {
        let data = await this.roleService.getRoles();
        return {
            message: 'Role List',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('')
    async createRole(@Body() createRoleDto: CreateRoleDto) {
        let data = await this.roleService.createRole(createRoleDto);
        return {
            message: 'Role Created',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateRole(
        @Param('id') id: string,
        @Body() createRoleDto: CreateRoleDto,
    ) {
        let data = await this.roleService.updateRole(id, createRoleDto);
        return {
            message: 'Role Updated',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('permissions')
    async getPermissions() {
        let data = await this.roleService.getPermissions();
        return {
            message: 'Permission List',
            status: 'ok',
            data,
        };
    }

    @Get('permissions/load')
    async loadPermissions() {
        let data = await this.roleService.loadPermissions();
        return {
            message: 'Loaded Permissions',
            status: 'ok',
            data,
        };
    }

    @Get('load-super-admin')
    async loadSuperAdmin() {
        let data = await this.roleService.loadSuperAdmin();
        return {
            message: 'Loaded Super Admin',
            status: 'ok',
            data,
        };
    }
}
