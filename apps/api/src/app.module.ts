import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditModule } from './audit/audit.module';
import { User } from './users/user.entity';
import { Organization } from './organizations/organization.entity';
import { Task } from './tasks/task.entity';
import { AuditLog } from './audit/audit.entity';
import { Role } from '@libs/data';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqlite',
        database: config.get('DB_PATH') || 'taskdb.sqlite',
        entities: [User, Organization, Task, AuditLog],
        synchronize: true,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([User, Organization]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          Logger.warn(
            'JWT_SECRET not set in environment. Using default secret. Set JWT_SECRET in .env for production.',
            'AppModule',
          );
        }
        return {
          secret: secret || 'supersecretkey',
          signOptions: {
            expiresIn: config.get('JWT_EXPIRY') || '24h',
          },
        };
      },
    }),
    AuthModule,
    TasksModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'duongtrongnghia287@gmail.com';
    const existing = await this.userRepo.findOne({ where: { email: adminEmail } });

    if (!existing) {
      const orgName = process.env.ADMIN_ORG || 'Leo Duong Organization';
      let org = await this.orgRepo.findOne({ where: { name: orgName } });

      if (!org) {
        org = this.orgRepo.create({ name: orgName });
        await this.orgRepo.save(org);
      }

      const adminPassword = process.env.ADMIN_PASSWORD || 'Password123@';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const admin = this.userRepo.create({
        email: adminEmail,
        name: process.env.ADMIN_NAME || 'Leo Duong',
        password: hashedPassword,
        role: Role.OWNER,
        organizationId: org.id,
      });

      await this.userRepo.save(admin);
      this.logger.log(`Admin user seeded: ${adminEmail}`);
    }
  }
}
