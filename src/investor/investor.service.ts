import {
    HttpException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Investor } from './entities/investor.entity';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { JwtService } from '@nestjs/jwt';
import { Otp } from 'src/auth/entities/otp.entity';
import { MailsService } from 'src/mails/mails.service';

@Injectable({})
export class InvestorService {
    constructor(
        @InjectRepository(Investor)
        private readonly investorRepository: Repository<Investor>,

        @InjectRepository(Otp)
        private readonly otpRepository: Repository<Otp>,

        private readonly jwtService: JwtService,

        private readonly mailService: MailsService,
    ) { }

    findone(field: any) {
        return this.investorRepository.findOne({ where: field });
    }

    findAll() {
        return this.investorRepository.find();
    }

    count() {
        return this.investorRepository.count();
    }

    generateJwt(user: string, type: string) {
        const payload = { id: user, type };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async filterAndPaginate(query: any) {
        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const qb = this.investorRepository.createQueryBuilder('investor');

        if (query.userType) {
            qb.andWhere('investor.user_type = :userType', { userType: query.userType });
        }

        if (query.keyword) {
            const kw = `%${query.keyword.toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(investor.first_name) LIKE :kw OR LOWER(investor.last_name) LIKE :kw OR LOWER(investor.business_name) LIKE :kw)',
                { kw },
            );
        }

        qb.orderBy('investor."createdAt"', 'DESC')
            .take(pageSize)
            .skip(pageSize * (page - 1));

        const [investors, count] = await qb.getManyAndCount();

        return {
            investors,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async createInvestor(createInvestorDto: CreateInvestorDto) {
        const findInvestor = await this.investorRepository.findOne({
            where: { email: createInvestorDto.email.toLowerCase() },
        });

        if (findInvestor) {
            throw new HttpException(
                'An Investor with the email already exist.',
                401,
            );
        }

        const hash = await bcrypt.hash(createInvestorDto.password, 10);

        const create = await this.investorRepository.save(
            this.investorRepository.create({
                ...createInvestorDto,
                password: hash,
                email: createInvestorDto.email.toLowerCase(),
                date_of_birth: createInvestorDto.date_of_birth || null,
                date_of_incoporation: createInvestorDto.date_of_incoporation || null,
            }),
        );

        this.mailService.sendMail(
            createInvestorDto.email.toLowerCase(),
            'welcome',
            {
                name:
                    createInvestorDto.business_name ||
                    createInvestorDto.first_name,
            },
            'Welcome to Urbco',
        );

        return create;
    }

    async loginInvestor(req: any) {
        const findInvestor = await this.investorRepository.findOne({
            where: { email: req.email },
        });

        if (
            !findInvestor ||
            !bcrypt.compareSync(req.password, findInvestor.password)
        ) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const { password, ...removePassword } = findInvestor as any;
        const token = this.generateJwt(
            findInvestor.id,
            findInvestor.user_type,
        );
        return { ...removePassword, ...token };
    }

    async investorDetails(id: string) {
        const data = await this.investorRepository.findOne({ where: { id } });
        if (!data) {
            throw new HttpException('Investor not found', 404);
        }
        return data;
    }

    async update(id: string, updateInvestorDto: CreateInvestorDto) {
        const data = await this.investorRepository.findOne({ where: { id } });
        if (!data) {
            throw new HttpException('Investor not found', 404);
        }
        data.first_name = updateInvestorDto.first_name || data.first_name;
        data.last_name = updateInvestorDto.last_name || data.last_name;
        data.phone = updateInvestorDto.phone || data.phone;
        data.title = updateInvestorDto.title || data.title;

        const updated = await this.investorRepository.save(data);

        return {
            _id: updated.id,
            email: updated.email,
            first_name: updated.first_name,
            last_name: updated.last_name,
        };
    }

    randomOTP = (n: number) => {
        return (
            Math.floor(Math.random() * (9 * Math.pow(10, n))) + Math.pow(10, n)
        );
    };

    async forgotPassword(email: string) {
        const currentDate = new Date();

        const data = await this.investorRepository.findOne({
            where: { email: email.toLowerCase() },
        });
        if (!data) {
            throw new HttpException('Account does not exist', 404);
        }

        const code = this.randomOTP(5);

        const createOtp = await this.otpRepository.save(
            this.otpRepository.create({
                code: String(code),
                email: email.toLowerCase(),
                expires_in: new Date(
                    currentDate.setMinutes(currentDate.getMinutes() + 60),
                ),
                token: uuidv4(),
            }),
        );

        this.mailService.sendMail(
            email.toLowerCase(),
            'verification',
            {
                name: data.business_name || data.first_name,
                code,
            },
            'Verify your Email',
        );

        return {
            token: createOtp.token,
            email: createOtp.email,
            expires_in: createOtp.expires_in,
        };
    }

    async changePassword(changeDto: any) {
        const findCode = await this.otpRepository.findOne({
            where: {
                email: changeDto.email,
                code: changeDto.otp,
                token: changeDto.token,
            },
        });

        const findInvestor = await this.investorRepository.findOne({
            where: { email: changeDto.email.toLowerCase() },
        });

        if (!findCode) {
            throw new HttpException('Invalid OTP', 401);
        }

        if (findCode && new Date() > new Date(findCode.expires_in)) {
            await this.otpRepository.delete({ id: findCode.id });
            throw new HttpException('OTP has expired', 401);
        }

        await this.otpRepository.delete({
            email: changeDto.email.toLowerCase(),
        });

        const hash = await bcrypt.hash(changeDto.password, 10);
        findInvestor.password = hash;
        await this.investorRepository.save(findInvestor);

        return {
            email: changeDto.email,
        };
    }
}
