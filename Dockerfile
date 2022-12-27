FROM node:16.13.2

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN yarn build
RUN yarn prisma generate

EXPOSE 3001
CMD [ "yarn", "start:prod" ]
