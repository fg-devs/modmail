import AttachmentsTable from './tables/attachments';
import CategoriesTable from './tables/categories';
import EditsManager from './tables/edits';
import MessagesTable from './tables/messages';
import MutesTable from './tables/mutes';
import PermissionsTable from './tables/permissions';
import StandardRepliesTable from './tables/standardReplies';
import ThreadsTable from './tables/threads';
import UsersTable from './tables/users';

export default class DatabaseManager {
    public readonly edits: EditsManager;

    public readonly messages: MessagesTable;

    public readonly mutes: MutesTable;

    public readonly threads: ThreadsTable;

    public readonly users: UsersTable;

    public readonly categories: CategoriesTable;

    public readonly attachments: AttachmentsTable;

    public readonly standardReplies: StandardRepliesTable;

    public readonly permissions: PermissionsTable;

    constructor() {
      this.edits = new EditsManager();
      this.messages = new MessagesTable();
      this.mutes = new MutesTable();
      this.threads = new ThreadsTable();
      this.users = new UsersTable();
      this.categories = new CategoriesTable();
      this.attachments = new AttachmentsTable();
      this.standardReplies = new StandardRepliesTable();
      this.permissions = new PermissionsTable();
    }
}
