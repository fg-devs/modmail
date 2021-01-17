import { Thread } from 'modmail-types';
import { Command, CommandoMessage } from 'discord.js-commando';
import { DMChannel, Message } from 'discord.js';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';

type Args = {
  msgID?: string;
}

// TODO(dylan): This command is ugly af fix someday
export default class Delete extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'delete',
      aliases: ['d', 'remove'],
      description: 'Delete a message',
      group: 'messages',
      memberName: 'delete',
      guildOnly: true,
      args: [
        {
          key: 'messageID',
          prompt: 'The message to delete',
          type: 'string',
          default: '',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, { msgID }: Args): Promise<null> {
    const pool = Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);
    if (thread === null) {
      const res = 'Not currently in a thread..';
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dm = await (user.dmChannel || user.createDM());

    const clientMessage = await this.getClientMsg(dm, thread, msg, msgID);
    const threadMessage = await this.getThreadMsg(thread, msg, msgID);

    if (!clientMessage || !threadMessage) {
      return null;
    }

    await threadMessage.delete();
    await clientMessage.delete();
    await pool.messages.setDeleted(threadMessage.id);
    await msg.react('✅');

    return null;
  }

  private async getClientMsg(
    dm: DMChannel,
    thread: Thread,
    msg: CommandoMessage,
    msgID?: string,
  ): Promise<Message | null> {
    const pool = Modmail.getDB();
    if (msgID) {
      try {
        const dbMessage = await pool.messages.fetch(msgID);

        if (dbMessage === null || dbMessage.clientID === null) {
          return null;
        }

        return dm.messages.fetch(dbMessage.clientID, true, true);
      } catch (err) {
        LogUtil.cmdWarn(msg, err);
        await msg.say('Unable to locate user message');
        return null;
      }
    }
    try {
      const recentMessage = await pool.messages.getLastMessage(
        thread.id,
        msg.author.id,
      );
      if (recentMessage.clientID === null) {
        return null;
      }
      return dm.messages.fetch(recentMessage.clientID, true, true);
    } catch (_) {
      return null;
    }
  }

  private async getThreadMsg(
    thread: Thread,
    msg: CommandoMessage,
    msgID?: string,
  ): Promise<Message | null> {
    if (msgID) {
      try {
        return await msg.channel.messages.fetch(msgID, true, true);
      } catch (_) {
        await msg.say('Unable to locate that message');
        return null;
      }
    }
    const pool = Modmail.getDB();
    let recentMessage;

    try {
      recentMessage = await pool.messages.getLastMessage(
        thread.id,
        msg.author.id,
      );
      return msg.channel.messages.fetch(recentMessage.modmailID, true, true);
    } catch (_) {
      await msg.say('No recent messages in thread');
      return null;
    }
  }
}
