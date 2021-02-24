import { RoleLevel } from '@Floor-Gang/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { Command } from '../../';
import ModmailBot from '../../../bot';
import { Threads } from '../../../controllers';
import { Embeds, LogUtil, PermsUtil } from '../../../util/';

type Args = {
  userID: string;
}

export default class OpenThread extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'openthread',
      aliases: ['contact', 'create', 'newthread', 'open'],
      description: 'Open a thread',
      group: 'threads',
      guildOnly: true,
      memberName: 'contact',
      args: [
        {
          key: 'userID',
          prompt: 'What\'s the ID of the user you want to contact?',
          type: 'string',
        },
      ],
    });
  }

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const optUserID = (/[0-9]+/g).exec(args.userID);

    if (msg.guild === null) {
      return null;
    }

    if (optUserID === null || optUserID.length === 0) {
      await msg.say('Please mention a user or provide an ID');
      return null;
    }

    const userID = optUserID[0];
    const pool = ModmailBot.getDB();
    const modmail = ModmailBot.getModmail();
    const user = await msg.client.users.fetch(userID, true);
    const category = await modmail.categories.getByGuild(msg.guild.id);

    if (category === null || !category.isActive) {
      const res = 'This guild isn\'t part of a category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    if (user === null) {
      const res = 'Failed to get that member, is it the correct ID?';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const thread = await modmail.threads.getByAuthor(user.id);

    if (thread !== null) {
      const res = 'This user already has a thread open';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const channel = await Threads.setupChannel(
      user,
      category,
      false,
      msg.author,
    );

    if (channel === null) {
      await msg.reply('Failed to create a channel for this user.');
      return null;
    }

    try {
      const notice = Embeds.threadNotice(category);
      const dms = await user.createDM();
      await dms.send(notice);
      await pool.users.create(user.id);
      await pool.threads.open(user.id, channel.id, category.getID(), false);

      await msg.react('✅');
    } catch (e) {
      let res;
      if (e.message.includes('Cannot send messages to this user')) {
        res = 'This user has their DM\'s off';
      } else {
        res = 'Something internal went wrong';
      }
      await msg.reply(res);
      LogUtil.cmdError(msg, e, res);
      await channel.delete();
    }

    return null;
  }
}
