import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    quote: string;

    @Column({ nullable: true })
    quoteArthur: string;

    @Column({ nullable: true })
    investment_insight: string;

    @Column({ type: 'jsonb', nullable: true })
    testimonials: { message: string; user: string }[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
