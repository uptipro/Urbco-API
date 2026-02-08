import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from 'src/role/entities/role.entity';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop()
    first_name: string;

    @Prop()
    last_name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    mobile: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        required: true,
        enum: ['active', 'inactive'],
        default: 'active',
    })
    status: string;

    @Prop({ required: true, enum: ['user', 'admin'], default: 'admin' })
    user_type: string;

    @Prop({ default: false })
    verified: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role' })
    role_id: Role;

    @Prop()
    last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
