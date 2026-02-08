import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { PasswordDto } from './dto/password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        let data = await this.authService.register(createUserDto);
        return {
            message: 'User has been created successfully',
            status: 'ok',
            data,
        };
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        let data = await this.authService.login(loginDto);
        return {
            message: 'Login Successful',
            status: 'ok',
            data,
        };
    }

    @Post('resend-otp')
    async resendOtp(@Body() sendOtpDto: SendOtpDto) {
        let data = await this.authService.sendOtp(sendOtpDto.email);
        return {
            message: 'OTP has been sent',
            status: 'ok',
            data,
        };
    }

    @Post('verify-otp')
    async verifyOtp(@Body() veriyOtpDto: VerifyOtpDto) {
        let data = await this.authService.verifyOtp(veriyOtpDto);
        return {
            message: 'User has been verified',
            status: 'ok',
            data,
        };
    }

    @Post('reset-password')
    async resetPassword(@Body() sendOtpDto: SendOtpDto) {
        let data = await this.authService.resetPassword(sendOtpDto.email);
        return {
            message: 'OTP has been sent',
            status: 'ok',
            data,
        };
    }

    @Post('change-password')
    async changePassword(@Body() passwordDto: PasswordDto) {
        let data = await this.authService.changePassword(passwordDto);
        return {
            message: 'Password has been changed',
            status: 'ok',
            data,
        };
    }
}
