FROM node:12

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
EXPOSE 4000

CMD [ "bash", "run.sh" ]
