import { Message, MessageAttachment, TextChannel } from 'discord.js';
import Embeds from '../util/Embeds';
import { FileType } from '../models/types';
import Modmail from '../Modmail';
import { IMAGE_REGEX } from '../globals';

export default class AttachmentHandling {
  /**
   * Handles and sends attachments
   * @param {Message} msg
   * @param {TextChannel} channel
   * @param {string} messageID
   * @returns {Promise<void>}
   */
  public static async handle(
    msg: Message,
    channel: TextChannel,
    messageID: string,
  ): Promise<void> {
    const pool = await Modmail.getDB();
    const tasks = [];
    if (msg.attachments.array().length > 0) {
      const attachments = msg.attachments.array();
      for (let i = 0; i < attachments.length; i += 1) {
        const attachment = attachments[i];
        const isImage = this.isImage(attachment);
        const embed = isImage
          ? Embeds.messageAttachmentImage(attachment, msg.author)
          : Embeds.messageAttachment(attachment, msg.author);

        tasks.push(channel.send(embed));
        tasks.push(pool.attachments.create({
          messageID,
          name: attachment.name || '',
          sender: msg.author.id,
          source: attachment.url,
          type: isImage ? FileType.Image : FileType.File,
        }));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Promise.all<any>(tasks);
  }

  /**
   * Checks if attachment is an image
   * @param {MessageAttachment} attachment
   * @return {boolean}
   */
  public static isImage(attachment: MessageAttachment): boolean {
    if (attachment.name === null) {
      return false;
    }

    return (IMAGE_REGEX).test(this.getAttachmentExtension(attachment.name));
  }

  private static getAttachmentExtension(name: string) {
    return name.substr(name.lastIndexOf('.') + 1);
  }
}
