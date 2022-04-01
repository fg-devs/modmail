FROM node:17-alpine AS base

WORKDIR /opt/app
COPY . /opt/app
RUN npm install


FROM base AS build

COPY . /opt/app
RUN npm run build


FROM base AS prod

ENV NODE_ENV="production"
WORKDIR /app
COPY config.yml /app/config.yml
COPY --from=build /opt/app/build /app/build
COPY --from=build /opt/app/node_modules /app/node_modules
COPY --from=build /opt/app/package.json /app/package.json
RUN chown node:node /opt/app
USER node

CMD [ "npm", "run", "start" ]
