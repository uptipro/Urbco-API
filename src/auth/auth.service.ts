import {
    HttpException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { VerifyOtpDto } from './dto/otp.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { PasswordDto } from './dto/password.dto';

@Injectable({})
export class AuthService {
    constructor(
        @InjectRepository(Otp)
        private readonly otpRepository: Repository<Otp>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    generateJwt(user: string, type: string) {
        const payload = { id: user, type };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async sendOtp(email: string) {
        const currentDate = new Date();
        const createOtp = await this.otpRepository.save(
            this.otpRepository.create({
                code: '12345',
                email,
                expires_in: new Date(
                    currentDate.setMinutes(currentDate.getMinutes() + 60),
                ),
                token: uuidv4(),
            }),
        );

        return {
            token: createOtp.token,
            email: createOtp.email,
            expires_in: createOtp.expires_in,
        };
    }

    async verifyOtp(veriyOtpDto: VerifyOtpDto) {
        const findCode = await this.otpRepository.findOne({
            where: {
                email: veriyOtpDto.email,
                code: veriyOtpDto.code,
                token: veriyOtpDto.token,
            },
        });

        const getUser = await this.userService.findone({
            email: veriyOtpDto.email.toLowerCase(),
        });

        if (!findCode) {
            throw new HttpException('Invalid OTP', 401);
        }

        if (findCode && new Date() > new Date(findCode.expires_in)) {
            await this.otpRepository.delete({ id: findCode.id });
            throw new HttpException('OTP has expired', 401);
        }

        await this.otpRepository.delete({ email: veriyOtpDto.email });

        await this.userService.verifyUser(getUser.email);

        if (veriyOtpDto.login) {
            const token = this.generateJwt(getUser.id, getUser.user_type);
            const { password, ...removePassword } = getUser as any;

            return { ...removePassword, ...token };
        } else {
            return {
                email: veriyOtpDto.email,
                status: 'verified',
            };
        }
    }

    async login(loginDto: LoginDto) {
        const email = loginDto.email.toLowerCase();
        const password = loginDto.password;

        const getUser = await this.userService.findone({ email });

        if (!getUser || !bcrypt.compareSync(password, getUser.password)) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        if (getUser.status !== 'active') {
            throw new HttpException('Access has been denied', 401);
        }

        // if (!getUser.verified) {
        //     return this.sendOtp(getUser.email);
        // } else {
            this.userService.updateTime(getUser.id);
            const { password: pw, ...removePassword } = getUser as any;

            const token = this.generateJwt(getUser.id, getUser.user_type);
            return { ...removePassword, ...token };
        // }
    }

    async register(createUserDto: CreateUserDto) {
        let users = await this.userService.findAll();
        if (users.length === 0) {
            let create = await this.userService.createUser(createUserDto);
            return create;
        } else {
            throw new UnauthorizedException('Please contact Admin.');
        }
    }

    async resetPassword(email: string) {
        let findUser = await this.userService.findone({ email });
        if (!findUser) {
            throw new HttpException('Email not found', 404);
        }
        return this.sendOtp(email);
    }

    async changePassword(passwordDto: PasswordDto) {
        await this.verifyOtp({ ...passwordDto, login: false });

        if (passwordDto.password === passwordDto.confirmPassword) {
            return this.userService.resetPassword(
                passwordDto.email,
                passwordDto.password,
            );
        } else {
            throw new HttpException('Passwords does not match', 401);
        }
    }
}
