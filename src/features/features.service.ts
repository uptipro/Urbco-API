import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from './entities/features.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';

@Injectable()
export class FeaturesService {
    constructor(
        @InjectRepository(Feature)
        private readonly featureRepository: Repository<Feature>,
    ) { }

    count() {
        return this.featureRepository.count();
    }

    findAll(query: any) {
        const where: any = {};
        if (query.status) where.status = query.status;
        return this.featureRepository.find({ where });
    }

    async create(createFeatureDto: CreateFeatureDto, user: any) {
        const find = await this.featureRepository.findOne({
            where: { name: createFeatureDto.name.toLowerCase() },
        });

        if (find) {
            throw new HttpException('Feature already exists', 401);
        }

        let create = await this.featureRepository.save(
            this.featureRepository.create({
                ...createFeatureDto,
                name: createFeatureDto.name.toLowerCase(),
                status: createFeatureDto.status || 'active',
                last_updated_by: user,
            }),
        );
        return create;
    }

    async editFeature(
        id: string,
        createFeatureDto: CreateFeatureDto,
        user: any,
    ) {
        const find = await this.featureRepository.findOne({ where: { id } });

        if (!find) {
            throw new HttpException('Feature not found', 404);
        }

        find.name = createFeatureDto.name || find.name;
        find.description = createFeatureDto.description || find.description;
        find.status = createFeatureDto.status || find.status;
        find.last_updated_by = user;
        find.image = createFeatureDto.image || find.image;

        return this.featureRepository.save(find);
    }
}
