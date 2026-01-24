import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "./organization.entity";
import { IOrganization, JwtPayload } from "@libs/data";

const toIOrganization = (org: Organization): IOrganization => ({
  id: org.id,
  name: org.name,
  parentId: org.parentId ?? undefined,
  createdAt: org.createdAt,
  updatedAt: org.updatedAt,
});

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>
  ) {}

  async findOne(id: string): Promise<IOrganization> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ["children"],
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return toIOrganization(org);
  }

  async findUserOrganization(user: JwtPayload): Promise<IOrganization> {
    return this.findOne(user.organizationId);
  }

  async createSubOrganization(
    name: string,
    parentId: string
  ): Promise<IOrganization> {
    const parent = await this.findOne(parentId);

    const org = this.orgRepo.create({
      name,
      parentId: parent.id,
    });

    const saved = await this.orgRepo.save(org);
    return toIOrganization(saved);
  }
}
