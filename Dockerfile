FROM node:18

ENV APP_DIR=/app

RUN mkdir $APP_DIR
COPY . $APP_DIR

WORKDIR $APP_DIR

RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3100/tcp

CMD ["node", "./lib/index.js"]
