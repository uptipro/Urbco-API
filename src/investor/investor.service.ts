import {
    HttpException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Investor, InvestorDocument } from './entities/investor.entity';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { JwtService } from '@nestjs/jwt';
import { Otp, OtpDocument } from 'src/auth/entities/otp.entity';
import { MailsService } from 'src/mails/mails.service';

@Injectable({})
export class InvestorService {
    constructor(
        @InjectModel(Investor.name)
        private readonly investorModel: Model<InvestorDocument>,

        @InjectModel(Otp.name)
        private readonly otpModel: Model<OtpDocument>,

        private readonly jwtService: JwtService,

        private readonly mailService: MailsService,
    ) {}

    findone(field: any) {
        return this.investorModel.findOne(field);
    }

    findAll() {
        return this.investorModel.find({}).exec();
    }

    count() {
        return this.investorModel.countDocuments();
    }

    generateJwt(user: string, type: string) {
        const payload = { id: user, type };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async filterAndPaginate(query: any) {
        let typeQuery = query.userType || undefined;

        let filters = {
            user_type: typeQuery,
        };

        let queries = JSON.parse(JSON.stringify(filters));

        let mainQuery = query.keyword
            ? {
                  $or: [
                      { first_name: { $regex: query.keyword, $options: 'i' } },
                      { last_name: { $regex: query.keyword, $options: 'i' } },
                      {
                          business_name: {
                              $regex: query.keyword,
                              $options: 'i',
                          },
                      },
                  ],
              }
            : queries;

        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const count = await this.investorModel.countDocuments(mainQuery);

        const investors = await this.investorModel
            .find(mainQuery, { password: 0 })
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        return {
            investors,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async createInvestor(createInvestorDto: CreateInvestorDto) {
        const findInvestor = await this.investorModel.findOne({
            email: createInvestorDto.email.toLowerCase(),
        });

        if (findInvestor) {
            throw new HttpException(
                'An Investor with the email already exist.',
                401,
            );
        }

        const hash = await bcrypt.hash(createInvestorDto.password, 10);

        let create = await this.investorModel.create({
            ...createInvestorDto,
            password: hash,
            email: createInvestorDto.email.toLowerCase(),
        });

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
        const findInvestor = await this.investorModel.findOne({
            email: req.email,
        });

        if (
            !findInvestor ||
            !bcrypt.compareSync(req.password, findInvestor.password)
        ) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        const removePassword = {
            ...findInvestor.toObject(),
            password: null,
        };

        const token = this.generateJwt(
            findInvestor._id,
            findInvestor.user_type,
        );
        return { ...removePassword, ...token };
    }

    async investorDetails(id: string) {
        const data = await this.investorModel.findById(id);
        if (!data) {
            throw new HttpException('Investor not found', 404);
        }
        return data;
    }

    async update(id: string, updateInvestorDto: CreateInvestorDto) {
        const data = await this.investorModel.findById(id);
        if (!data) {
            throw new HttpException('Investor not found', 404);
        }
        data.first_name = updateInvestorDto.first_name || data.first_name;
        data.last_name = updateInvestorDto.last_name || data.last_name;
        data.phone = updateInvestorDto.phone || data.phone;
        data.title = updateInvestorDto.title || data.title;

        const updated = await data.save();

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

        const data = await this.investorModel.findOne({
            email: email.toLowerCase(),
        });
        if (!data) {
            throw new HttpException('Account does not exist', 404);
        }

        let code = this.randomOTP(5);

        const createOtp = await this.otpModel.create({
            code,
            email: email.toLowerCase(),
            expires_in: new Date(
                currentDate.setMinutes(currentDate.getMinutes() + 60),
            ),
            token: uuidv4(),
        });

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
        const findCode = await this.otpModel.findOne({
            email: changeDto.email,
            code: changeDto.otp,
            token: changeDto.token,
        });

        const findInvestor = await this.investorModel.findOne({
            email: changeDto.email.toLowerCase(),
        });

        if (!findCode) {
            throw new HttpException('Invalid OTP', 401);
        }

        if (findCode && new Date() > new Date(findCode.expires_in)) {
            await this.otpModel.findByIdAndRemove(findCode._id);
            throw new HttpException('OTP has expired', 401);
        }

        await this.otpModel.deleteMany({
            email: changeDto.email.toLowerCase(),
        });

        const hash = await bcrypt.hash(changeDto.password, 10);
        findInvestor.password = hash;
        await findInvestor.save();

        return {
            email: changeDto.email,
        };
    }
}
