import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Types } from 'src/types/entities/types.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('properties')
export class Property {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'last_updated_by_id' })
    last_updated_by: User;

    @Column({ unique: true })
    ref: string;

    @Column({ type: 'jsonb', nullable: true })
    images: { url: string; for: string; order: number }[];

    @Column({ default: 0 })
    investors_count: number;

    @Column()
    total_units: number;

    @Column()
    total_fractions: number;

    @Column({ type: 'float' })
    investment_available: number;

    @Column({ type: 'float' })
    total_price: number;

    @Column({ type: 'float' })
    cost_per_unit: number;

    @Column({ type: 'float' })
    cost_per_fraction: number;

    @Column({ default: 0 })
    fractions_taken: number;

    @Column({ default: 0, nullable: true })
    discount_claimed: number;

    @Column({ type: 'float', nullable: true })
    total_discount_claimed: number;

    @Column({ type: 'jsonb', nullable: true })
    features: { quantity: number; feature_id: string }[];

    @Column({ type: 'jsonb', nullable: true })
    details: { bathroom: number; kitchen: number; bedroom: number; toilet: number };

    @Column({ type: 'float', nullable: true })
    areaSqm: number;

    @ManyToOne(() => Types, { nullable: true, eager: false })
    @JoinColumn({ name: 'type_id' })
    type: Types;

    @Column()
    short_description: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ default: 'design' })
    status: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ default: 'nigeria' })
    country: string;

    @Column({ nullable: true })
    construction_start_date: Date;

    @Column({ nullable: true })
    construction_end_date: Date;

    @Column({ nullable: true })
    roofing_date: Date;

    @Column({ type: 'jsonb', nullable: true })
    rentals: {
        rent_per_quater: number;
        rent_frequency: string;
        annual_yield_percent: number;
        yield_assumption_percent: number;
        first_dividend_date: Date;
    };

    @Column({ type: 'float', nullable: true })
    capital_appreciation_percent: number;

    @Column({ type: 'jsonb', nullable: true })
    csp: { discount: number; volume_available: number; fractions_taken: number };

    @Column({ type: 'jsonb', nullable: true })
    opbp: { discount: number; volume_available: number; fractions_taken: number };

    @Column({ type: 'jsonb', nullable: true })
    optp: { discount: number; volume_available: number; stages: number; percent: string; fractions_taken: number };

    @Column({ default: false })
    sent_to_buyops: boolean;

    @Column({ nullable: true })
    buyops_asset_id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
