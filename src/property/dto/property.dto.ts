import { IsArray, IsNotEmpty, IsNumber, isNotEmpty } from 'class-validator';

export class CreatePropertyDto {
    @IsNotEmpty()
    ref: string;

    @IsNotEmpty()
    name: string;

    @IsArray()
    images: Array<{ url: string; for: string; order: number }>;

    @IsArray()
    features: any;

    @IsNotEmpty()
    details: any;

    areaSqm: number;

    @IsNotEmpty()
    type: any;

    @IsNotEmpty()
    short_description: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    city: string;

    @IsNotEmpty()
    state: string;

    status: string;

    @IsNotEmpty()
    @IsNumber()
    total_units: number;

    @IsNotEmpty()
    @IsNumber()
    fraction_per_unit: number;

    @IsNotEmpty()
    @IsNumber()
    cost_per_fraction: number;

    @IsNotEmpty()
    rentals: any;

    @IsNotEmpty()
    capital_appreciation_percent: number;

    @IsNotEmpty()
    csp: any;

    @IsNotEmpty()
    opbp: any;

    @IsNotEmpty()
    optp: any;
}
