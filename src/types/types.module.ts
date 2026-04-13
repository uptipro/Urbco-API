import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { Types } from './entities/types.entity';
import { TypesService } from './types.service';
import { TypesController } from './types.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Types]),
        UserModule,
    ],
    providers: [TypesService],
    controllers: [TypesController],
    exports: [TypesService],
})
export class TypessModule { }
