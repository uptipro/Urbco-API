import {
    HttpException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable({})
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    findById(id: string) {
        return this.userRepository.findOne({ where: { id }, relations: ['role_id'] });
    }

    findone(field: any) {
        return this.userRepository.findOne({ where: field, relations: ['role_id'] });
    }

    findAll() {
        return this.userRepository.find();
    }

    count() {
        return this.userRepository.count();
    }

    async filterAndPaginateUsers(query: any) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.userType) where.user_type = query.userType;

        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const [rawUsers, count] = await this.userRepository.findAndCount({
            where,
            relations: ['role_id'],
            order: { createdAt: 'DESC' },
            take: pageSize,
            skip: pageSize * (page - 1),
        });

        const users = rawUsers.map(({ password, ...rest }) => rest);

        return {
            users,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async createUser(createUserDto: CreateUserDto) {
        const findUser = await this.userRepository.find({
            where: [
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

        let create = await this.userRepository.save(
            this.userRepository.create({
                ...createUserDto,
                email: createUserDto.email.trim().toLowerCase(),
                password: hash,
                role_id: createUserDto.role_id || null,
            }),
        );
        return create;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const data = await this.userRepository.findOne({ where: { id } });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.first_name = updateUserDto.first_name || data.first_name;
        data.last_name = updateUserDto.last_name || data.last_name;
        data.mobile = updateUserDto.mobile || data.mobile;
        data.role_id = updateUserDto.role_id || data.role_id;

        const updated = await this.userRepository.save(data);

        return {
            _id: updated.id,
            email: updated.email,
            first_name: updated.first_name,
            last_name: updated.last_name,
        };
    }

    async userDetails(id: string) {
        const data = await this.userRepository.findOne({
            where: { id },
            relations: ['role_id'],
        });
        if (!data) {
            throw new HttpException('User not found', 404);
        }

        const { password, ...rest } = data as any;
        return rest;
    }

    async verifyUser(email: string) {
        const data = await this.userRepository.findOne({ where: { email } });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.verified = true;

        const updated = await this.userRepository.save(data);

        return {
            _id: updated.id,
            email: updated.email,
        };
    }

    async resetPassword(email: string, password: string) {
        const data = await this.userRepository.findOne({ where: { email } });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        const hash = await bcrypt.hash(password, 10);
        data.password = hash;
        const updated = await this.userRepository.save(data);
        return {
            _id: updated.id,
            email: updated.email,
        };
    }

    async activateUser(id: string) {
        const data = await this.userRepository.findOne({ where: { id } });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.status = 'active';

        const updated = await this.userRepository.save(data);

        return {
            _id: updated.id,
            email: updated.email,
            status: updated.status,
        };
    }

    async deactivateUser(id: string) {
        const data = await this.userRepository.findOne({ where: { id } });
        if (!data) {
            throw new HttpException('User not found', 404);
        }
        data.status = 'inactive';

        const updated = await this.userRepository.save(data);

        return {
            _id: updated.id,
            email: updated.email,
            status: updated.status,
        };
    }

    async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
        const data = await this.userRepository.findOne({ where: { id } });
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
        const updated = await this.userRepository.save(data);

        return {
            _id: updated.id,
            email: updated.email,
        };
    }

    async updateTime(id: string) {
        const data = await this.userRepository.findOne({ where: { id } });
        if (data) {
            data.last_login = new Date();
            await this.userRepository.save(data);
        }
        return 'Saved';
    }
}
