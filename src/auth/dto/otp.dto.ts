import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    code: string;

    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    @IsBoolean()
    login: boolean;
}

export class SendOtpDto {
    @IsNotEmpty()
    email: string;
}
