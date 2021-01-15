import { RoleLevel } from 'modmail-types';
import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { Requires } from '../../util/Perms';
import { CategoryResolvable } from '../../models/types';
import LogUtil from '../../util/Logging';

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
  public async run(
    msg: CommandoMessage,
    args: Args,
  ): Promise<Message | Message[] | null> {
    const optUserID = (/[0-9]+/g).exec(args.userID);

    if (optUserID === null || optUserID.length === 0) {
      return msg.say('Please mention a user or provide an ID');
    }

    const userID = optUserID[0];
    const pool = Modmail.getDB();
    const user = await msg.client.users.fetch(userID, true, true);
    const category = await pool.categories.fetch(
      CategoryResolvable.guild,
      msg.guild.id,
    );

    if (category === null) {
      const res = "This guild isn't part of a category.";
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    if (user === null) {
      const res = 'Failed to get that member, is it the correct ID?';
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    const hasThread = await pool.threads.getCurrentThread(user.id);

    if (hasThread !== null) {
      const res = 'This user already has a thread open';
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    const channel = await msg.guild.channels.create(
      `${user.username}-${user.discriminator}`,
      {
        type: 'text',
      },
    );

    if (user.dmChannel === undefined) {
      try {
        await user.createDM();
      } catch (e) {
        const res = 'Failed to create DM with this user.';
        LogUtil.cmdWarn(msg, res);
        return msg.say(res);
      }
    }

    await channel.setParent(category.channelID);
    await channel.send(await Embeds.memberDetails(pool.threads, user));
    await channel.send(Embeds.newThreadFor(msg.author, user));
    await pool.users.create(user.id);
    await pool.threads.open(user.id, channel.id, category.id);

    await msg.react('✅');
    await new Promise((r) => setTimeout(r, 5000));
    await msg.delete();

    return null;
  }
}
