import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { Repository } from 'typeorm';
import { CreatePropertyDto } from './dto/property.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PropertyService {
    constructor(
        @InjectRepository(Property)
        private readonly propertyRepository: Repository<Property>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    count() {
        return this.propertyRepository.count();
    }

    findProperty(id: string) {
        return this.propertyRepository.findOne({ where: { id } });
    }

    async listAndFilter(query: any) {
        const pageSize = Number(query.pageSize) || 10;
        const page = Number(query.pageNumber) || 1;

        const qb = this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.type', 'type');

        if (query.keyword) {
            const kw = `%${query.keyword}%`;
            qb.where(
                '(property.ref ILIKE :kw OR property.name ILIKE :kw)',
                { kw },
            );
        } else {
            if (query.status) {
                qb.andWhere('property.status = :status', { status: query.status });
            }
            if (query.type) {
                qb.andWhere('property.type_id = :type', { type: query.type });
            }
            if (query.city) {
                qb.andWhere('property.city = :city', { city: query.city });
            }
            if (query.state) {
                qb.andWhere('property.state = :state', { state: query.state });
            }
            if (query.feature) {
                qb.andWhere('property.features @> :feat::jsonb', {
                    feat: JSON.stringify([{ feature_id: query.feature }]),
                });
            }
            if (query.minAmount) {
                qb.andWhere('property.total_price >= :min', {
                    min: Number(query.minAmount),
                });
            }
            if (query.maxAmount) {
                qb.andWhere('property.total_price <= :max', {
                    max: Number(query.maxAmount),
                });
            }
        }

        qb.orderBy('property.createdAt', 'DESC')
            .take(pageSize)
            .skip(pageSize * (page - 1));

        const [properties, count] = await qb.getManyAndCount();

        return {
            properties,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async createProperty(createPropertyDto: CreatePropertyDto, user: any) {
        if (
            Number(createPropertyDto.csp.volume_available) +
            Number(createPropertyDto.optp.volume_available) +
            Number(createPropertyDto.opbp.volume_available) >
            100
        ) {
            throw new HttpException(
                'Sum of volume available must not exceed 100.',
                401,
            );
        }

        const total_fractions =
            createPropertyDto.total_units * createPropertyDto.fraction_per_unit;

        const calculateTotalDiscount = () => {
            if (
                createPropertyDto.optp &&
                createPropertyDto.opbp &&
                createPropertyDto.csp
            ) {
                const totalOptp =
                    Math.floor(
                        (createPropertyDto.optp.volume_available *
                            total_fractions) /
                        100,
                    ) * createPropertyDto.cost_per_fraction;
                const optpPercent =
                    (totalOptp * createPropertyDto.optp.discount) / 100;

                const totalOpbp =
                    Math.floor(
                        (createPropertyDto.opbp.volume_available *
                            total_fractions) /
                        100,
                    ) * createPropertyDto.cost_per_fraction;
                const opbpPercent =
                    (totalOpbp * createPropertyDto.opbp.discount) / 100;

                const totalCsp =
                    Math.floor(
                        (createPropertyDto.csp.volume_available *
                            total_fractions) /
                        100,
                    ) * createPropertyDto.cost_per_fraction;
                const cspPercent =
                    (totalCsp * createPropertyDto.csp.discount) / 100;

                return optpPercent + opbpPercent + cspPercent;
            }
        };

        const dto = createPropertyDto as any;
        const create = this.propertyRepository.create({
            ...createPropertyDto,
            type: { id: createPropertyDto.type } as any,
            construction_start_date: dto.construction_start_date || null,
            construction_end_date: dto.construction_end_date || null,
            roofing_date: dto.roofing_date || null,
            created_by: { id: user } as any,
            cost_per_unit:
                createPropertyDto.fraction_per_unit *
                createPropertyDto.cost_per_fraction,
            total_fractions,
            total_price:
                createPropertyDto.total_units *
                createPropertyDto.fraction_per_unit *
                createPropertyDto.cost_per_fraction,
            investment_available:
                createPropertyDto.total_units *
                createPropertyDto.fraction_per_unit *
                createPropertyDto.cost_per_fraction,
            total_discount_claimed: calculateTotalDiscount(),
            status: 'design',
        });

        try {
            return await this.propertyRepository.save(create);
        } catch (err: any) {
            if (err?.code === '23505' && err?.detail?.includes('ref')) {
                throw new HttpException(
                    'A property with this reference already exists.',
                    409,
                );
            }
            throw err;
        }
    }

    async getPropertyDetail(id: string) {
        const findProperty = await this.propertyRepository.findOne({
            where: { ref: id },
            relations: ['type', 'last_updated_by'],
        });

        if (!findProperty) {
            throw new HttpException('Property not found', 404);
        }
        return findProperty;
    }

    async editProperty(id: string, data: any, user: any) {
        const findProperty = await this.propertyRepository.findOne({
            where: { id },
        });
        if (!findProperty) {
            throw new HttpException('Property not found', 404);
        }
        if (
            data.construction_start_date &&
            data.construction_start_date > data.construction_end_date
        ) {
            throw new HttpException(
                'Construction Start Date cannot be greater than End Date',
                401,
            );
        }

        if (
            findProperty.status !== 'design' &&
            (data.csp?.volume_available !==
                (findProperty.csp as any)?.volume_available ||
                data.opbp?.volume_available !==
                (findProperty.opbp as any)?.volume_available ||
                data.optp?.volume_available !==
                (findProperty.optp as any)?.volume_available)
        ) {
            throw new HttpException(
                'You cannot update the volume available of this project. It is already past the design stage.',
                401,
            );
        }

        findProperty.name = data.name || findProperty.name;
        findProperty.description = data.description || findProperty.description;
        findProperty.images = data.images || findProperty.images;
        findProperty.features = data.features || findProperty.features;
        findProperty.details = data.details || findProperty.details;
        findProperty.areaSqm = data.areaSqm || findProperty.areaSqm;
        findProperty.type = data.type ? ({ id: data.type } as any) : findProperty.type;
        findProperty.address = data.address || findProperty.address;
        findProperty.state = data.state || findProperty.state;
        findProperty.city = data.city || findProperty.city;
        findProperty.last_updated_by = { id: user } as any;
        findProperty.rentals = data.rentals || findProperty.rentals;
        findProperty.opbp = data.opbp || findProperty.opbp;
        findProperty.optp = data.optp || findProperty.optp;
        findProperty.csp = data.csp || findProperty.csp;
        findProperty.construction_end_date =
            data.construction_end_date || findProperty.construction_end_date;
        findProperty.construction_start_date =
            data.construction_start_date || findProperty.construction_start_date;
        findProperty.roofing_date =
            data.roofing_date || findProperty.roofing_date;
        findProperty.cost_per_unit =
            data.fraction_per_unit && data.cost_per_fraction
                ? data.fraction_per_unit * data.cost_per_fraction
                : findProperty.cost_per_unit;
        findProperty.total_fractions =
            data.fraction_per_unit && data.cost_per_fraction
                ? data.total_units * data.fraction_per_unit
                : findProperty.cost_per_unit;
        findProperty.total_price =
            data.fraction_per_unit && data.cost_per_fraction
                ? data.total_units *
                data.fraction_per_unit *
                data.cost_per_fraction
                : findProperty.cost_per_unit;

        return this.propertyRepository.save(findProperty);
    }

    async editPropertyStatus(id: string, data: any, user: any) {
        const findProperty = await this.propertyRepository.findOne({
            where: { id },
        });
        if (!findProperty) {
            throw new HttpException('Property not found', 404);
        }

        if (findProperty.status === 'design') {
            const opbp = findProperty.opbp as any;
            const optp = findProperty.optp as any;
            const csp = findProperty.csp as any;

            const opbpAvailable =
                Math.round(
                    findProperty.total_fractions *
                    (opbp.volume_available / 100),
                ) - opbp.fractions_taken;
            const opbpPercent =
                (opbpAvailable / findProperty.total_fractions) * 100;

            const optpAvailable =
                Math.round(
                    findProperty.total_fractions *
                    (optp.volume_available / 100),
                ) - optp.fractions_taken;
            const optpPercent =
                (optpAvailable / findProperty.total_fractions) * 100;

            findProperty.optp = { ...optp, volume_available: 0 };
            findProperty.opbp = { ...opbp, volume_available: 0 };
            findProperty.csp = {
                ...csp,
                volume_available:
                    csp.volume_available + opbpPercent + optpPercent,
            };
            findProperty.status = 'construction';

            await this.propertyRepository.save(findProperty);
        } else if (findProperty.status === 'construction') {
            const csp = findProperty.csp as any;

            const cspAvailable =
                Math.round(
                    findProperty.total_fractions *
                    (csp.volume_available / 100),
                ) - csp.fractions_taken;
            const cspPercent =
                (cspAvailable / findProperty.total_fractions) * 100;

            console.log(cspPercent);

            findProperty.csp = { ...csp, volume_available: 0 };

            await this.propertyRepository.save(findProperty);
        } else {
            findProperty.status = 'completed';
            await this.propertyRepository.save(findProperty);
        }

        return findProperty;
    }

    async getAmountToPay(id: string, data: any) {
        const findProperty = await this.findProperty(id);

        if (!findProperty) {
            return { amountToPay: 0, totalAmount: 0 };
        }

        const plan = (findProperty as any)[data.payment_plan];
        const availableFractions = Math.round(
            findProperty.total_fractions * (plan.volume_available / 100),
        );

        if (plan.fractions_taken + data.fractions_bought > availableFractions) {
            throw new HttpException(
                'Maximum fractions exceeded for this payment plan',
                401,
            );
        }

        const totalAmount =
            findProperty.cost_per_fraction * data.fractions_bought;

        let amountPaid: number;
        if (data.payment_plan === 'csp') {
            amountPaid =
                totalAmount -
                ((findProperty.csp as any).discount * totalAmount) / 100;
        } else if (data.payment_plan === 'opbp') {
            amountPaid =
                totalAmount -
                ((findProperty.opbp as any).discount * totalAmount) / 100;
        } else if (data.payment_plan === 'optp') {
            const optp = findProperty.optp as any;
            if (optp.percent.includes(`${data.optp_percent}`)) {
                const total =
                    totalAmount - (optp.discount * totalAmount) / 100;
                amountPaid = (data.optp_percent * total) / 100;
            } else {
                amountPaid = 0;
            }
        } else {
            amountPaid = totalAmount;
        }

        return { amountToPay: amountPaid, totalAmount };
    }

    async updateInvestors(data: any) {
        const findProperty = await this.propertyRepository.findOne({
            where: { id: data.id },
        });

        if (findProperty) {
            findProperty.investors_count =
                findProperty.investors_count + (data.newInvestor ? 1 : 0);
            findProperty.fractions_taken =
                findProperty.fractions_taken + data.fractions_bought;
            findProperty.investment_available =
                findProperty.investment_available - data.total_amount;
            findProperty.discount_claimed =
                findProperty.discount_claimed +
                (data.total_amount - data.amount_paid);

            const plan = data.plan as 'optp' | 'opbp' | 'csp';
            const planData = (findProperty as any)[plan] || {};
            (findProperty as any)[plan] = {
                ...planData,
                fractions_taken: (planData.fractions_taken || 0) + 1,
            };

            await this.propertyRepository.save(findProperty);
        }

        return findProperty;
    }

    /**
     * Pushes this Urbco property to the Buyops platform as a draft asset.
     * The Buyops admin must then explicitly publish it there.
     */
    async sendToBuyops(propertyIdentifier: string): Promise<{ buyopsAssetId: string }> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyIdentifier);

        const property = await this.propertyRepository.findOne({
            where: isUuid
                ? [{ id: propertyIdentifier }, { ref: propertyIdentifier }]
                : [{ ref: propertyIdentifier }],
            relations: ['type'],
        });

        if (!property) {
            throw new HttpException('Property not found', 404);
        }

        if (property.sent_to_buyops && property.buyops_asset_id) {
            return { buyopsAssetId: property.buyops_asset_id };
        }

        const buyopsUrl = this.configService.get<string>('BUYOPS_API_URL');
        const apiKey = this.configService.get<string>('URBCO_API_KEY');

        if (!buyopsUrl || !apiKey) {
            throw new HttpException(
                'Buyops integration is not configured on this server',
                500,
            );
        }

        const payload = {
            urbcoPropertyId: property.id,
            urbcoRef: property.ref,
            name: property.name,
            description: property.description,
            address: [
                property.address,
                property.city,
                property.state,
                property.country,
            ]
                .filter(Boolean)
                .join(', '),
            location: [property.city, property.state].filter(Boolean).join(', '),
            constructionStage: property.status,
            totalUnits: property.total_units,
            availableUnits: property.total_fractions - property.fractions_taken,
            fractionTotal: property.total_fractions,
            price: property.total_price?.toString(),
            fractionCost: property.cost_per_fraction?.toString(),
            rentalYieldMax: (property.rentals as any)?.annual_yield_percent,
            capitalAppreciation: property.capital_appreciation_percent,
            firstPayoutDate: (property.rentals as any)?.first_dividend_date,
            constructionStart: property.construction_start_date,
            constructionEnd: property.construction_end_date,
            bedrooms: (property.details as any)?.bedroom,
            bathrooms: (property.details as any)?.bathroom,
            area: property.areaSqm,
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${buyopsUrl}/public/import-from-urbco`,
                    payload,
                    { headers: { 'x-urbco-api-key': apiKey } },
                ),
            );

            const buyopsAssetId: string = response.data.assetId;

            await this.propertyRepository.update(property.id, {
                sent_to_buyops: true,
                buyops_asset_id: buyopsAssetId,
            });

            return { buyopsAssetId };
        } catch (err) {
            const status = err?.response?.status || 500;
            const message =
                err?.response?.data?.message ||
                'Failed to send property to Buyops';
            throw new HttpException(message, status);
        }
    }
}
