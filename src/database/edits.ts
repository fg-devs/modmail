import { IEditsManager } from '../models/interfaces';
import { Edit } from '../models/types';
import Table from './table';

export default class EditManager extends Table implements IEditsManager {
  public async add(edit: Edit): Promise<number> {
    const version = await this.pool.query('WITH last_version (num) AS ('
      + 'SELECT coalesce((SELECT version FROM modmail.edits WHERE message = $2 ORDER BY version DESC LIMIT 1), 0)'
      + ') INSERT INTO modmail.edits (content, message, version) VALUES ($1, $2, (SELECT num FROM last_version) + 1) RETURNING version;',
    [edit.content, edit.message]);

    return version.rows[0].version;
  }
}
