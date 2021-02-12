import { RoleLevel } from '@Floor-Gang/modmail-types';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { Requires } from '../../util/Perms';
import LogUtil from '../../util/Logging';
import ThreadController from '../../controllers/threads/threads';

type Args = {
  userID: string;
}

export default class OpenThread extends Command {
  constructor(client: Modmail) {
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
          prompt: 'User that will be contacted',
          type: 'string',
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
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
    const pool = Modmail.getDB();
    const modmail = Modmail.getModmail();
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

    const channel = await ThreadController.setupChannel(
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
