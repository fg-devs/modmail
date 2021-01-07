/* eslint-disable no-shadow */
import { FileType } from 'modmail-types';

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
    messageID: string,
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
