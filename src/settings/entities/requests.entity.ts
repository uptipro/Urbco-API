import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestsDocument = Requests & Document;

@Schema({ timestamps: true })
export class Requests {
    @Prop()
    name: string;

    @Prop()
    phone: string;

    @Prop()
    email: string;

    @Prop()
    message: string;
}

export const Requestschema = SchemaFactory.createForClass(Requests);
