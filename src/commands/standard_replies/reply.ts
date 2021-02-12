import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';

type Args = {
  name: string
}

export default class StandardReply extends Command {
  constructor(client: Modmail) {
    super(client, {
      description: 'Reply with a standard reply',
      group: 'standard_replies',
      guildOnly: true,
      memberName: 'sreply',
      name: 'sreply',
      aliases: ['sr'],
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
    const modmail = Modmail.getModmail();
    const pool = Modmail.getDB();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread === null || msg.guild === null) {
      const res = 'Not currently in a modmail thread';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const standardReply = await pool.standardReplies.get(args.name);
    if (standardReply === null) {
      const res = 'Unable to locate that standard reply...';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    await thread.sendSR(msg, standardReply.reply, false);

    return null;
  }
}
