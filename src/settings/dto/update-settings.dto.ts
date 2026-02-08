import { IsNotEmpty } from 'class-validator';

export class UpdateSettingsDto {
    @IsNotEmpty()
    _id: any;

    quote: string;

    quoteArthur: string;

    investment_insight: string;

    testimonials: any;
}
