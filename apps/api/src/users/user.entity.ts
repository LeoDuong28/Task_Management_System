import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Role } from "@libs/data";
import { Organization } from "../organizations/organization.entity";
import { Task } from "../tasks/task.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;

  @Column({ type: "varchar", default: Role.VIEWER })
  role!: Role;

  @Column()
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: "organizationId" })
  organization!: Organization;

  @OneToMany(() => Task, (task) => task.owner)
  tasks!: Task[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
