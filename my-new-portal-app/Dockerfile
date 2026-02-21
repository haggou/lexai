# Build stage for React Frontend
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the app
RUN npm run build

# Final stage: Minimal image to hold the artifacts
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/build ./build
CMD ["tail", "-f", "/dev/null"]
