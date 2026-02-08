import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { Types, TypesSchema } from './entities/types.entity';
import { TypesService } from './types.service';
import { TypesController } from './types.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Types.name, schema: TypesSchema }]),
        UserModule,
    ],
    providers: [TypesService],
    controllers: [TypesController],
    exports: [TypesService],
})
export class TypessModule {}
