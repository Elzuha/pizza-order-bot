FROM node:16

# Create app directory
RUN mkdir -p /bot-service/backend
WORKDIR /bot-service

COPY package*.json tsconfig.json ./

RUN npm install
# RUN npm i -g ts-node \

CMD [ "npm", "run", "serve" ]