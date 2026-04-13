import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Investments } from './entities/investments.entity';
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
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,

        @InjectRepository(Investments)
        private readonly investmentRepository: Repository<Investments>,

        private readonly propertyService: PropertyService,
        private readonly httpService: HttpService,
        private configService: ConfigService,
        private readonly eventEmiiter: EventEmitter2,
        private readonly mailService: MailsService,
        private readonly investorService: InvestorService,
    ) { }

    async countInvestments() {
        return this.investmentRepository.count({
            where: { payment_status: In(['part-payment', 'completed']) },
        });
    }

    async countTransactions() {
        return this.paymentRepository.count({ where: { status: 'success' } });
    }

    async findAllInvestments(query: any) {
        const pageSize = 10;
        const page = Number(query.pageNumber) || 1;

        const where: any = { payment_status: Not('pending') };
        if (query.investor) where.investor = { id: query.investor };
        if (query.plan) where.payment_plan = query.plan;

        const [investments, count] = await this.investmentRepository.findAndCount({
            where,
            relations: ['property', 'investor', 'created_by'],
            order: { createdAt: 'DESC' },
            take: pageSize,
            skip: pageSize * (page - 1),
        });

        return {
            investments,
            meta: { page, pages: Math.ceil(count / pageSize), total: count },
        };
    }

    async investmentReport(query: any) {
        const where: any = { payment_status: Not('pending') };
        if (query.investor) where.investor = { id: query.investor };
        if (query.property) where.property = { id: query.property };

        const investments = await this.investmentRepository.find({ where });

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

        const [payments, count] = await this.paymentRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: pageSize,
            skip: pageSize * (page - 1),
        });

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

        const create = await this.investmentRepository.save(
            this.investmentRepository.create({
                ...createInvestmentDto,
                property: { id: createInvestmentDto.property } as any,
                investor: { id: createInvestmentDto.investor } as any,
                created_by: { id: user } as any,
                amount_paid: amounts.amountToPay,
                payment_breakdowns: [
                    {
                        percent_value: createInvestmentDto.optp_percent || 100,
                    },
                ],
                total_amount: amounts.totalAmount,
                payment_status:
                    createInvestmentDto.payment_plan === 'optp'
                        ? 'part-payment'
                        : 'completed',
            }),
        );

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

        const create = await this.paymentRepository.save(
            this.paymentRepository.create({
                transaction_ref: String(this.generateTransactionReference(11)),
                amount: amounts.amountToPay,
                investor: { id: createInvestmentDto.investor } as any,
                property: { id: createInvestmentDto.property } as any,
                narration: `Payment for Property`,
            }),
        );

        if (createInvestmentDto.investment) {
            const findInvestment = await this.investmentRepository.findOne({
                where: { id: createInvestmentDto.investment },
            });
            if (!findInvestment) {
                throw new HttpException('Investment not found', 404);
            } else {
                findInvestment.payment_breakdowns = [
                    ...(findInvestment.payment_breakdowns || []),
                    {
                        payment_id: create.id,
                        percent_value: createInvestmentDto.optp_percent,
                    },
                ];
                await this.investmentRepository.save(findInvestment);
            }
        } else {
            await this.investmentRepository.save(
                this.investmentRepository.create({
                    payment_breakdowns: [
                        {
                            payment_id: create.id,
                            percent_value: createInvestmentDto.optp_percent || 100,
                        },
                    ],
                    investor: { id: create.investor?.id ?? createInvestmentDto.investor } as any,
                    amount_paid: amounts.amountToPay,
                    total_amount: amounts.totalAmount,
                    property: { id: createInvestmentDto.property } as any,
                    fractions_bought: createInvestmentDto.fractions_bought,
                    payment_plan: createInvestmentDto.payment_plan,
                    created_by: { id: user } as any,
                }),
            );
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
        return this.paymentRepository.findOne({
            where: { transaction_ref: ref },
            relations: ['investor', 'property'],
        });
    }

    async completeInvestment(id: any, investor: any, property: any) {
        const find = await this.investmentRepository
            .createQueryBuilder('inv')
            .where(`inv.payment_breakdowns @> :pd::jsonb`, {
                pd: JSON.stringify([{ payment_id: id }]),
            })
            .leftJoinAndSelect('inv.property', 'property')
            .leftJoinAndSelect('inv.investor', 'investor')
            .leftJoinAndSelect('inv.created_by', 'created_by')
            .getOne();

        const getPayment = find?.payment_breakdowns?.find(
            (p: any) => p.payment_id === id,
        );

        const paymentRecord = await this.paymentRepository.findOne({ where: { id } });

        const investorId = typeof investor === 'object' ? investor?.id : investor;
        const propertyId = typeof property === 'object' ? property?.id : property;

        const checkIfInvestorExists = await this.investmentRepository.findOne({
            where: {
                investor: { id: investorId },
                property: { id: propertyId },
            },
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
                id: find.property?.id,
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
                find.amount_paid = paymentRecord
                    ? paymentRecord.amount + find.amount_paid
                    : find.amount_paid;
            } else {
                await this.propertyService.updateInvestors(data);
            }

            await this.investmentRepository.save(find);
        }
        return find;
    }

    @OnEvent('update-investment')
    async updateInvestment(payload: any) {
        const find = await this.findPaymentByRef(payload.ref);
        if (find && find.id && find.status === 'pending') {
            find.transaction_date = new Date();
            find.status = 'success';

            const findInvestor = await this.investorService.findone({
                id: find.investor?.id,
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

            await this.paymentRepository.save(find);

            await this.completeInvestment(
                find.id,
                find.investor,
                find.property,
            );
        }
    }
}
