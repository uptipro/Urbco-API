import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from './entities/otp.entity';
import { JwtStrategy } from './strategy/jwt-strategy';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
        JwtModule.register({
            secret: 'secretKey',
            signOptions: { expiresIn: '1d' },
        }),
        forwardRef(() => UserModule),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
