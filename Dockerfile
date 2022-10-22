FROM node:18-alpine
WORKDIR /app
COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build
ENTRYPOINT ["node", "dist/index.js"]
