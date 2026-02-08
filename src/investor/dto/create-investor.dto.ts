import { IsArray, IsNotEmpty } from 'class-validator';

export class CreateInvestorDto {
    title: string;
    user_type: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    date_of_birth: Date;
    marital_status: string;
    gender: string;
    address: string;
    business_name: string;
    business_reg_no: string;
    business_address: string;
    date_of_incoporation: Date;
    business_country: string;
    business_email: string;
    business_phone: string;
    password: string;
}
