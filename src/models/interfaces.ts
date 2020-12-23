/* eslint-disable max-len */
import { Snowflake } from 'discord.js';
import {
  CategoryID, DiscordID, MessageID, ThreadID,
} from './identifiers';
import {
  Category,
  CategoryResolvable,
  CreateAttachmentOpt,
  CreateCategoryOpt,
  CreateStandardReplyOpt,
  Role,
  Edit,
  Message,
  MuteStatus, StandardReply,
  Thread,
} from './types';

export interface IEditsManager {
    add(edit: Edit): Promise<number>
}

export interface IMessageManager {
    add(message: Message): Promise<void>
    getLastMessage(id: ThreadID, author: DiscordID): Promise<Message>
    setDeleted(id: MessageID): Promise<void>
    fetch(id: MessageID): Promise<Message>
    getPastMessages(threadID: ThreadID): Promise<Message[]>
    update(oldID: MessageID, newID: MessageID): Promise<void>;
}

export interface IMuteManager {
    add(mute: MuteStatus): Promise<void>
    delete(user: DiscordID, cat: CategoryID): Promise<void>
    fetchAll(user: DiscordID): Promise<MuteStatus[]>
    fetch(user: DiscordID, category: CategoryID): Promise<MuteStatus | null>
    isMuted(user: DiscordID, category: CategoryID): Promise<boolean>
    remove(user: DiscordID, category: CategoryID): Promise<void>
}

export interface IThreadManager {
    close(channelID: DiscordID): Promise<void>
    open(author: DiscordID, channelID: DiscordID, categoryID: CategoryID): Promise<void>
    countThreads(user: DiscordID): Promise<number>
    getCurrentThread(user: DiscordID): Promise<Thread | null>
    getThreadByChannel(channelID: DiscordID): Promise<Thread | null>
    updateThread(threadID: ThreadID, channelID: DiscordID, categoryID: CategoryID): Promise<void>
}

export interface IUserManager {
    create(id: DiscordID): Promise<void>
}

export interface IIDManager {
    create(): Snowflake
}

export interface IAttachmentManager {
    create(opt: CreateAttachmentOpt): Promise<void>
}

export interface ICategoryManger {
    create(opt: CreateCategoryOpt): Promise<Category>
    setActive(id: CategoryID, active: boolean): Promise<void>
    setName(id: CategoryID, name: string): Promise<void>
    setEmote(id: CategoryID, emote: string): Promise<void>
    fetch(by: CategoryResolvable, id: string): Promise<Category | null>
    fetchAll(by: CategoryResolvable, id: string): Promise<Category[]>
}

export interface IPermissionsManager {
    add(role: Role): Promise<boolean>
    remove(id: DiscordID): Promise<boolean>
    fetchAll(category: CategoryID): Promise<Role[]>
}

export interface IStandardReplyManager {
    create(opt: CreateStandardReplyOpt): Promise<void>
    remove(name: string): Promise<void>
    update(opt: CreateStandardReplyOpt, id: string): Promise<void>
    get(name: string): Promise<StandardReply | null>
}

/**
 * @interface IDatabaseManager
 * @property {IEditsManager} edits For managing message edits
 * @property {IMessageManager} messages For managing messages of a thread
 * @property {IThreadManager} threads
 * @property {IUserManager} users
 */
export interface IDatabaseManager {
    edits: IEditsManager,
    messages: IMessageManager,
    mutes: IMuteManager,
    threads: IThreadManager,
    users: IUserManager,
    categories: ICategoryManger,
    attachments: IAttachmentManager,
    standardReplies: IStandardReplyManager,
    permissions: IPermissionsManager,
}
