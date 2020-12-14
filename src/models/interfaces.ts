import { Snowflake } from 'discord.js';
import {
  CategoryID, DiscordID, MessageID, ThreadID,
} from './identifiers';
import {
  Category, Edit, Message, Thread,
} from './types';

export interface IEditsManager {
    add(edit: Edit): Promise<number>;
}

export interface IMessageManager {
    add(message: Message): Promise<void>;
    deleted(id: MessageID): Promise<void>;
}

export interface IThreadManager {
    close(channelID: DiscordID): Promise<void>;
    open(author: DiscordID, channelID: DiscordID, categoryID: CategoryID): Promise<void>;
    countThreads(user: DiscordID): Promise<number>;
    getCurrentThread(user: DiscordID): Promise<Thread | undefined>;
    getThreadByChannel(channelID: DiscordID): Promise<Thread | undefined>;
}

export interface IUserManager {
    create(id: DiscordID): Promise<void>;
}

export interface IIDManager {
    create(): Snowflake;
}

export interface ICategoryManger {
    create(guildID: DiscordID, name: string, emote: string, channelID: DiscordID): Promise<void>
    delete(threadID: ThreadID): Promise<void>
    setName(threadID: ThreadID, name: string): Promise<void>
    setEmoji(threadID: ThreadID, emote: string): Promise<void>
    getActiveCategories(): Promise<Category[]>;
    getCategoryByEmote(emote: string): Promise<Category | undefined>;
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
