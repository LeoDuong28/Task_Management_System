import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "./organization.entity";
import { IOrganization, JwtPayload } from "@libs/data";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>
  ) {}

  private toIOrganization(org: Organization): IOrganization {
    return {
      id: org.id,
      name: org.name,

      parentId: org.parentId ?? undefined,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async findOne(id: string): Promise<IOrganization> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ["children"],
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return this.toIOrganization(org);
  }

  async findUserOrganization(user: JwtPayload): Promise<IOrganization> {
    return this.findOne(user.organizationId);
  }

  async createSubOrganization(
    name: string,
    parentId: string
  ): Promise<IOrganization> {
    await this.findOne(parentId);

    const org = this.orgRepo.create({
      name,
      parentId,
    });

    const saved = await this.orgRepo.save(org);
    return this.toIOrganization(saved);
  }
}
