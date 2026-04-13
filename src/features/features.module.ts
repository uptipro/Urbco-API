import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entities/features.entity';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Feature]),
        UserModule,
    ],
    providers: [FeaturesService],
    controllers: [FeaturesController],
    exports: [FeaturesService],
})
export class FeaturesModule { }
