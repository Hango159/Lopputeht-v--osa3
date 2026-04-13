FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
