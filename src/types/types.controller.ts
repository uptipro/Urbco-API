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
import { TypesService } from './types.service';
import { hasRoles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/role-guard';

@Controller('types')
export class TypesController {
    constructor(private readonly typeService: TypesService) {}

    @Get('')
    async listTypes(@Query() query) {
        let data = await this.typeService.findAll(query);
        return {
            message: 'Types List',
            status: 'ok',
            data,
        };
    }

    @hasRoles('create-types')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('')
    async createFeature(@Body() obj: any, @Req() req: any) {
        let data = await this.typeService.create(obj, req.user.id);
        return {
            message: 'Created Types',
            status: 'ok',
            data,
        };
    }

    @hasRoles('edit-types')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    async updateDetails(
        @Param('id') id: string,
        @Body() obj: any,
        @Req() req: any,
    ) {
        let data = await this.typeService.editFeature(id, obj, req.user.id);
        return {
            message: 'Type has been updated',
            status: 'ok',
            data,
        };
    }
}
