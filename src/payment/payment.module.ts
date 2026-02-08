import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { Investments, InvestmentsSchema } from './entities/investments.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PropertyModule } from 'src/property/property.module';
import { HttpModule } from '@nestjs/axios';
import { MailsModule } from 'src/mails/mails.module';
import { InvestorModule } from 'src/investor/investor.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Payment.name, schema: PaymentSchema },
            { name: Investments.name, schema: InvestmentsSchema },
        ]),
        PropertyModule,
        MailsModule,
        HttpModule,
        InvestorModule,
    ],
    providers: [PaymentService],
    controllers: [PaymentController],
    exports: [PaymentService],
})
export class PaymentModule {}
