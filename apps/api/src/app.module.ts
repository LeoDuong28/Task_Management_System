import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { AuthModule } from "./auth/auth.module";
import { TasksModule } from "./tasks/tasks.module";
import { UsersModule } from "./users/users.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { AuditModule } from "./audit/audit.module";
import { User } from "./users/user.entity";
import { Organization } from "./organizations/organization.entity";
import { Task } from "./tasks/task.entity";
import { AuditLog } from "./audit/audit.entity";
import { Role } from "@libs/data";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "sqlite",
        database: config.get("DB_PATH") || "/tmp/taskdb.sqlite",
        entities: [User, Organization, Task, AuditLog],
        synchronize: true,
        logging: config.get("NODE_ENV") === "development",
      }),
    }),
    TypeOrmModule.forFeature([User, Organization]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET") || "supersecretkey",
        signOptions: {
          expiresIn: config.get("JWT_EXPIRY") || "24h",
        },
      }),
    }),
    AuthModule,
    TasksModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,
  ],
  controllers: [HealthController],
  imports: [ ... ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = "duongtrongnghia287@gmail.com";
    const existing = await this.userRepo.findOne({
      where: { email: adminEmail },
    });

    if (!existing) {
      let org = await this.orgRepo.findOne({
        where: { name: "Leo Duong Organization" },
      });

      if (!org) {
        org = this.orgRepo.create({ name: "Leo Duong Organization" });
        await this.orgRepo.save(org);
      }

      const hashedPassword = await bcrypt.hash("Password123@", 12);

      const admin = this.userRepo.create({
        email: adminEmail,
        name: "Leo Duong",
        password: hashedPassword,
        role: Role.OWNER,
        organizationId: org.id,
      });

      await this.userRepo.save(admin);
      console.log("Admin user seeded: duongtrongnghia287@gmail.com");
    }
  }
}
