import { IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordDto {
    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    confirmPassword: string;

    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    code: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;
}
