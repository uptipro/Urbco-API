import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { hasRoles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role-guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @hasRoles('dashboard-stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('statistics')
    async getStatictics() {
        let data = await this.settingsService.getStatistics();
        return {
            message: 'Statistics',
            status: 'ok',
            data,
        };
    }

    @Post('upload-file')
    async uploadFile(@Body() req: any) {
        let file = req.file;

        let data = await this.settingsService.uploadFile(file);
        return {
            message: 'File has been uploaded',
            status: 'ok',
            data,
        };
    }

    @Get('website-content')
    async getSettings() {
        let data = await this.settingsService.getSettings();
        return {
            message: 'Statistics',
            status: 'ok',
            data,
        };
    }

    @Get('website-content/load')
    async loadSettings() {
        let data = await this.settingsService.loadSetting();
        return {
            message: 'Statistics',
            status: 'ok',
            data,
        };
    }

    @hasRoles('edit-website-content')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('website-content')
    async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
        let data = await this.settingsService.updateSettings(updateSettingsDto);
        return {
            message: 'Statistics',
            status: 'ok',
            data,
        };
    }

    @hasRoles('edit-website-content')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('list-requests')
    async listRequests(@Query() query) {
        let data = await this.settingsService.getContactRequests(query);
        return {
            message: 'Contact Requests',
            status: 'ok',
            data,
        };
    }

    @Post('contact-us')
    async contactUs(@Body() req: any) {
        let data = await this.settingsService.contactUs(req);
        return {
            message: 'Contact Requests',
            status: 'ok',
            data,
        };
    }
}
