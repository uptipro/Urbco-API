import { HttpException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Property, PropertyDocument } from './entities/property.entity';
import { Model } from 'mongoose';
import { CreatePropertyDto } from './dto/property.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PropertyService {
    constructor(
        @InjectModel(Property.name)
        private readonly propertyModel: Model<PropertyDocument>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    count() {
        return this.propertyModel.countDocuments();
    }

    findProperty(query: any) {
        return this.propertyModel.findOne(query);
    }

    async listAndFilter(query: any) {
        let statusQuery = query.status || undefined;
        let typeQuery = query.type || undefined;
        let featureQuery = query.feature || undefined;
        let minAmountQuery = query.minAmount || undefined;
        let maxAmountQuery = query.maxAmount || undefined;
        let cityQuery = query.city || undefined;
        let stateQuery = query.state || undefined;

        let filters = {
            status: statusQuery,
            type: typeQuery,
            'features.feature': featureQuery,
            city: cityQuery,
            state: stateQuery,
            total_price:
                minAmountQuery || maxAmountQuery
                    ? JSON.parse(
                        JSON.stringify({
                            $gte: minAmountQuery,
                            $lte: maxAmountQuery,
                        }),
                    )
                    : undefined,
        };

        let queries = JSON.parse(JSON.stringify(filters));

        let mainQuery = query.keyword
            ? {
                $or: [
                    { ref: { $regex: query.keyword, $options: 'i' } },
                    { name: { $regex: query.keyword, $options: 'i' } },
                ],
            }
            : queries;

        const pageSize = Number(query.pageSize) || 10;
        const page = Number(query.pageNumber) || 1;

        const count = await this.propertyModel.countDocuments(mainQuery);

        const properties = await this.propertyModel
            .find(mainQuery)
            .populate('type')
            .populate('features.feature')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

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

        let total_fractions =
            createPropertyDto.total_units * createPropertyDto.fraction_per_unit;

        const calculateTotalDiscount = () => {
            if (
                createPropertyDto.optp &&
                createPropertyDto.opbp &&
                createPropertyDto.csp
            ) {
                let totalOptp =
                    Math.floor(
                        (createPropertyDto.optp.volume_available *
                            total_fractions) /
                        100,
                    ) * createPropertyDto.cost_per_fraction;
                let optpPercent =
                    (totalOptp * createPropertyDto.optp.discount) / 100;

                let totalOpbp =
                    Math.floor(
                        (createPropertyDto.opbp.volume_available *
                            total_fractions) /
                        100,
                    ) * createPropertyDto.cost_per_fraction;
                let opbpPercent =
                    (totalOpbp * createPropertyDto.opbp.discount) / 100;

                let totalCsp =
                    Math.floor(
                        (createPropertyDto.csp.volume_available *
                            total_fractions) /
                        100,
                    ) * createPropertyDto.cost_per_fraction;
                let cspPercent =
                    (totalCsp * createPropertyDto.csp.discount) / 100;

                return optpPercent + opbpPercent + cspPercent;
            }
        };

        let create = await this.propertyModel.create({
            ...createPropertyDto,
            created_by: user,
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
        return create;
    }

    async getPropertyDetail(id: string) {
        const findProperty = await this.propertyModel
            .findOne({
                ref: id,
            })
            .populate('features.feature')
            .populate('last_updated_by')
            .populate('type');

        if (!findProperty) {
            throw new HttpException('Property not found', 404);
        }
        return findProperty;
    }

    async editProperty(id: string, data: any, user: any) {
        const findProperty = await this.propertyModel.findById(id);
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
            (data.csp?.volume_available !== findProperty.csp.volume_available ||
                data.opbp?.volume_available !==
                findProperty.opbp.volume_available ||
                data.optp?.volume_available !==
                findProperty.optp.volume_available)
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
        findProperty.type = data.type || findProperty.type;
        findProperty.address = data.address || findProperty.address;
        findProperty.state = data.state || findProperty.state;
        findProperty.city = data.city || findProperty.city;
        findProperty.last_updated_by = user;
        findProperty.rentals = data.rentals || findProperty.rentals;
        findProperty.opbp = data.opbp || findProperty.opbp;
        findProperty.optp = data.optp || findProperty.optp;
        findProperty.csp = data.csp || findProperty.csp;
        findProperty.construction_end_date =
            data.construction_end_date || findProperty.construction_end_date;
        findProperty.construction_start_date =
            data.construction_start_date ||
            findProperty.construction_start_date;
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

        const updated = await findProperty.save();

        return updated;
    }

    async editPropertyStatus(id: string, data: any, user: any) {
        const findProperty = await this.propertyModel.findById(id);
        if (!findProperty) {
            throw new HttpException('Property not found', 404);
        }

        if (findProperty.status === 'design') {
            let opbpAvailable =
                Math.round(
                    findProperty.total_fractions *
                    (findProperty['opbp'].volume_available / 100),
                ) - findProperty['opbp'].fractions_taken;

            let opbpPercent =
                (opbpAvailable / findProperty.total_fractions) * 100;

            let optpAvailable =
                Math.round(
                    findProperty.total_fractions *
                    (findProperty['optp'].volume_available / 100),
                ) - findProperty['optp'].fractions_taken;

            let optpPercent =
                (optpAvailable / findProperty.total_fractions) * 100;

            findProperty.optp.volume_available = 0;
            findProperty.opbp.volume_available = 0;
            findProperty.csp.volume_available =
                findProperty.csp.volume_available + opbpPercent + optpPercent;
            findProperty.status = 'construction';

            await findProperty.save();
        } else if (findProperty.status === 'construction') {
            let cspAvailable =
                Math.round(
                    findProperty.total_fractions *
                    (findProperty['csp'].volume_available / 100),
                ) - findProperty['csp'].fractions_taken;

            let cspPercent =
                (cspAvailable / findProperty.total_fractions) * 100;

            console.log(cspPercent);

            findProperty.csp.volume_available = 0;

            await findProperty.save();
        } else {
            findProperty.status = 'completed';
            await findProperty.save();
        }

        return findProperty;
    }

    async getAmountToPay(id: string, data: any) {
        let findProperty = await this.findProperty({
            _id: id,
        });

        let availableFractions = Math.round(
            findProperty.total_fractions *
            (findProperty[data.payment_plan].volume_available / 100),
        );

        if (
            findProperty[data.payment_plan].fractions_taken +
            data.fractions_bought >
            availableFractions
        ) {
            throw new HttpException(
                'Maximum fractions exceeded for this payment plan',
                401,
            );
        }

        if (findProperty) {
            let totalAmount =
                findProperty.cost_per_fraction * data.fractions_bought;

            let amountPaid;
            if (data.payment_plan === 'csp') {
                amountPaid =
                    totalAmount -
                    (findProperty.csp.discount * totalAmount) / 100;
            } else if (data.payment_plan === 'opbp') {
                amountPaid =
                    totalAmount -
                    (findProperty.opbp.discount * totalAmount) / 100;
            } else if (data.payment_plan === 'optp') {
                if (
                    findProperty.optp.percent.includes(`${data.optp_percent}`)
                ) {
                    let total =
                        totalAmount -
                        (findProperty.optp.discount * totalAmount) / 100;
                    amountPaid = (data.optp_percent * total) / 100;
                } else {
                    amountPaid = 0;
                }
            } else {
                amountPaid = totalAmount;
            }

            return {
                amountToPay: amountPaid,
                totalAmount,
            };
        } else {
            return {
                amountToPay: 0,
                totalAmount: 0,
            };
        }
    }

    async updateInvestors(data: any) {
        const findProperty = await this.propertyModel.findById(data.id);

        if (findProperty) {
            findProperty.investors_count =
                findProperty.investors_count + data.newInvestor ? 1 : 0;
            findProperty.fractions_taken =
                findProperty.fractions_taken + data.fractions_bought;
            findProperty.investment_available =
                findProperty.investment_available - data.total_amount;
            findProperty.discount_claimed =
                findProperty.discount_claimed +
                (data.total_amount - data.amount_paid);
            findProperty[data.plan].fractions_taken =
                findProperty[data.plan].fractions_taken + 1;

            await findProperty.save();
        }

        return findProperty;
    }

    /**
     * Pushes this Urbco property to the Buyops platform as a draft asset.
     * The Buyops admin must then explicitly publish it there.
     */
    async sendToBuyops(propertyId: string): Promise<{ buyopsAssetId: string }> {
        const property = await this.propertyModel
            .findById(propertyId)
            .populate('type')
            .populate('features.feature');

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
            urbcoPropertyId: (property._id as any).toString(),
            urbcoRef: property.ref,
            name: property.name,
            description: property.description,
            address: [property.address, property.city, property.state, property.country]
                .filter(Boolean)
                .join(', '),
            location: [property.city, property.state].filter(Boolean).join(', '),
            constructionStage: property.status,
            totalUnits: property.total_units,
            availableUnits: property.total_fractions - property.fractions_taken,
            fractionTotal: property.total_fractions,
            price: property.total_price?.toString(),
            fractionCost: property.cost_per_fraction?.toString(),
            rentalYieldMax: property.rentals?.annual_yield_percent,
            capitalAppreciation: property.capital_appreciation_percent,
            firstPayoutDate: property.rentals?.first_dividend_date,
            constructionStart: property.construction_start_date,
            constructionEnd: property.construction_end_date,
            bedrooms: property.details?.bedroom,
            bathrooms: property.details?.bathroom,
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

            await this.propertyModel.findByIdAndUpdate(propertyId, {
                sent_to_buyops: true,
                buyops_asset_id: buyopsAssetId,
            });

            return { buyopsAssetId };
        } catch (err) {
            const status = err?.response?.status || 500;
            const message =
                err?.response?.data?.message || 'Failed to send property to Buyops';
            throw new HttpException(message, status);
        }
    }
}
