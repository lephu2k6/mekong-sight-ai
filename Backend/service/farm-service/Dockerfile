FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY packages ./packages
COPY Backend/service/farm-service ./Backend/service/farm-service

RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/Backend/service/farm-service
RUN npm run build

CMD ["npm", "start"]
