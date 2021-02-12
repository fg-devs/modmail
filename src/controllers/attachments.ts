import { Attachment, FileType } from '@Floor-Gang/modmail-types';
import { Message, MessageAttachment } from 'discord.js';
import { IMAGE_REGEX } from '../globals';
import Controller from '../models/controller';
import Modmail from '../Modmail';

export default class AttachmentController extends Controller {
  constructor(modmail: Modmail) {
    super(modmail, 'attachments');
  }

  public async create(
    msg: Message,
    msgAtt: MessageAttachment,
  ): Promise<Attachment> {
    const pool = Modmail.getDB();

    return pool.attachments.create({
      messageID: msg.id,
      name: msgAtt.name || '',
      sender: msg.author.id,
      source: msgAtt.url,
      type: AttachmentController.isImage(msgAtt)
        ? FileType.Image
        : FileType.File,
    });
  }

  /**
   * Handles attachments sent by a client
   * @param {Message} msg Message sent the user
   * @returns {Promise<void>}
   */
  public async handleDM(msg: Message): Promise<void> {
    const thread = await this.modmail.threads.getByAuthor(msg.author.id);

    if (thread === null) {
      return;
    }

    const messageAttachments = msg.attachments.values();
    const attTasks: Promise<Attachment>[] = [];
    const recvTasks: Promise<void>[] = [];
    let msgAttOpt = messageAttachments.next();

    while (!msgAttOpt.done) {
      attTasks.push(this.create(msg, msgAttOpt.value));
      msgAttOpt = messageAttachments.next();
    }

    const attachments = await Promise.all(attTasks);

    for (let i = 0; i < attachments.length; i += 1) {
      recvTasks.push(thread.recvAttachment(msg, attachments[i]));
    }

    await Promise.all(recvTasks);
  }

  /**
   * Checks whether or not an attachment is an image or not
   * using the IMAGE_REGEX declared in globals
   * @param {MessageAttachment} attachment
   * @returns {boolean}
   */
  public static isImage(attachment: MessageAttachment): boolean {
    if (attachment.name === null) {
      return false;
    }
    const extension = AttachmentController.getExtension(attachment.name);

    return (IMAGE_REGEX).test(extension);
  }

  /**
   * Get the file extension of the attachment
   * @param {string} name File name
   * @returns {string}
   */
  public static getExtension(name: string): string {
    return name.substr(name.lastIndexOf('.') + 1);
  }
}
