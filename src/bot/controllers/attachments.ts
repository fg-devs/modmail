import { Attachment, FileType } from '@Floor-Gang/modmail-types';
import { Message, MessageAttachment } from 'discord.js';
import { IMAGE_REGEX } from '../../common/globals';
import Controller from '../models/controller';
import ModmailBot from './bot';
import Embeds from '../util/Embeds';
import MMMessage from '../controllers/messages/message';

export default class AttachmentController extends Controller {
  constructor(modmail: ModmailBot) {
    super(modmail, 'attachments');
  }

  public async create(
    msg: MMMessage,
    msgAtt: MessageAttachment,
  ): Promise<Attachment> {
    const pool = ModmailBot.getDB();

    return pool.attachments.create({
      messageID: msg.getID(),
      name: msgAtt.name || '',
      sender: msg.getSenderID(),
      source: msgAtt.url,
      type: AttachmentController.isImage(msgAtt)
        ? FileType.Image
        : FileType.File,
    });
  }

  public async handle(
    msg: MMMessage,
    messageAttachments: Iterator<MessageAttachment>,
    anonymously: boolean,
  ): Promise<void> {
    const thread = await msg.getThread();

    if (thread === null) {
      throw new Error('The thread doesn\'t exist anymore.');
    }

    const attTasks: Promise<Attachment>[] = [];
    const sendTasks: Promise<Message>[] = [];
    const recvTasks: Promise<Message>[] = [];
    const sender = await msg.getSender();

    let msgAttOpt = messageAttachments.next();
    while (!msgAttOpt.done) {
      attTasks.push(this.create(msg, msgAttOpt.value));
      msgAttOpt = messageAttachments.next();
    }

    const attachments = await Promise.all(attTasks);
    const dmChannel = await thread.getDMChannel();
    const thChannel = await thread.getThreadChannel();

    if (thChannel === null) {
      throw new Error('The thread channel doesn\'t exist anymore.');
    }

    for (let i = 0; i < attachments.length; i += 1) {
      const attachment = attachments[i];
      const threadEmbed = Embeds.attachmentSend(
        attachment,
        sender,
        false,
      );
      const dmEmbed = Embeds.attachmentSend(
        attachment,
        sender,
        anonymously,
      );

      recvTasks.push(thChannel.send(threadEmbed));
      sendTasks.push(dmChannel.send(dmEmbed));
    }

    await Promise.all(recvTasks);
    await Promise.all(sendTasks);
  }

  /**
   * Handles attachments sent by a client
   * @param {Message} msg Message sent the user
   * @param {Iterator<MessageAttachment>} messageAttachments
   * @returns {Promise<void>}
   */
  public async handleDM(
    msg: MMMessage,
    messageAttachments: Iterator<MessageAttachment>,
  ): Promise<void> {
    const thread = await msg.getThread();

    if (thread === null) {
      return;
    }

    const thChannel = await thread.getThreadChannel();

    if (thChannel === null) {
      throw new Error('The thread channel doesn\'t exist anymore.');
    }

    const attTasks: Promise<Attachment>[] = [];
    const recvTasks: Promise<Message>[] = [];
    const user = await msg.getUser();
    let msgAttOpt = messageAttachments.next();

    while (!msgAttOpt.done) {
      attTasks.push(this.create(msg, msgAttOpt.value));
      msgAttOpt = messageAttachments.next();
    }

    const attachments = await Promise.all(attTasks);

    for (let i = 0; i < attachments.length; i += 1) {
      const attachment = attachments[i];
      const threadEmbed = Embeds.attachmentRecv(
        attachment,
        user,
      );

      recvTasks.push(thChannel.send(threadEmbed));
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
