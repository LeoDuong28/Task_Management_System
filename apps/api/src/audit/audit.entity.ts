import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../users/user.entity";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column({ type: "text", nullable: true })
  resourceId?: string;

  @Column({ type: "text", nullable: true })
  details?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  timestamp!: Date;
}
