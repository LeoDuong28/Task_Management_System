import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { IOrganization, JwtPayload } from '@libs/data';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>
  ) {}

  async findOne(id: string): Promise<IOrganization> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
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

    return this.orgRepo.save(org);
  }
}
