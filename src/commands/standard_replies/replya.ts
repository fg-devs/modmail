import { CommandoMessage } from 'discord.js-commando';
import Command from '../../models/command';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';

type Args = {
  name: string
}

export default class StandardReplyAnon extends Command {
  constructor(client: Modmail) {
    super(client, {
      description: 'Reply with a standard reply anonymously',
      group: 'standard_replies',
      memberName: 'sreplya',
      name: 'sreplya',
      aliases: ['sra', 'sar'],
      guildOnly: true,
      args: [
        {
          key: 'name',
          type: 'string',
          prompt: 'The name of the standard reply',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = Modmail.getDB();
    const modmail = Modmail.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a modmail thread';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const standardReply = await pool.standardReplies.fetch(args.name);
    if (standardReply === null) {
      const res = 'Unable to locate that standard reply...';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    await thread.sendSR(msg, standardReply.reply, true);

    return null;
  }
}
