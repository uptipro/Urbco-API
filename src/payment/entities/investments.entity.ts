import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Investor } from 'src/investor/entities/investor.entity';
import { Property } from 'src/property/entities/property.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('investments')
export class Investments {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Property, { nullable: true, eager: false })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @ManyToOne(() => Investor, { nullable: true, eager: false })
    @JoinColumn({ name: 'investor_id' })
    investor: Investor;

    @Column({ type: 'jsonb', nullable: true })
    payment_breakdowns: { percent_value: number; payment_id: string; payment?: any }[];

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Column({ type: 'float', nullable: true })
    amount_paid: number;

    @Column({ type: 'float', nullable: true })
    total_amount: number;

    @Column({ nullable: true })
    fractions_bought: number;

    @Column({ nullable: true })
    payment_plan: string;

    @Column({ default: 'pending' })
    payment_status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
