import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Investor } from 'src/investor/entities/investor.entity';
import { Property } from 'src/property/entities/property.entity';
import { Payment } from './payment.entity';
import { User } from 'src/user/entities/user.entity';

export type InvestmentsDocument = Investments & Document;

@Schema({ timestamps: true })
export class Investments {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Property' })
    property: Property;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Investor' })
    investor: Investor;

    @Prop({
        type: [
            {
                percent_value: { type: Number },
                payment: {
                    type: MongooseSchema.Types.ObjectId,
                    ref: 'Payment',
                },
            },
        ],
    })
    payment_breakdowns: { percent_value: number; payment: Payment }[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    created_by: User;

    @Prop()
    amount_paid: number;

    @Prop()
    total_amount: number;

    @Prop()
    fractions_bought: number;

    @Prop({ enum: ['csp', 'opbp', 'optp'] })
    payment_plan: string;

    @Prop({
        enum: ['pending', 'part-payment', 'completed', 'reversed', 'failed'],
        default: 'pending',
    })
    payment_status: string;
}

export const InvestmentsSchema = SchemaFactory.createForClass(Investments);
