import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskStatus, TaskPriority, TaskCategory } from '@libs/data';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar', default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'varchar', default: TaskCategory.OTHER })
  category: TaskCategory;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.tasks)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
