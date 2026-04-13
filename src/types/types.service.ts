import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Types } from './entities/types.entity';

@Injectable()
export class TypesService {
    constructor(
        @InjectRepository(Types)
        private readonly typesRepository: Repository<Types>,
    ) { }

    count() {
        return this.typesRepository.count();
    }

    findAll(query: any) {
        const where: any = {};
        if (query.status) where.status = query.status;
        return this.typesRepository.find({ where });
    }

    async create(obj: any, user: any) {
        const find = await this.typesRepository.findOne({
            where: { name: obj.name.toLowerCase() },
        });

        if (find) {
            throw new HttpException('Type already exists', 401);
        }

        let create = await this.typesRepository.save(
            this.typesRepository.create({
                name: obj.name.toLowerCase(),
                last_updated_by: user,
            }),
        );
        return create;
    }

    async editFeature(id: string, obj: any, user: any) {
        const find = await this.typesRepository.findOne({ where: { id } });

        if (!find) {
            throw new HttpException('Type not found', 404);
        }

        find.name = obj.name || find.name;
        find.status = obj.status || find.status;
        find.last_updated_by = user;

        return this.typesRepository.save(find);
    }
}
