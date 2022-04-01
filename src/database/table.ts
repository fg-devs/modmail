import { PrismaClient } from '@prisma/client';

/**
 * Table represents a table in the database which is used by DatabaseManager
 */
export default class Table {
  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected getClient(): PrismaClient {
    return new PrismaClient();
  }
}
