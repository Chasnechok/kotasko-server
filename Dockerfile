FROM node

WORKDIR /kotasko-server

ENV MONGO_URI=mongodb://mongo:27017/kotasko

VOLUME ["/../userFiles"]

COPY package.json /kotasko-server

RUN npm install @types/mongodb
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start:dev"]