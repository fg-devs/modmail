FROM node:17-alpine AS base

WORKDIR /opt/app
COPY config.yml /app/config.yml

# Change this to yarn.lock for yarn
COPY --chown=node:node package-lock.json . 
COPY --chown=node:node package.json .
RUN npm install

FROM base AS build

COPY . /opt/app

RUN npm run build

FROM base AS prod

ENV NODE_ENV="production"

COPY --from=build /opt/app/build /opt/app/build
COPY --from=build /opt/app/node_modules /opt/app/node_modules
COPY --from=build /opt/app/package.json /opt/app/package.json
COPY --from=build /opt/app/config.yml /opt/app/config.yml

RUN chown node:node /opt/app

USER node

CMD [ "npm", "run", "start" ]
