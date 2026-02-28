FROM node:18-alpine

WORKDIR /app

# Copy root package.json and workspace definition
COPY package.json .
# Copy shared packages
COPY packages ./packages
# Copy service code
COPY Backend/service/iot-service ./Backend/service/iot-service

# Install dependencies for the specific workspace
RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/Backend/service/iot-service
RUN npm run build

CMD ["npm", "start"]
