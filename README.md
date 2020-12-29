# Modmail

## Requirements
 * [NodeJS](https://nodejs.org)
 * [Postgres](https://www.postgresql.org/)

## Setup
After installing the requirements run the following command to install the
necessary dependencies for Modmail
```sh
$ npm i
```

Then you must compile the project and a `dist` (distribution) directory will
be generated
```sh
$ npm build
```

## Starting
If you use PM2 or any other process manager you can call `./dist/app.js` to
start the bot. For the rest you can use the following
```sh
$ npm start
```
