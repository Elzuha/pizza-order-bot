# SLACK BOT
## Description
#### Pizza ordering app via Slack bot. Two services connected by RabbitMQ. Support servie is designed to receive information about orders, update their status, send messages to users in Slack.
## Launch
#### 1) Set up Slack app
#### 2) Create `.env` with
  `SLACK_APP_TOKEN=<your-app-token>`  
  `SLACK_SIGNIN_SECRET=<your-app-signin-token>`  
  `BOT_APP_PORT=<port-for-bot-app>`  
  `SUPPORT_APP_PORT=<port-for-support-app>`  
  `MONGO_URL=<mongo-url>`  
  `AMPQ_CONNECT_URL=<url>`  
  `RABBITMQ_NODENAME=<rabbitmq-node>`  
  `RABBITMQ_VHOST=<rabbitmq-vhost>`  
  `RABBITMQ_PASS=<rabbitmq-password>`  
  `RABBITMQ_USER=<rabbitmq-user>`  
  `RABBITMQ_PORT=<rabbitmq-port>`  
#### 3) Use ngrok http `<port-for-bot-app>`
#### 4) After start copy URL from ngrok and paste it to "Event Subcriptions" tab in app settings
## Start
`docker-compose up`
