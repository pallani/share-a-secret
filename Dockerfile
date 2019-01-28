FROM mhart/alpine-node:11.6.0

ENV APP_PATH=/usr/src/app
WORKDIR $APP_PATH
COPY ./ $APP_PATH
RUN npm install

CMD npm run start