import { Attachment, FileType } from '@Floor-Gang/modmail-types';
import { Message, MessageAttachment, TextChannel } from 'discord.js';
import { IMAGE_REGEX } from '../globals';
import Controller from '../models/controller';
import Modmail from '../Modmail';
import Embeds from '../util/Embeds';

export default class AttachmentController extends Controller {
  constructor(modmail: Modmail) {
    super(modmail, 'attachments');
  }

  /**
   * Handles attachments sent by a client
   * @param {Message} msg Message sent the user
   * @param {TextChannel} channel The thread channel
   * @param {string} msgID The ID of the message that Modmail sent to the
   * thread
   * @returns {Promise<void>}
   */
  public async handle(
    msg: Message,
    channel: TextChannel,
    msgID: string,
  ): Promise<void> {
    const attachments = msg.attachments.array();
    const sendTasks: Promise<Message>[] = [];
    const storeTasks: Promise<void>[] = [];

    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i += 1) {
        const attachment = attachments[i];
        const isImage = this.isImage(attachment);
        const sendTask = this.send(isImage, channel, msg, attachment);
        const storeTask = this.store(
          isImage,
          msgID,
          msg,
          attachment,
        );

        sendTasks.push(sendTask);
        storeTasks.push(storeTask);
      }
    }

    await Promise.all(sendTasks);
    await Promise.all(storeTasks);
  }

  /**
   * Send the user's attachment to the thread
   * @param {boolean} isImage
   * @param {TextChannel} channel Thread channel
   * @param {Message} msg Message sent by user
   * @param {MessageAttachment} attachment
   */
  private async send(
    isImage: boolean,
    channel: TextChannel,
    msg: Message,
    attachment: MessageAttachment,
  ): Promise<Message> {
    const att: Attachment = {
      source: attachment.url,
      messageID: msg.id,
      type: FileType.Image,
      sender: msg.author.id,
      name: attachment.name || '',
      id: attachment.id,
    };
    const embed = isImage
      ? Embeds.messageAttachmentImage(att, msg.author)
      : Embeds.messageAttachment(att, msg.author);

    return channel.send(embed);
  }

  /**
   * Store record of this attachment
   * @param {boolean} isImage
   * @param {string} id The message ID of the embed that was sent in the embed
   * by Modmail.
   * @param {Message} msg Message from the user
   * @param {MessageAttachment} attachment Attachment sent by user
   * @returns {Promise<void>}
   */
  private async store(
    isImage: boolean,
    id: string,
    msg: Message,
    attachment: MessageAttachment,
  ): Promise<void> {
    const pool = Modmail.getDB();
    return pool.attachments.create({
      messageID: id,
      name: attachment.name || '',
      sender: msg.author.id,
      source: attachment.url,
      type: isImage ? FileType.Image : FileType.File,
    });
  }

  /**
   * Checks whether or not an attachment is an image or not
   * using the IMAGE_REGEX declared in globals
   * @param {MessageAttachment} attachment
   * @returns {boolean}
   */
  private isImage(attachment: MessageAttachment): boolean {
    if (attachment.name === null) {
      return false;
    }
    const extension = this.getExtension(attachment.name);

    return (IMAGE_REGEX).test(extension);
  }

  /**
   * Get the file extension of the attachment
   * @param {string} name File name
   * @returns {string}
   */
  private getExtension(name: string): string {
    return name.substr(name.lastIndexOf('.') + 1);
  }
}
