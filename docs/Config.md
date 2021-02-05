# Modmail Configuration
You can set `CONFIG` enviroment variable with a file path for custom config
placement.

## General Configuration
Everything that is on the root of the config is listed here
| Attribute Name | Description                                                         | Default |
|----------------|---------------------------------------------------------------------|---------|
| logLevel       | How much log details do you want? Options: DEBUG, INFO, ERROR, WARN | DEBUG   |

## Bot Configuration
Everything under `bot` is listed here
| Attribute Name | Description                                                                         | Default                      |
|----------------|-------------------------------------------------------------------------------------|------------------------------|
| token          | The Discord bot access token (found in Discord Developer Portal)                    | empty                        |
| prefix         | Prefix for all the commands, this helps talk to the right bot if there are multiple | !                            |
| owners         | These are Discord user IDs they have the power to add new categories                | ['Owner ID 1', 'Owner ID 2'] |

## Database Configuration
Everything under `database` is listed here
| Attribute Name | Description                                              | Default   |
|----------------|----------------------------------------------------------|-----------|
| host           | Postgres Resolvable Host                                 | 127.0.0.1 |
| port           | Postgres Port                                            | 5432      |
| username       | Username for Postgres                                    | modmail   |
| password       | Password for Postgres user                               | 1234      |
| database       | Database to utilize                                      | postgres  |
| schema         | Schema for modmail, this should almost always be default | modmail   |
