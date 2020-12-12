import { Snowflake } from 'discord.js';
import { DiscordID, MessageID } from './identifiers';
import { Edit, Message } from './types';

export interface IEditsManager {
    add(edit: Edit): Promise<void>;
}

export interface IMessageManager {
    add(message: Message): Promise<void>;
    deleted(id: MessageID): Promise<void>;
}

export interface IThreadManager {
    close(channelID: DiscordID): Promise<void>;
    open(author: DiscordID, channelID: DiscordID): Promise<void>;
}

export interface IUserManager {
    create(id: DiscordID): Promise<void>;
}

export interface IIDManager {
    create(): Snowflake;
}

/**
 * @interface IDatabaseManager
 * @property {IEditsManager} edits For managing message edits
 * @property {IMessageManager} messages For managing messages of a thread
 * @property {IThreadManager} threads
 * @property {IUserManager} users
 */
export interface IDatabaseManager {
    edits: IEditsManager;
    messages: IMessageManager;
    threads: IThreadManager;
    users: IUserManager;
}
