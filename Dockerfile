FROM node:17-alpine

WORKDIR /app
# NOTE(dylhack): this is an intentional possible exception to make sure
#                modmail is configured before executed.
COPY config.yml /app/config.yml
COPY . /app

RUN [ "npm", "i" ]
RUN [ "npm", "run", "build" ]

CMD [ "npm", "run", "start" ]
