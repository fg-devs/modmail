import { Command, CommandoMessage } from 'discord.js-commando';
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
    const modmail = Modmail.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a thread..';
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    if (msgID !== undefined) {
      await thread.deleteMsg(msgID);
    } else {
      await thread.deleteLastMsg(msg.author.id);
    }

    await msg.react('✅');

    return null;
  }
}
