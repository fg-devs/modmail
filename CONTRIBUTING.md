# Modmail
The concept of "Modmail" derives from [Reddit's Modmail](https://mods.reddithelp.com/hc/en-us/articles/360002085532-What-is-modmail),
the TL;DR is that it allows community members of any sort of platform
communicate with the moderation team in a quick and private focused setting.
All messages sent by the member is relayed to a chat where all moderators can
see any reply to. They, the moderators, can also talk to each other without
the member seeing them.

## The Modmail Ecosystem
While looking through the source code of Modmail there are a few terms that
need to be cleared up first.

### Main Entities
These are all the entities that exist in Modmail. Entities are controlled by
controllers.
 * "Category"           - A category is a community which can spawn new
                          threads
 * "Thread"             - A way for both staff and a member to communicate
 * "Message"            - A message sent in a thread either by a member or 
                          staff

### Terminology
Throughout the source code you'll see different terms used, here's all of them
broken down.
 * "Client" or "Member" - The member sending messages to the staff
 * "Client Message"     - A message sent by a member
 * "Internal Message"   - A message sent by mods where the member can't see
 * "Staff"              - The staff members of a "thread"
 * "Receiving Message"  - A message coming from a member to a thread
 * "Sending Message"    - A message coming from a staff to a thread

### Controllers
A controller is responsible for managing a group of entities that exist in the
Modmail ecosystem, so there is a controller for each entity that exists. Since
we're using JavaScript this approach is heavily object-oriented where a
controller is responsible for fetching and managing a entity while the
instance of that entity has methods for doing all the
heavy lifting... Example:
```js
// Threads is the thread controller
const thread = await threads.getByID("1234");
await thread.close();
```

## Bot & Server
There are two codebases in the repository, a server and a Discord bot. It's
quite simple the bot is in `src/bot` and the server is in `src/server`. The
server is utilized by our dashboard [modmail-web](https://github.com/NewCircuit/modmail-web).
Both codebases share the `src/common` directory and `src/database`. Modmail is
heavily database oriented to prevent racing conditions between the server and
bot.
