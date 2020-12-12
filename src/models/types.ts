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
    id: AttachmentID;
    name: string;
    sender: DiscordID
    source: string;
    type: FileType;
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
    emojiID: string;
    guildID: DiscordID;
    id: CategoryID;
    isActive: boolean;
}

/**
 * @type Edit
 * @property {string} content
 * @property {MessageID} message The message in context.
 * @property {number} version An integer representing the version edit. Edits
 * will sit in an array and the biggest integer version is the latest edit.
 */
export type Edit = {
    content: string;
    message: MessageID;
    version: number;
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
    content: string;
    clientID: MessageID;
    edits: Edit[];
    files: Attachment[];
    isDeleted: boolean;
    modmailID: MessageID;
    sender: DiscordID;
}

/**
 * @type ModmailUser
 * @property {DiscordID} id The user's Discord user ID.
 * @property {Thread[]} threads The threads the user participated in.
 */
export type ModmailUser = {
    id: DiscordID;
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
    author: ModmailUser;
    channel: DiscordID;
    id: ThreadID;
    isActive: boolean;
    messages: Message[];
    category: CategoryID;
}
