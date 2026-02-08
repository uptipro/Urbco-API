import { IsEmail, IsMobilePhone, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    first_name: string;

    @IsNotEmpty()
    last_name: string;

    @IsEmail()
    email: string;

    @IsMobilePhone()
    mobile: string;

    password: string;

    @IsNotEmpty()
    user_type: string;

    role_id: any;
}
