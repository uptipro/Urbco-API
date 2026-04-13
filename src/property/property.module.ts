import { Module, forwardRef } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Property]),
        HttpModule,
        ConfigModule,
    ],
    providers: [PropertyService],
    controllers: [PropertyController],
    exports: [PropertyService],
})
export class PropertyModule { }
