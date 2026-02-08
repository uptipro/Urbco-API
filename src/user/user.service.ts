import {
    HttpException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable({})
export class UserService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {}

    findById(id: string) {
        return this.userModel.findById(id).populate('role_id');
    }

    findone(field: any) {
        return this.userModel.findOne(field);
    }

    findAll() {
        return this.userModel.find({}).exec();
    }

    count() {
        return this.userModel.countDocuments();
    }

    async filterAndPaginateUsers(query: any) {
        let statusQuery = query.status || undefined;
        let typeQuery = query.userType || undefined;

        let filters = {
            status: statusQuery,
            user_type: typeQuery,
        };

        let queries = JSON.parse(JSON.stringify(filters));

        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const count = await this.userModel.countDocuments(queries);

        const users = await this.userModel
            .find(queries, { password: 0 })
            .populate('role_id')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        return {
            users,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async createUser(createUserDto: CreateUserDto) {
        const findUser = await this.userModel.find({
            $or: [
                { email: createUserDto.email.trim().toLowerCase() },
                { mobile: createUserDto.mobile },
            ],
        });

        if (findUser.length > 0) {
            throw new HttpException('User already exists', 401);
        }

        const hash = await bcrypt.hash(
            createUserDto.first_name.toUpperCase(),
            10,
        );

        let create = await this.userModel.create({
            ...createUserDto,
            email: createUserDto.email.trim().toLowerCase(),
            password: hash,
        });
        return create;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const data = await this.userModel.findById(id);
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.first_name = updateUserDto.first_name || data.first_name;
        data.last_name = updateUserDto.last_name || data.last_name;
        data.mobile = updateUserDto.mobile || data.mobile;
        data.role_id = updateUserDto.role_id || data.role_id;

        const updated = await data.save();

        return {
            _id: updated.id,
            email: updated.email,
            first_name: updated.first_name,
            last_name: updated.last_name,
        };
    }

    async userDetails(id: string) {
        const data = await this.userModel
            .findById(id, { password: 0 })
            .populate('role_id');
        if (!data) {
            throw new HttpException('User not found', 404);
        }

        return data;
    }

    async verifyUser(email: string) {
        const data = await this.userModel.findOne({ email });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.verified = true;

        const updated = await data.save();

        return {
            _id: updated.id,
            email: updated.email,
        };
    }

    async resetPassword(email: string, password: string) {
        const data = await this.userModel.findOne({ email });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        const hash = await bcrypt.hash(password, 10);
        data.password = hash;
        const updated = await data.save();
        return {
            _id: updated.id,
            email: updated.email,
        };
    }

    async activateUser(id: string) {
        const data = await this.userModel.findById(id);
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.status = 'active';

        const updated = await data.save();

        return {
            _id: updated.id,
            email: updated.email,
            status: updated.status,
        };
    }

    async deactivateUser(id: string) {
        const data = await this.userModel.findById(id);
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.status = 'inactive';

        const updated = await data.save();

        return {
            _id: updated.id,
            email: updated.email,
            status: updated.status,
        };
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
        const data = await this.userModel.findById(id);
        if (!data) {
            throw new HttpException('User not found', 404);
        }

        if (
            !bcrypt.compareSync(changePasswordDto.old_password, data.password)
        ) {
            throw new UnauthorizedException('Invalid Password');
        }

        if (
            changePasswordDto.new_password !==
            changePasswordDto.confirm_password
        ) {
            throw new HttpException('Passwords does not match', 404);
        }

        const hash = await bcrypt.hash(changePasswordDto.new_password, 10);

        data.password = hash;
        const updated = await data.save();

        return {
            _id: updated.id,
            email: updated.email,
        };
    }

    async updateTime(id: string) {
        const data = await this.userModel.findById(id);

        data.last_login = new Date();

        await data.save();

        return 'Saved';
    }
}
