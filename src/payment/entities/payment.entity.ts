import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Investor } from 'src/investor/entities/investor.entity';
import { Property } from 'src/property/entities/property.entity';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Investor' })
    investor: Investor;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Property' })
    property: Property;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    transaction_ref: string;

    @Prop({
        required: true,
        default: 'pending',
        enum: ['pending', 'success', 'failed', 'cancelled'],
    })
    status: string;

    @Prop()
    narration: String;

    @Prop({ required: true, default: 'naira' })
    currency: String;

    @Prop()
    transaction_date: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
