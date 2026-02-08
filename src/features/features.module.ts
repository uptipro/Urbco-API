import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { Feature, FeatureSchema } from './entities/features.entity';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Feature.name, schema: FeatureSchema },
        ]),
        UserModule,
    ],
    providers: [FeaturesService],
    controllers: [FeaturesController],
    exports: [FeaturesService],
})
export class FeaturesModule {}
