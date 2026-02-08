import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvestorDocument = Investor & Document;

@Schema({ timestamps: true })
export class Investor {
    @Prop()
    title: string;

    @Prop({
        enum: ['individual', 'business', 'couple', 'cooperative'],
        required: true,
    })
    user_type: string;

    @Prop()
    first_name: string;

    @Prop()
    last_name: string;

    @Prop()
    phone: string;

    @Prop()
    email: string;

    @Prop()
    date_of_birth: Date;

    @Prop({ enum: ['single', 'married'] })
    marital_status: string;

    @Prop({ enum: ['male', 'female'] })
    gender: string;

    @Prop()
    address: string;

    @Prop()
    business_name: string;

    @Prop()
    business_reg_no: string;

    @Prop()
    business_address: string;

    @Prop()
    date_of_incoporation: Date;

    @Prop()
    business_country: string;

    @Prop()
    business_email: string;

    @Prop()
    business_phone: string;

    @Prop({ required: true })
    password: string;
}

export const InvestorSchema = SchemaFactory.createForClass(Investor);
