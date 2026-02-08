import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type FeatureDocument = Feature & Document;

@Schema({ timestamps: true })
export class Feature {
    @Prop({})
    name: string;

    @Prop()
    description: string;

    @Prop()
    image: string;

    @Prop({ enum: ['active', 'inactive', 'deleted'], default: 'active' })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    last_updated_by: User;
}

export const FeatureSchema = SchemaFactory.createForClass(Feature);
