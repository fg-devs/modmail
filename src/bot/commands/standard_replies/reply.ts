import { CommandoMessage } from 'discord.js-commando';
import Command from '../../models/command';
import ModmailBot from '../../controllers/bot';
import LogUtil from '../../util/Logging';

type Args = {
  name: string
}

export default class StandardReply extends Command {
  constructor(client: ModmailBot) {
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
          prompt: 'What\'s the name of the standard reply?',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const pool = ModmailBot.getDB();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread === null || msg.guild === null) {
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

    await thread.sendSR(msg, standardReply.reply, false);

    return null;
  }
}
