/* eslint-disable no-shadow */
import { FileType } from '@Floor-Gang/modmail-types';

/**
 * CreateCategoryOpt is used by CategoryTable.create()
 * @type CreateCategoryOpt
 */
export type CreateCategoryOpt = {
    name: string,
    description?: string,
    guildID: string,
    isPrivate?: boolean,
    emoji: string,
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
    messageID: string,
    name: string,
    source: string,
    sender: string,
    type: FileType,
}

export type DBAttachment = {
    id: number,
    message_id: number,
    name: string,
    source: string,
    sender: number,
    type: string,
}

export type DBCategory = {
    is_active: boolean,
    is_private: boolean,
    channel_id: number | null,
    emoji: string,
    description: string,
    guild_id: number,
    id: number,
    name: string,
}

export type DBMessage = {
    content: string,
    client_id: number | null,
    is_deleted: boolean,
    modmail_id: number,
    sender: number,
    thread_id: number,
    internal: boolean
}

export type DBThread = {
    author: string,
    channel: number,
    id: number,
    is_admin_only: boolean,
    is_active: boolean,
    category: number,
}

export type DBMuteStatus = {
    user_id: number,
    till: number,
    category_id: number,
    reason: string,
}

export type DBStandardReply = {
    reply: string,
    name: string,
}

export type DBRole = {
    category_id: number,
    role_id: number,
    level: string,
}
