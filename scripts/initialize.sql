create schema modmail;

create type modmail.file_type as enum ('image', 'file');

alter type modmail.file_type owner to current_user;

create table modmail.users
(
    id bigint not null
        constraint users_pk
            primary key
);

alter table modmail.users
    owner to current_user;

create unique index users_id_uindex
    on modmail.users (id);

create table modmail.categories
(
    id        bigint               not null
        constraint categories_pk
            primary key,
    name      text                 not null,
    is_active boolean default true not null,
    guild_id  bigint               not null,
    emote     text                 not null
);

alter table modmail.categories
    owner to current_user;

create table modmail.threads
(
    id        bigint               not null
        constraint threads_pk
            primary key,
    author    bigint               not null
        constraint threads_users_id_fk
            references modmail.users,
    channel   bigint               not null,
    is_active boolean default true not null,
    category  bigint               not null
        constraint threads_categories_id_fk
            references modmail.categories
);

alter table modmail.threads
    owner to current_user;

create unique index threads_channel_uindex
    on modmail.threads (channel);

create unique index threads_channel_uindex_2
    on modmail.threads (channel);

create unique index threads_id_uindex
    on modmail.threads (id);

create table modmail.messages
(
    sender     bigint                not null
        constraint messages_users_id_fk
            references modmail.users,
    client_id  bigint                ,
    modmail_id bigint                not null,
    content    text                  not null,
    thread_id  bigint                not null
        constraint messages_threads_id_fk
            references modmail.threads,
    is_deleted boolean default false not null,
    internal boolean default false not null
);

alter table modmail.messages
    owner to current_user;

create unique index messages_client_id_uindex
    on modmail.messages (client_id);

create unique index messages_modmail_id_uindex
    on modmail.messages (modmail_id);

create table modmail.mutes
(
    user_id modmail.users not null,
    till bigint not null,
    category_id bigint not null,
    reason text not null
);

create table modmail.attachments
(
    id         bigint                                              not null
        constraint attachments_pk
            primary key,
    message_id bigint                                              not null
        constraint attachments_messages_modmail_id_fk
            references modmail.messages (modmail_id),
    name       text                                                not null,
    source     text                                                not null,
    sender     bigint                                              not null
        constraint attachments_users_id_fk
            references modmail.users,
    type       modmail.file_type default 'file'::modmail.file_type not null
);

alter table modmail.attachments
    owner to current_user;

create unique index attachments_id_uindex
    on modmail.attachments (id);

create unique index categories_emote_uindex
    on modmail.categories (emote);

create unique index categories_id_uindex
    on modmail.categories (id);

create unique index categories_name_uindex
    on modmail.categories (name);

create table modmail.edits
(
    content text              not null,
    message bigint            not null
        constraint edits_messages_modmail_id_fk
            references modmail.messages (modmail_id),
    version integer default 1 not null
);

alter table modmail.edits
    owner to current_user;
