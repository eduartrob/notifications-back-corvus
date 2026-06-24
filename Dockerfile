FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# The start command should be overridden in docker-compose for dev/prod, but providing a default:
CMD ["npm", "start"]
