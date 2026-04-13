import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Investments } from './entities/investments.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PropertyModule } from 'src/property/property.module';
import { HttpModule } from '@nestjs/axios';
import { MailsModule } from 'src/mails/mails.module';
import { InvestorModule } from 'src/investor/investor.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, Investments]),
        PropertyModule,
        MailsModule,
        HttpModule,
        InvestorModule,
    ],
    providers: [PaymentService],
    controllers: [PaymentController],
    exports: [PaymentService],
})
export class PaymentModule { }
