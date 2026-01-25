import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { User } from "../users/user.entity";
import { Organization } from "../organizations/organization.entity";
import {
  LoginDto,
  RegisterDto,
  Role,
  RolePermissions,
  JwtPayload,
  AuthResponse,
} from "@libs/data";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    let organization: Organization | null = null;

    if (dto.organizationName?.trim()) {
      organization = this.orgRepo.create({ name: dto.organizationName.trim() });
      organization = await this.orgRepo.save(organization);
    } else {
      organization = await this.orgRepo.findOne({
        where: { parentId: IsNull() },
      });

      if (!organization) {
        organization = this.orgRepo.create({ name: "Default Organization" });
        organization = await this.orgRepo.save(organization);
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: dto.organizationName?.trim() ? Role.OWNER : Role.VIEWER,
      organizationId: organization.id,
    });

    await this.userRepo.save(user);

    const token = await this.generateToken(user, organization);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .leftJoinAndSelect("user.organization", "organization")
      .where("user.email = :email", { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.organization) {
      throw new NotFoundException("Organization not found for user");
    }

    const token = await this.generateToken(user, user.organization);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ["organization"],
    });
  }

  private async generateToken(
    user: User,
    organization: Organization
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      parentOrganizationId: organization.parentId ?? undefined,
      permissions: RolePermissions[user.role],
    };

    return this.jwtService.signAsync(payload);
  }
}
