import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Feature } from 'src/features/entities/features.entity';
import { Types } from 'src/types/entities/types.entity';
import { User } from 'src/user/entities/user.entity';

export type PropertyDocument = Property & Document;

@Schema({ _id: false })
class Detail {
    @Prop({})
    bathroom: number;

    @Prop()
    kitchen: number;

    @Prop()
    bedroom: number;

    @Prop()
    toilet: number;
}

@Schema({ _id: false })
class Rentals {
    @Prop()
    rent_per_quater: number;

    @Prop()
    rent_frequency: string;

    @Prop()
    annual_yield_percent: number;

    @Prop()
    yield_assumption_percent: number;

    @Prop()
    first_dividend_date: Date;
}

@Schema({ _id: false })
class BulletPayment {
    @Prop()
    discount: number;

    @Prop()
    volume_available: number;

    @Prop({ default: 0 })
    fractions_taken: number;
}

@Schema({ _id: false })
class BulletPayment2 {
    @Prop()
    discount: number;

    @Prop()
    volume_available: number;

    @Prop()
    stages: number;

    @Prop()
    percent: string;

    @Prop({ default: 0 })
    fractions_taken: number;
}

@Schema({ timestamps: true })
export class Property {
    @Prop({ required: true })
    name: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    created_by: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    last_updated_by: User;

    @Prop({ required: true, unique: true })
    ref: string;

    @Prop()
    images: { url: string; for: string; order: number }[];

    @Prop({ required: true, default: 0 })
    investors_count: number;

    @Prop({ required: true })
    total_units: number;

    @Prop({ required: true })
    total_fractions: number;

    @Prop({ required: true })
    investment_available: number;

    @Prop({ required: true })
    total_price: number;

    @Prop({ required: true })
    cost_per_unit: number;

    @Prop({ required: true })
    cost_per_fraction: number;

    @Prop({ required: true, default: 0 })
    fractions_taken: number;

    @Prop({ default: 0 })
    discount_claimed: number;

    @Prop({})
    total_discount_claimed: number;

    @Prop({
        type: [
            {
                value: { type: String },
                feature: {
                    type: MongooseSchema.Types.ObjectId,
                    ref: 'Feature',
                },
            },
        ],
    })
    features: { quantity: number; feature: Feature }[];

    @Prop()
    details: Detail;

    @Prop()
    areaSqm: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Types' })
    type: Types;

    @Prop({ required: true })
    short_description: string;

    @Prop({ required: true })
    description: string;

    @Prop({
        required: true,
        default: 'design',
        enum: ['design', 'construction', 'completed'],
    })
    status: string;

    @Prop()
    address: string;

    @Prop()
    city: string;

    @Prop()
    state: string;

    @Prop({ default: 'nigeria' })
    country: string;

    @Prop()
    construction_start_date: Date;

    @Prop()
    construction_end_date: Date;

    @Prop()
    roofing_date: Date;

    @Prop()
    rentals: Rentals;

    @Prop()
    capital_appreciation_percent: number;

    @Prop()
    csp: BulletPayment;

    @Prop()
    opbp: BulletPayment;

    @Prop()
    optp: BulletPayment2;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
