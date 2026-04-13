import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('investors')
export class Investor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    title: string;

    @Column()
    user_type: string;

    @Column({ nullable: true })
    first_name: string;

    @Column({ nullable: true })
    last_name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    date_of_birth: Date;

    @Column({ nullable: true })
    marital_status: string;

    @Column({ nullable: true })
    gender: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    business_name: string;

    @Column({ nullable: true })
    business_reg_no: string;

    @Column({ nullable: true })
    business_address: string;

    @Column({ nullable: true })
    date_of_incoporation: Date;

    @Column({ nullable: true })
    business_country: string;

    @Column({ nullable: true })
    business_email: string;

    @Column({ nullable: true })
    business_phone: string;

    @Column()
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
