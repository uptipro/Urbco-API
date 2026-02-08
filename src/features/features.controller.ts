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
import { FeaturesService } from './features.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { hasRoles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/role-guard';

@Controller('features')
export class FeaturesController {
    constructor(private readonly featureService: FeaturesService) {}

    @Get('')
    async listFeatures(@Query() query) {
        let data = await this.featureService.findAll(query);
        return {
            message: 'Features',
            status: 'ok',
            data,
        };
    }

    @hasRoles('create-features')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('')
    async createFeature(
        @Body() createFeatureDto: CreateFeatureDto,
        @Req() req: any,
    ) {
        let data = await this.featureService.create(
            createFeatureDto,
            req.user.id,
        );
        return {
            message: 'Created Feature',
            status: 'ok',
            data,
        };
    }

    @hasRoles('edit-features')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    async updateDetails(
        @Param('id') id: string,
        @Body() createFeatureDto: CreateFeatureDto,
        @Req() req: any,
    ) {
        let data = await this.featureService.editFeature(
            id,
            createFeatureDto,
            req.user.id,
        );
        return {
            message: 'Feature has been updated',
            status: 'ok',
            data,
        };
    }
}
