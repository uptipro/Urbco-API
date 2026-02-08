import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
    @Prop()
    quote: string;

    @Prop()
    quoteArthur: string;

    @Prop()
    investment_insight: string;

    @Prop()
    testimonials: { message: string; user: string }[];
}

export const SettingSchema = SchemaFactory.createForClass(Settings);
