FROM node:16
ARG NPM_TOKEN
 
WORKDIR /usr/src/app
 
COPY package*.json ./

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > /usr/src/app/.npmrc && \
   npm install && \
   rm -f /usr/src/app/.npmrc

COPY . .
 
EXPOSE 3002	
CMD [ "npm", "start" ]
