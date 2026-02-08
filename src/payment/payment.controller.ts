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
import { PaymentService } from './payment.service';
import { CreateInvestmentDto } from './dto/create-dto';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Get('')
    async listPayments(@Query() query) {
        let data = await this.paymentService.findAllPayments(query);
        return {
            message: 'All Payments',
            status: 'ok',
            data,
        };
    }

    @Get('investments')
    async listInvestments(@Query() query) {
        let data = await this.paymentService.findAllInvestments(query);
        return {
            message: 'All Investments',
            status: 'ok',
            data,
        };
    }

    @Get('investments/reports')
    async investmentsReport(@Query() query) {
        let data = await this.paymentService.investmentReport(query);
        return {
            message: 'Reports',
            status: 'ok',
            data,
        };
    }

    @hasRoles('create-investment')
    @UseGuards(JwtAuthGuard)
    @Post('investments/create')
    async createPayment(
        @Body() createInvestmentDto: CreateInvestmentDto,
        @Req() req: any,
    ) {
        let data = await this.paymentService.createInvestment(
            createInvestmentDto,
            req.user.id,
        );
        return {
            message: 'Investment Created.',
            status: 'ok',
            data,
        };
    }

    @Post('initiate')
    @UseGuards(JwtAuthGuard)
    async initiatePayment(
        @Body() createInvestmentDto: CreateInvestmentDto,
        @Req() req: any,
    ) {
        let data = await this.paymentService.initiatePayment(
            createInvestmentDto,
            req.user.id,
        );
        return {
            message: 'Payment has been initiated',
            status: 'ok',
            data,
        };
    }

    @Get('verify/:ref')
    async verifyPayment(@Param('ref') ref: string) {
        let data = await this.paymentService.verifyPayment(ref);
        return {
            message: 'Verify Complete',
            status: 'ok',
            data,
        };
    }
}
