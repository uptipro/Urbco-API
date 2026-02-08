import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { hasRoles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role-guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @hasRoles('get-users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('')
    async listUsers(@Query() query) {
        let data = await this.userService.filterAndPaginateUsers(query);
        return {
            message: 'User List',
            status: 'ok',
            data,
        };
    }

    // @UseGuards(JwtAuthGuard)
    @Post('')
    async createUser(@Body() createUserDto: CreateUserDto) {
        let data = await this.userService.createUser(createUserDto);
        return {
            message: 'User has been created',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async updateDetails(@Param('id') id: string) {
        let data = await this.userService.userDetails(id);
        return {
            message: 'User has been updated',
            status: 'ok',
            data,
        };
    }

    // @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        let data = await this.userService.update(id, updateUserDto);
        return {
            message: 'User has been updated',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('activate/:id')
    async activateUser(@Param('id') id: string) {
        let data = await this.userService.activateUser(id);
        return {
            message: 'User has been activated',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('deactivate/:id')
    async deactivateUser(@Param('id') id: string) {
        let data = await this.userService.deactivateUser(id);
        return {
            message: 'User has been deactivated',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(
        @Body() changePasswordDto: ChangePasswordDto,
        @Req() req: any,
    ) {
        let data = await this.userService.changePassword(
            req.user.id,
            changePasswordDto,
        );
        return {
            message: 'Passwords has been changed.',
            status: 'ok',
            data,
        };
    }
}
