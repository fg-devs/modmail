import { Permission, Prisma } from '@prisma/client';
import Table from '../table';

export default class PermissionsTable extends Table {
  constructor() {
    super('permissions');
  }

  /**
   * Add a new role for a certain category.
   * @param {Role} role
   * @returns {Promise<boolean>} Whether it was added or not
   */
  public async add(role: Prisma.PermissionUncheckedCreateInput): Promise<boolean> {
    const client = this.getClient();
    const perm = await client.permission.create({
      data: {
        category: {
          connect: {
            id: role.categoryId,
          },
        },
        level: role.level,
        roleId: role.roleId,
      },
    });
    return perm !== null;
  }

  /**
   * Remove a role. We don't need to intake the category because all role ID's
   * are unique and two categories can't have the same role ID.
   * @param {string} roleId
   * @returns {Promise<boolean>} Whether it was removed or not
   */
  public async remove(roleId: string): Promise<boolean> {
    const client = this.getClient();
    await client.permission.delete({ where: { roleId } });
    return true;
  }

  public fetch(roleId: string): Promise<Permission | null> {
    const client = this.getClient();
    return client.permission.findFirst({
      where: {
        roleId,
      },
    });
  }

  public fetchFrom(roleIds: string[]): Promise<Permission[]> {
    const client = this.getClient();
    return client.permission.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
    });
  }

  public fetchAll(categoryId: string): Promise<Permission[]> {
    const client = this.getClient();
    return client.permission.findMany({
      where: {
        categoryId,
      },
    });
  }
}
