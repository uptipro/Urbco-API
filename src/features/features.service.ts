import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feature, FeatureDocument } from './entities/features.entity';
import { Model } from 'mongoose';
import { CreateFeatureDto } from './dto/create-feature.dto';

@Injectable()
export class FeaturesService {
    constructor(
        @InjectModel(Feature.name)
        private readonly featureModel: Model<FeatureDocument>,
    ) {}

    count() {
        return this.featureModel.countDocuments();
    }

    findAll(query: any) {
        let statusQuery = query.status || undefined;

        let filters = {
            status: statusQuery,
        };

        let queries = JSON.parse(JSON.stringify(filters));

        return this.featureModel.find(queries).exec();
    }

    async create(createFeatureDto: CreateFeatureDto, user: any) {
        const find = await this.featureModel.findOne({
            name: createFeatureDto.name.toLowerCase(),
        });

        if (find) {
            throw new HttpException('Feature already exists', 401);
        }

        let create = await this.featureModel.create({
            ...createFeatureDto,
            name: createFeatureDto.name.toLowerCase(),
            status: createFeatureDto.status || 'active',
            last_updated_by: user,
        });
        return create;
    }

    async editFeature(
        id: string,
        createFeatureDto: CreateFeatureDto,
        user: any,
    ) {
        const find = await this.featureModel.findById(id);

        if (!find) {
            throw new HttpException('Feature already exists', 401);
        }

        find.name = createFeatureDto.name || find.name;
        find.description = createFeatureDto.description || find.description;
        find.status = createFeatureDto.status || find.status;
        find.last_updated_by = user;
        find.image = createFeatureDto.image || find.image;

        await find.save();

        return find;
    }
}
