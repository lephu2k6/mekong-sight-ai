FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY packages ./packages
COPY Backend/service/auth-service ./Backend/service/auth-service

RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/Backend/service/auth-service
RUN npm run build

CMD ["npm", "start"]
