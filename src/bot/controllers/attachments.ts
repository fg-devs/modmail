import { Attachment, FileType } from '@newcircuit/modmail-types';
import { Message, MessageAttachment } from 'discord.js';
import { IMAGE_REGEX } from '../../common/globals';
import { Message as MMMessage } from './';
import Controller from './controller';
import ModmailBot from '../bot';
import Embeds from '../util/Embeds';

export default class AttachmentController extends Controller {
  constructor(modmail: ModmailBot) {
    super(modmail, 'attachments');
  }

  /**
   * Store a Discord attachment into the database
   * @param  {MMMessage} msg The Modmail message that this is associated with
   * @param  {MessageAttachment} msgAtt The Discord message attachment
   * @return {Promise<Attachment>}
   */
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

  /**
   * Handle a staff's attachments of a modmail message
   * @param  {MMMessage} msg The modmail message
   * @param  {Iterator<MessageAttachment>} msgAtts The Discord message
   * attachments that are apart of this modmail message
   * @param  {boolean} anonymously Whether or not the staff sent them
   * anonymously
   * @return {Promise<void>}
   */
  public async handle(
    msg: MMMessage,
    msgAtts: Iterator<MessageAttachment>,
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

    // Store all the attachments into the database
    let msgAttOpt = msgAtts.next();
    while (!msgAttOpt.done) {
      attTasks.push(this.create(msg, msgAttOpt.value));
      msgAttOpt = msgAtts.next();
    }

    const attachments = await Promise.all(attTasks);
    const dmChannel = await thread.getDMChannel();
    const thChannel = await thread.getThreadChannel();

    if (thChannel === null) {
      throw new Error('The thread channel doesn\'t exist anymore.');
    }

    // Send all the attachments to the member's DMs and thread
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
   * Handles attachments sent by a member
   * @param   {MMMessage} msg Message sent the member
   * @param   {Iterator<MessageAttachment>} msgAtts The Discord message
   * attachments of this Modmail message
   * @returns {Promise<void>}
   */
  public async handleDM(
    msg: MMMessage,
    msgAtts: Iterator<MessageAttachment>,
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

    // Store all the attachments
    let msgAttOpt = msgAtts.next();
    while (!msgAttOpt.done) {
      attTasks.push(this.create(msg, msgAttOpt.value));
      msgAttOpt = msgAtts.next();
    }

    // Send the attachments to the thread
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
   * @param   {MessageAttachment} attachment
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
   * @param   {string} name File name
   * @returns {string}
   */
  public static getExtension(name: string): string {
    return name.substr(name.lastIndexOf('.') + 1);
  }
}
