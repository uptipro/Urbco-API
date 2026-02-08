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
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/property.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { hasRoles } from 'src/auth/decorators/role.decorator';

@Controller('properties')
export class PropertyController {
    constructor(private readonly propertyService: PropertyService) {}

    @Get('')
    async listProperties(@Query() query) {
        let data = await this.propertyService.listAndFilter(query);
        return {
            message: 'Property List',
            status: 'ok',
            data,
        };
    }

    @hasRoles('create-properties')
    @UseGuards(JwtAuthGuard)
    @Post('')
    async createProperty(
        @Body() createPropertyDto: CreatePropertyDto,
        @Req() req: any,
    ) {
        let data = await this.propertyService.createProperty(
            createPropertyDto,
            req.user.id,
        );
        return {
            message: 'Property List',
            status: 'ok',
            data,
        };
    }

    @Get(':id')
    async getPropertyDetails(@Param('id') id: string) {
        let data = await this.propertyService.getPropertyDetail(id);
        return {
            message: 'Property found',
            status: 'ok',
            data,
        };
    }

    @hasRoles('edit-properties')
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateProperty(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        let data = await this.propertyService.editProperty(
            id,
            body,
            req.user.id,
        );
        return {
            message: 'Property has been updated',
            status: 'ok',
            data,
        };
    }

    @hasRoles('edit-properties')
    @UseGuards(JwtAuthGuard)
    @Post(':id/change-status')
    async updatePropertyStatus(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        let data = await this.propertyService.editPropertyStatus(
            id,
            body,
            req.user.id,
        );
        return {
            message: 'Property Status has been updated',
            status: 'ok',
            data,
        };
    }
}
