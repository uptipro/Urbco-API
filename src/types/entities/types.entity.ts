import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type TypesDocument = Types & Document;

@Schema({ timestamps: true })
export class Types {
    @Prop({})
    name: string;

    @Prop({ enum: ['active', 'inactive', 'deleted'], default: 'active' })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    last_updated_by: User;
}

export const TypesSchema = SchemaFactory.createForClass(Types);
