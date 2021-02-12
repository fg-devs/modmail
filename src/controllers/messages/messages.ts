import { Thread } from '@Floor-Gang/modmail-types';
import { Message, TextChannel } from 'discord.js';
import MMMessage from './message';
import Controller from '../../models/controller';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';

export default class MessageController extends Controller {
  constructor(modmail: Modmail) {
    super(modmail, 'messages');
  }

  public async getAll(threadID: string): Promise<MMMessage[]> {
    const pool = Modmail.getDB();
    const data = await pool.messages.fetchAll(threadID);

    return data.map((msg) => new MMMessage(this.modmail, msg));
  }

  public async getLastFrom(
    threadID: string,
    authorID: string,
  ): Promise<MMMessage | null> {
    const pool = Modmail.getDB();
    const data = await pool.messages.getLastMessage(threadID, authorID);

    if (data === null) { return null; }

    return new MMMessage(this.modmail, data);
  }

  public async getByID(id: string): Promise<MMMessage | null> {
    const pool = Modmail.getDB();
    const data = await pool.messages.fetch(id);

    if (data === null) { return null; }

    return new MMMessage(this.modmail, data);
  }

  /**
   * This is called when a user calls a command
   * @param {Message} msg Message sent by user
   * @returns {Promise<void>}
   */
  public async handle(msg: Message): Promise<void> {
    const pool = Modmail.getDB();
    const thread = await this.modmail.threads.getByChannel(msg.channel.id);

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
      threadID: thread.getID(),
    });
  }

  /**
   * This is called when a user DM's modmail
   * @param {Message} msg Message sent by user
   * @returns {Promise<void>}
   */
  public async handleDM(msg: Message): Promise<void> {
    const { threads } = this.modmail;

    const thread = await threads.getByAuthor(msg.author.id);

    if (thread !== null) {
      await thread.recvMsg(msg);
    } else {
      await threads.createFor(msg);
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
    const pool = Modmail.getDB();

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
    const pool = Modmail.getDB();
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

    // store the new edit to the edits table
    await pool.edits.add(newVersion.content, thMessage.id);

    const edits = await pool.edits.fetch(thMessage.id);
    const embed = Embeds.editsRecv(newVersion.author, edits);
    // edit the thread iteration of the message that was edited
    await thMessage.edit(embed);
  }
}
