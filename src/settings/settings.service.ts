import { HttpException, Injectable } from '@nestjs/common';
import { FeaturesService } from 'src/features/features.service';
import { PropertyService } from 'src/property/property.service';
import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';
import { v2 as cloudinary } from 'cloudinary';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from './entities/settings.entity';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PaymentService } from 'src/payment/payment.service';
import { InvestorService } from 'src/investor/investor.service';
import { Requests } from './entities/requests.entity';

cloudinary.config({
    cloud_name: 'dzszmtic7',
    api_key: '636157763586256',
    api_secret: 'iE9Rz9PofirL_eF0iY4iKccEar8',
});

@Injectable({})
export class SettingsService {
    constructor(
        @InjectRepository(Settings)
        private readonly settingsRepository: Repository<Settings>,

        @InjectRepository(Requests)
        private readonly requestRepository: Repository<Requests>,

        private readonly userService: UserService,
        private readonly propertyService: PropertyService,
        private readonly roleService: RoleService,
        private readonly featureService: FeaturesService,
        private readonly paymentService: PaymentService,
        private readonly investorService: InvestorService,
    ) { }

    async getStatistics() {
        let users = await this.userService.count();
        let properties = await this.propertyService.count();
        let roles = await this.roleService.count();
        let requests = await this.requestRepository.count();
        let features = await this.featureService.count();
        let investments = await this.paymentService.countInvestments();
        let transactions = await this.paymentService.countTransactions();
        let investors = await this.investorService.count();

        return {
            users,
            properties,
            roles,
            requests,
            features,
            investments,
            transactions,
            investors,
        };
    }

    async uploadFile(file: any) {
        let upload = await cloudinary.uploader.upload(file, {
            upload_preset: 'urbcopreset',
        });
        return upload.secure_url;
    }

    async loadSetting() {
        const existing = await this.settingsRepository.find();
        if (existing.length > 0) {
            throw new HttpException('Settings has already been loaded', 401);
        }

        const create = await this.settingsRepository.save(
            this.settingsRepository.create({
                testimonials: [
                    {
                        user: 'Bode Thomas',
                        message:
                            'I can testify to this. Urbco is really a good place to get properties.',
                    },
                ],
                quote: 'Real estate is aN imperishable asset, ever increasing in value. It is the most solid security that human ingenuity has devised. It is the basis of all security and about the only indestructible security.',
                investment_insight: 'https://urbco.netlify.app',
                quoteArthur: 'RUSSELL SAGE',
            }),
        );
        return create;
    }

    async getSettings() {
        return this.settingsRepository.findOne({ where: {} });
    }

    async updateSettings(updateSettingsDto: UpdateSettingsDto) {
        const find = await this.settingsRepository.findOne({
            where: { id: updateSettingsDto._id },
        });
        if (!find) {
            throw new HttpException('Settings not found', 404);
        }

        find.testimonials = updateSettingsDto.testimonials || find.testimonials;
        find.quote = updateSettingsDto.quote || find.quote;
        find.investment_insight =
            updateSettingsDto.investment_insight || find.investment_insight;
        find.quoteArthur = updateSettingsDto.quoteArthur || find.quoteArthur;

        await this.settingsRepository.save(find);

        return find;
    }

    async getStates() { }

    async getCity(id: string) { }

    async contactUs(req: any) {
        const create = await this.requestRepository.save(
            this.requestRepository.create(req),
        );
        return create;
    }

    async getContactRequests(query: any) {
        const pageSize = Number(query.pageSize) || 15;
        const page = Number(query.pageNumber) || 1;

        const [requests, count] = await this.requestRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: pageSize,
            skip: pageSize * (page - 1),
        });

        return {
            requests,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }
}
