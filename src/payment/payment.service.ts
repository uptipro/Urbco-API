import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import {
    Investments,
    InvestmentsDocument,
} from './entities/investments.entity';
import { CreateInvestmentDto } from './dto/create-dto';
import { PropertyService } from 'src/property/property.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UpdateInvestmentEvent } from './events/payment.events';
import { MailsService } from 'src/mails/mails.service';
import { InvestorService } from 'src/investor/investor.service';

@Injectable({})
export class PaymentService {
    constructor(
        @InjectModel(Payment.name)
        private readonly paymentModel: Model<PaymentDocument>,

        @InjectModel(Investments.name)
        private readonly investmentModel: Model<InvestmentsDocument>,

        private readonly propertyService: PropertyService,
        private readonly httpService: HttpService,
        private configService: ConfigService,
        private readonly eventEmiiter: EventEmitter2,
        private readonly mailService: MailsService,
        private readonly investorService: InvestorService,
    ) {}

    async countInvestments() {
        return this.investmentModel.countDocuments({
            payment_status: { $in: ['part-payment', 'completed'] },
        });
    }

    async countTransactions() {
        return this.paymentModel.countDocuments({ status: 'success' });
    }

    async findAllInvestments(query: any) {
        let investorQuery = query.investor || undefined;
        let planQuery = query.plan || undefined;

        let filters = {
            investor: investorQuery,
            payment_plan: planQuery,
            payment_status: { $ne: 'pending' },
        };

        let queries = JSON.parse(JSON.stringify(filters));

        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const count = await this.investmentModel.countDocuments(queries);

        const investments = await this.investmentModel
            .find(queries)
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .populate('property')
            .populate({
                path: 'investor',
                select: ['_id', 'business_name', 'first_name', 'last_name'],
            })
            .populate('payment_breakdowns.payment')
            .populate('created_by');

        return {
            investments,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async investmentReport(query: any) {
        let investorQuery = query.investor || undefined;
        let propertyQuery = query.property || undefined;

        let filters = {
            investor: investorQuery,
            property: propertyQuery,
            payment_status: { $ne: 'pending' },
        };

        let queries = JSON.parse(JSON.stringify(filters));

        const investments = await this.investmentModel.find(queries);

        const optp = investments.filter((f) => f.payment_plan === 'optp');
        const opbp = investments.filter((f) => f.payment_plan === 'opbp');
        const csp = investments.filter((f) => f.payment_plan === 'csp');

        const optpBal = optp.reduce((a, b) => a + b.amount_paid, 0);
        const optpDiscount = optp.reduce(
            (a, b) => a + (b.total_amount - b.amount_paid),
            0,
        );

        const opbpBal = opbp.reduce((a, b) => a + b.amount_paid, 0);
        const opbpDiscount = opbp.reduce(
            (a, b) => a + (b.total_amount - b.amount_paid),
            0,
        );

        const cspBal = csp.reduce((a, b) => a + b.amount_paid, 0);
        const cspDiscount = csp.reduce(
            (a, b) => a + (b.total_amount - b.amount_paid),
            0,
        );

        return {
            optp: {
                investments: optpBal,
                discount: optpDiscount,
            },
            opbp: {
                investments: opbpBal,
                discount: opbpDiscount,
            },
            csp: {
                investments: cspBal,
                discount: cspDiscount,
            },
            total: {
                investments: optpBal + opbpBal + cspBal,
                discount: optpDiscount + opbpDiscount + cspDiscount,
            },
        };
    }

    async findAllPayments(query: any) {
        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const count = await this.paymentModel.countDocuments({});

        const payments = await this.paymentModel
            .find({})
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        return {
            payments,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async createInvestment(
        createInvestmentDto: CreateInvestmentDto,
        user: any,
    ) {
        let amounts = await this.propertyService.getAmountToPay(
            createInvestmentDto.property,
            createInvestmentDto,
        );

        let data = {
            amount_paid: amounts.amountToPay,
            total_amount: amounts.totalAmount,
            fractions_bought: createInvestmentDto.fractions_bought,
            id: createInvestmentDto.property,
            plan: createInvestmentDto.payment_plan,
            newInvestor: createInvestmentDto.new_investor,
        };

        let create = await this.investmentModel.create({
            ...createInvestmentDto,
            amount_paid: amounts.amountToPay,
            payment_breakdowns: [
                {
                    percent_value: createInvestmentDto.optp_percent || 100,
                },
            ],
            total_amount: amounts.totalAmount,
            created_by: user,
            payment_status:
                createInvestmentDto.payment_plan === 'optp'
                    ? 'part-payment'
                    : 'completed',
        });

        if (create) {
            await this.propertyService.updateInvestors(data);
        }
        return create;
    }

    generateTransactionReference(length: number) {
        return (
            Math.floor(Math.random() * (9 * Math.pow(10, length))) +
            Math.pow(10, length)
        );
    }

    async initiatePayment(createInvestmentDto: CreateInvestmentDto, user: any) {
        let amounts = await this.propertyService.getAmountToPay(
            createInvestmentDto.property,
            createInvestmentDto,
        );

        let create = await this.paymentModel.create({
            transaction_ref: this.generateTransactionReference(11),
            amount: amounts.amountToPay,
            investor: createInvestmentDto.investor,
            property: createInvestmentDto.property,
            narration: `Payment for Property`,
        });

        if (createInvestmentDto.investment) {
            let findInvestment = await this.investmentModel.findById(
                createInvestmentDto.investment,
            );
            if (!findInvestment) {
                throw new HttpException('Investment not found', 404);
            } else {
                findInvestment.payment_breakdowns.push({
                    payment: create._id,
                    percent_value: createInvestmentDto.optp_percent,
                });

                await findInvestment.save();
            }
        } else {
            await this.investmentModel.create({
                payment_breakdowns: [
                    {
                        payment: create._id,
                        percent_value: createInvestmentDto.optp_percent || 100,
                    },
                ],
                investor: create.investor,
                amount_paid: amounts.amountToPay,
                total_amount: amounts.totalAmount,
                property: createInvestmentDto.property,
                fractions_bought: createInvestmentDto.fractions_bought,
                payment_plan: createInvestmentDto.payment_plan,
                created_by: user,
            });
        }
        return create;
    }

    async verifyPayment(ref: string) {
        try {
            const { data } = await lastValueFrom(
                this.httpService.get(
                    `https://api.paystack.co/transaction/verify/${ref}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.configService.get(
                                'PAYSTACK_SECRET_KEY',
                            )}`,
                        },
                    },
                ),
            );
            this.eventEmiiter.emit(
                'update-investment',
                new UpdateInvestmentEvent(ref),
            );

            return data;
        } catch (err) {
            let message = err.response?.data?.message;
            throw new HttpException(message || 'Error Verifing Payment', 401);
        }
    }

    async findPaymentByRef(ref: string) {
        return this.paymentModel.findOne({ transaction_ref: ref });
    }

    async completeInvestment(id: any, investor: any, property: any) {
        let find = await this.investmentModel
            .findOne({
                'payment_breakdowns.payment': id,
            })
            .populate('payment_breakdowns.payment');

        let getPayment = find.payment_breakdowns.find(
            (p: any) => p.payment._id.toString() == id,
        );

        let checkIfInvestorExists = await this.investmentModel.findOne({
            investor,
            property,
        });

        if (find) {
            find.payment_status =
                find.payment_plan === 'optp' &&
                find.payment_breakdowns.length < 3
                    ? 'part-payment'
                    : 'completed';

            let data = {
                fractions_bought: find.fractions_bought,
                amount_paid: find.amount_paid,
                total_amount: find.total_amount,
                id: find.property,
                plan: find.payment_plan,
                newInvestor:
                    checkIfInvestorExists &&
                    checkIfInvestorExists.payment_status === 'success'
                        ? false
                        : true,
            };

            if (
                find.payment_plan === 'optp' &&
                find.payment_breakdowns.length > 1 &&
                getPayment
            ) {
                find.amount_paid = find
                    ? getPayment.payment.amount + find.amount_paid
                    : find.amount_paid;
            } else {
                await this.propertyService.updateInvestors(data);
            }

            await find.save();
        }
        return find;
    }

    @OnEvent('update-investment')
    async updateInvestment(payload: any) {
        let find = await this.findPaymentByRef(payload.ref);
        if (find && find._id && find.status === 'pending') {
            find.transaction_date = new Date();
            find.status = 'success';

            let findInvestor = await this.investorService.findone({
                _id: find.investor,
            });

            if (findInvestor) {
                this.mailService.sendMail(
                    findInvestor.email,
                    'payment',
                    {
                        name: 'Investor',
                    },
                    'Payment Confirmed',
                );
            }

            await find.save();

            await this.completeInvestment(
                find._id,
                find.investor,
                find.property,
            );
        }
    }
}
