import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Investor } from 'src/investor/entities/investor.entity';
import { Property } from 'src/property/entities/property.entity';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Investor, { nullable: true, eager: false })
    @JoinColumn({ name: 'investor_id' })
    investor: Investor;

    @ManyToOne(() => Property, { nullable: true, eager: false })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ type: 'float' })
    amount: number;

    @Column()
    transaction_ref: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true })
    narration: string;

    @Column({ default: 'naira' })
    currency: string;

    @Column({ nullable: true })
    transaction_date: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
