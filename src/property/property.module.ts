import { Module, forwardRef } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './entities/property.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Property.name, schema: PropertySchema },
        ]),
    ],
    providers: [PropertyService],
    controllers: [PropertyController],
    exports: [PropertyService],
})
export class PropertyModule {}
