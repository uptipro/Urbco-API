import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, TypesDocument } from './entities/types.entity';
import { Model } from 'mongoose';

@Injectable()
export class TypesService {
    constructor(
        @InjectModel(Types.name)
        private readonly typesModel: Model<TypesDocument>,
    ) {}

    count() {
        return this.typesModel.countDocuments();
    }

    findAll(query: any) {
        let statusQuery = query.status || undefined;

        let filters = {
            status: statusQuery,
        };

        let queries = JSON.parse(JSON.stringify(filters));

        return this.typesModel.find(queries).exec();
    }

    async create(obj: any, user: any) {
        const find = await this.typesModel.findOne({
            name: obj.name.toLowerCase(),
        });

        if (find) {
            throw new HttpException('Type already exists', 401);
        }

        let create = await this.typesModel.create({
            name: obj.name.toLowerCase(),
            last_updated_by: user,
        });
        return create;
    }

    async editFeature(id: string, obj: any, user: any) {
        const find = await this.typesModel.findById(id);

        if (!find) {
            throw new HttpException('Type already exists', 401);
        }

        find.name = obj.name || find.name;
        find.status = obj.status || find.status;
        find.last_updated_by = user;

        await find.save();

        return find;
    }
}
