import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
    @Prop({
        required: true,
    })
    email: string;

    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    expires_in: Date;

    @Prop({ required: true })
    token: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
