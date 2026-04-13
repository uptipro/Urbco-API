import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { UserModule } from 'src/user/user.module';
import { PropertyModule } from 'src/property/property.module';
import { RoleModule } from 'src/role/role.module';
import { FeaturesModule } from 'src/features/features.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './entities/settings.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { InvestorModule } from 'src/investor/investor.module';
import { Requests } from './entities/requests.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Settings, Requests]),
        UserModule,
        PropertyModule,
        RoleModule,
        FeaturesModule,
        PaymentModule,
        InvestorModule,
    ],
    providers: [SettingsService],
    controllers: [SettingsController],
})
export class SettingsModule { }
