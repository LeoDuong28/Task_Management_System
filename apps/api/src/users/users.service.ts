import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, Organization } from '../entities';
import { Role, Permission, RolePermissions } from '../shared/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>
  ) {}

  private hasPermission(user: User, permission: Permission): boolean {
    const permissions = RolePermissions[user.role as Role] || [];
    return permissions.includes(permission);
  }

  private async getAccessibleOrgIds(user: User): Promise<string[]> {
    const orgIds = [user.organizationId];

    if (user.role === Role.OWNER) {
      const childOrgs = await this.orgRepository.find({
        where: { parentId: user.organizationId }
      });
      orgIds.push(...childOrgs.map(o => o.id));
    }

    return orgIds;
  }

  async findAll(currentUser: User) {
    const orgIds = await this.getAccessibleOrgIds(currentUser);

    const users = await this.userRepository.find({
      where: { organizationId: In(orgIds) },
      relations: ['organization'],
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'createdAt']
    });

    return users;
  }

  async updateRole(userId: string, newRole: Role, currentUser: User) {
    if (!this.hasPermission(currentUser, Permission.MANAGE_USERS)) {
      throw new ForbiddenException('You do not have permission to manage users');
    }

    const orgIds = await this.getAccessibleOrgIds(currentUser);

    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId: In(orgIds) }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === currentUser.id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    user.role = newRole;
    return this.userRepository.save(user);
  }
}
