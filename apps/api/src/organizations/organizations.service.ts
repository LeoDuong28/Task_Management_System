import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Organization, User } from '../entities';
import { Role, Permission, RolePermissions } from '../shared/types';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>
  ) {}

  async findAll(currentUser: User) {
    if (currentUser.role === Role.OWNER) {
      return this.orgRepository.find({
        where: [
          { id: currentUser.organizationId },
          { parentId: currentUser.organizationId }
        ],
        relations: ['parent', 'children']
      });
    }

    return this.orgRepository.find({
      where: { id: currentUser.organizationId },
      relations: ['parent']
    });
  }

  async create(name: string, currentUser: User) {
    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can create child organizations');
    }

    const org = this.orgRepository.create({
      name,
      parentId: currentUser.organizationId
    });

    return this.orgRepository.save(org);
  }

  async getHierarchyMap(): Promise<Map<string, string | null>> {
    const orgs = await this.orgRepository.find();
    const map = new Map<string, string | null>();
    
    orgs.forEach(org => {
      map.set(org.id, org.parentId || null);
    });

    return map;
  }
}
