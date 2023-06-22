FROM node:16

RUN mkdir -p /support-service/backend
WORKDIR /support-service

COPY package*.json tsconfig.json ./

RUN npm install
# RUN npm i -g ts-node

CMD [ "npm", "run", "serve" ]