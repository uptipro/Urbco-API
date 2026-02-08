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
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { hasRoles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role-guard';
import { InvestorService } from './investor.service';
import { CreateInvestorDto } from './dto/create-investor.dto';

@Controller('investor')
export class InvestorController {
    constructor(private readonly investorService: InvestorService) {}

    @hasRoles('get-investors')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('')
    async listInvestors(@Query() query) {
        let data = await this.investorService.filterAndPaginate(query);
        return {
            message: 'Investor List',
            status: 'ok',
            data,
        };
    }

    @Post('')
    async createInvestor(@Body() createInvestorDto: CreateInvestorDto) {
        let data = await this.investorService.createInvestor(createInvestorDto);
        return {
            message: 'Investor has been created',
            status: 'ok',
            data,
        };
    }

    @Post('login')
    async loginInvestor(@Body() req: any) {
        let data = await this.investorService.loginInvestor(req);
        return {
            message: 'Login is Successful',
            status: 'ok',
            data,
        };
    }

    @Post('forgot-password')
    async changePassword(@Body() req: any) {
        let data = await this.investorService.forgotPassword(req.email);
        return {
            message: 'A mail has been sent.',
            status: 'ok',
            data,
        };
    }

    @Post('reset-password')
    async resetPassword(@Body() req: any) {
        let data = await this.investorService.changePassword(req);
        return {
            message: 'Password has been changed.',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async investorDetails(@Param('id') id: string) {
        let data = await this.investorService.investorDetails(id);
        return {
            message: 'Investor Details',
            status: 'ok',
            data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateInvestor(
        @Param('id') id: string,
        @Body() updateInvestorDto: CreateInvestorDto,
    ) {
        let data = await this.investorService.update(id, updateInvestorDto);
        return {
            message: 'Investor has been updated',
            status: 'ok',
            data,
        };
    }
}
