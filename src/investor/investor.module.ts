import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Investor, InvestorSchema } from './entities/investor.entity';
import { InvestorService } from './investor.service';
import { InvestorController } from './investor.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { Otp, OtpSchema } from 'src/auth/entities/otp.entity';
import { MailsModule } from 'src/mails/mails.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Investor.name, schema: InvestorSchema },
            { name: Otp.name, schema: OtpSchema },
        ]),
        UserModule,
        MailsModule,
        JwtModule.register({
            secret: 'secretKey',
            signOptions: {},
        }),
    ],
    providers: [InvestorService],
    controllers: [InvestorController],
    exports: [InvestorService],
})
export class InvestorModule {}
