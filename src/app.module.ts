import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from './role/role.module';
import { SettingsModule } from './settings/settings.module';
import { PropertyModule } from './property/property.module';
import { FeaturesModule } from './features/features.module';
import { TypessModule } from './types/types.module';
import { InvestorModule } from './investor/investor.module';
import { PaymentModule } from './payment/payment.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailsModule } from './mails/mails.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get('DATABASE_URI'),
            }),
        }),
        AuthModule,
        UserModule,
        RoleModule,
        TypessModule,
        FeaturesModule,
        PropertyModule,
        SettingsModule,
        InvestorModule,
        PaymentModule,
        EventEmitterModule.forRoot(),
        MailsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
