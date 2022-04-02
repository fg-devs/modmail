import { PrismaClient } from '@prisma/client';

/**
 * Table represents a table in the database which is used by DatabaseManager
 */
export default class Table {
  private static client: PrismaClient | null = null;

  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected getClient(): PrismaClient {
    if (Table.client === null) {
      Table.client = new PrismaClient();
    }
    return Table.client;
  }
}
