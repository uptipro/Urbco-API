import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from 'src/role/entities/role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    first_name: string;

    @Column({ nullable: true })
    last_name: string;

    @Column()
    email: string;

    @Column()
    mobile: string;

    @Column()
    password: string;

    @Column({ default: 'active' })
    status: string;

    @Column({ default: 'admin' })
    user_type: string;

    @Column({ default: false })
    verified: boolean;

    @ManyToOne(() => Role, { nullable: true, eager: false })
    @JoinColumn({ name: 'role_id' })
    role_id: Role;

    @Column({ nullable: true })
    last_login: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
