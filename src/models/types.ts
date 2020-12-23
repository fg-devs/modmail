/* eslint-disable camelcase */
/* eslint-disable no-shadow */
import {
  AttachmentID,
  CategoryID,
  DiscordID,
  MessageID,
  ThreadID,
} from './identifiers';

/**
 * @enum FileType
 * File - Any other file.
 * Image - An image representive file.
 */
// eslint-disable-next-line no-shadow
export enum FileType {
    File,
    Image,
}

/**
 * @type Attachment
 * @property {AttachmentID} id
 * @property {string} name File name.
 * @property {DiscordID} sender
 * @property {string} source Discord CDN link.
 * @property {FileType} type
 */
export type Attachment = {
    id: AttachmentID,
    name: string,
    sender: DiscordID
    source: string,
    type: FileType,
}

/**
 * @type Category
 * @property {string} emojiID The user will react with this emoji to talk in
 * that category.
 * @property {DiscordID} guildID The guild this category represents.
 * @property {CategoryID} id
 * @property {boolean} isActive Whether the category is active or not.
 * (basically if it's needed or not).
 */
export type Category = {
    name: string,
    emojiID: string,
    guildID: DiscordID,
    id: CategoryID,
    isActive: boolean,
    channelID: DiscordID,
}

/**
 * DBCategory represents how the database stores a Category
 * @type DBCategory
 * @property {string} channel_id
 * @property {string} emote
 * @property {string} guild_id
 * @property {string} id
 * @property {string} name
 */
export type DBCategory = {
    channel_id: string,
    emote: string,
    guild_id: string,
    id: string,
    name: string,
}

/**
 * CreateCategoryOpt is used by ICategoryManager.create()
 * @type CreateCategoryOpt
 * @property {string} name New category name
 * @property {string} guildID Category guild
 * @property {string} emote A unique emote assigned to the category
 * @property {string} channelID Channel category ID to utilize
 */
export type CreateCategoryOpt = {
    name: string,
    guildID: string,
    emote: string,
    channelID: string,
}

/**
 * CreateAttachmentOpt is used by IAttachmentManger.create()
 * @type CreateAttachmentOpt
 * @property {string} messageID
 * @property {string} name
 * @property {string} source
 * @property {string} sender
 * @property {string} type
 */
export type CreateAttachmentOpt = {
    messageID: DiscordID,
    name: string,
    source: string,
    sender: string,
    type: FileType,
}

/**
 * CreateStandardReplyOpt is ued my IStandardRepliesManager.create()
 * @type CreateStandardReplyOpt
 * @property {string} name
 * @property {string} reply
 */
export type CreateStandardReplyOpt = {
    name: string,
    reply: string
}

/**
 * Fetch a category by any of the following
 * @enum CategoryResolvable
 */
export enum CategoryResolvable {
    activity,
    name,
    guild,
    emote,
    channel,
    id,
}

/**
 * @type Edit
 * @property {string} content
 * @property {MessageID} message The message in context.
 * @property {number} version An integer representing the version edit. Edits
 * will sit in an array and the biggest integer version is the latest edit.
 */
export type Edit = {
    content: string,
    message: MessageID,
    version: number,
}

/**
 * @type Message
 * @property {string} content Body of the message, possibly empty.
 * @property {MessageID} clientID The message that the user sent.
 * @property {Edit[]} edits The last edit_num is the last result of content.
 * @property {Attachment[]} files Files attached with the message.
 * @property {boolean} isDeleted
 * @property {MessageID} modmailID Message sent by modmail for the user.
 * @property {DiscordID} sender
 */
export type Message = {
    content: string,
    clientID: MessageID | null,
    edits: Edit[],
    files: Attachment[],
    isDeleted: boolean,
    modmailID: MessageID,
    sender: DiscordID,
    threadID: ThreadID,
    internal: boolean
}

/**
 * DBMessage is how the database stores a Message
 * @type DBMessage
 * @property {string} content
 * @property {string} client_id
 * @property {string} is_deleted
 * @property {string} modmail_id
 * @property {string} sender
 * @property {string} thread_id
 */
export type DBMessage = {
    content: string,
    client_id: MessageID,
    is_deleted: boolean,
    modmail_id: MessageID,
    sender: DiscordID,
    thread_id: ThreadID,
    internal: boolean
}

/**
 * @type ModmailUser
 * @property {DiscordID} id The user's Discord user ID.
 * @property {Thread[]} threads The threads the user participated in.
 */
export type ModmailUser = {
    id: DiscordID,
}

/**
 * @type Thread
 * @property {ModmailUser} author Participants of the thread.
 * @property {DiscordID} channel
 * @property {ThreadID} id
 * @property {boolean} isActive
 * @property {Message[]} messages
 * @property {CategoryID} The thread category
 */
export type Thread = {
    author: ModmailUser,
    channel: DiscordID,
    id: ThreadID,
    isActive: boolean,
    messages: Message[],
    category: CategoryID,
}

/**
 * DBThread represents how the database stores a Thread
 * @type DBThread
 */
export type DBThread = {
    author: string,
    channel: string,
    id: string,
    is_active: boolean,
    category: string,
}

/**
 * @type MuteStatus
 * @property {DiscordID} user
 * @property {number} till Unix Epoch in seconds
 * @property {CategoryID} category
 * @property {string} reason
 */
export type MuteStatus = {
    user: DiscordID,
    till: number,
    category: CategoryID,
    reason: string,
}

/**
 * @type DBMuteStatus
 * @property {DiscordID} user_id
 * @property {number} till Unix Epoch in seconds
 * @property {CategoryID} category_id
 * @property {string} reason
 */
export type DBMuteStatus = {
    user_id: DiscordID,
    till: number,
    category_id: CategoryID,
    reason: string,
}

export type StandardReply = {
    reply: string,
    name: string,
    id: string,
}

export type DBStandardReply = {
    reply: string,
    name: string,
    id: bigint,
}

export enum RoleLevel {
    Admin,
    Mod,
}

export type Role = {
    category: CategoryID,
    roleID: DiscordID,
    level: RoleLevel,
}

export type DBRole = {
    category: CategoryID,
    role_id: DiscordID,
    level: string,
}
