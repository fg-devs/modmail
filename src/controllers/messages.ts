import { Thread } from 'modmail-types';
import { Message, TextChannel } from 'discord.js';
import Controller from '../models/controller';
import Modmail from '../Modmail';
import ThreadController from './threads';

export default class MessageController extends Controller {
  private readonly threads: ThreadController;

  constructor(modmail: Modmail, threads: ThreadController) {
    super(modmail, 'messages');

    this.threads = threads;
  }

  /**
   * This is called when a user calls a command
   * @param {Message} msg Message sent by user
   * @returns {Promise<void>}
   */
  public async handle(msg: Message): Promise<void> {
    const pool = this.modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === null) {
      return;
    }

    await pool.messages.add({
      clientID: null,
      content: msg.content,
      edits: [],
      files: [],
      internal: true,
      isDeleted: false,
      modmailID: msg.id,
      sender: msg.author.id,
      threadID: thread.id,
    });
  }

  /**
   * This is called when a user DM's modmail
   * @param {Message} msg Message sent by user
   * @returns {Promise<void>}
   */
  public async handleDM(msg: Message): Promise<void> {
    const pool = this.modmail.getDB();

    const thread = await pool.threads.getCurrentThread(msg.author.id);

    if (thread !== null) {
      await this.threads.sendMessage(msg, thread);
    } else {
      await this.threads.create(msg);
    }
  }

  /**
   * When a user deletes a message on their end let's do the same
   * on the thread, except merely mark it as deleted to let the staff
   * know that they didn't mean to send that message, but they did.
   * @param {Message} msg Message deleted
   * @param {Thread} thread Thread for this user
   * @returns {Promise<void>}
   */
  public async markAsDeleted(msg: Message, thread: Thread): Promise<void> {
    const pool = this.modmail.getDB();

    // get the thread channel for this message
    const thChan = await this.modmail.channels.fetch(
      thread.channel,
      true,
      true,
    );

    if (thChan === null) {
      return;
    }
    const thChannel = thChan as TextChannel;

    // get the message sent by modmail for this user's message
    const dbMessage = await pool.messages.fetch(msg.id);
    if (dbMessage === null) {
      return;
    }

    const thMessage = await thChannel.messages.fetch(
      dbMessage.modmailID,
      true,
      true,
    );

    if (thMessage === null) {
      return;
    }

    // mark that message as deleted
    const embed = thMessage.embeds[0];
    embed.footer = {
      text: 'Deleted',
    };

    await thMessage.edit(embed);
    await pool.messages.setDeleted(msg.id);
  }

  /**
   * editMessage is called when a user edits their message and then it gets
   * updated on the thread.
   * @param {Message} oldVersion Message that was edited (old iteration)
   * @param {Message} newVersion Message that was edited
   * @param {Thread} thread
   * @returns {Promise<void>}
   */
  public async editMessage(
    oldVersion: Message,
    newVersion: Message,
    thread: Thread,
  ): Promise<void> {
    const pool = this.modmail.getDB();
    let thChannel;
    let thMessage;

    try {
      // get thread channel
      const thChan = await this.modmail.channels.fetch(thread.channel);

      thChannel = thChan as TextChannel;

      // get thread message
      const dbMessage = await pool.messages.fetch(newVersion.id);

      if (dbMessage === null) {
        return;
      }

      thMessage = await thChannel.messages.fetch(dbMessage.modmailID);
    } catch (_) {
      return;
    }

    const embed = thMessage.embeds[0];
    embed.description = newVersion.content;
    embed.addField(
      `Version ${embed.fields.length + 1}: `,
      oldVersion.content,
      false,
    );
    // edit the thread iteration of the message that was editted
    await thMessage.edit(embed);
    // store the new edit to the edits table
    await pool.edits.add({
      content: newVersion.content,
      message: thMessage.id,
      version: 0,
    });
  }
}
