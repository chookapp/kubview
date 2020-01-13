FROM node:12

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

RUN npm run build

EXPOSE 4000

CMD [ "bash", "run.sh" ]
