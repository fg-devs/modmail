import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import Categories from '../../util/Categories';
import Members from '../../util/Members';

export default class OpenThread extends Command {
  constructor(client: CommandoClient) {
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

  public async run(
    msg: CommandoMessage,
    { userID }: {userID: string},
  ): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    let member;
    let selectorRes;

    try {
      member = await Members.getMember(userID, msg.guild);

      const hasThread = await pool.threads.getCurrentThread(member.id);
      if (hasThread !== null) {
        throw new Error('This user already has a thread open');
      }

      selectorRes = await Categories.categorySelector(
        pool.categories,
        msg.channel,
        msg.author,
        this.client,
      );
    } catch (e) {
      console.error(e);
      return msg.say(e);
    }

    const channel = await selectorRes.guild.channels.create(
      `${member.user.username}-${member.user.discriminator}`,
      {
        type: 'text',
      },
    );

    if (member.user.dmChannel === undefined) {
      await member.createDM(true);
    }

    await channel.setParent(selectorRes.category);
    await channel.send(await Embeds.memberDetails(pool.threads, member));
    await channel.send(Embeds.newThreadFor(msg.author, member.user));
    await pool.users.create(member.user.id);
    await pool.threads.open(member.user.id, channel.id, selectorRes.id);

    return null;
  }
}
