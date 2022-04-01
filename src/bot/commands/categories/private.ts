import { RoleLevel } from '@newcircuit/modmail-types';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { PermsUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

/**
 * Make a category private
 *  * Admin+
 *  * Must be in a category "parent" channel that
 *    is being utilized a Modmail category
 */
export default class Private extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'private',
      aliases: ['makeprivate', 'privatecat', 'pc'],
      description: 'Make a category private',
      guildOnly: true,
      group: 'category',
      memberName: 'private',
      args: [],
    });
  }

  @PermsUtil.Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');

    if (category === null) {
      await msg.say('This isn\'t a category');
      return null;
    }

    await category.setPrivate(true);
    await msg.say('Made this category private.');
    return null;
  }
}
