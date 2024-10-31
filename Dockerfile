FROM node:latest
WORKDIR /app
COPY package.json /app
ENV NODE_ENV=development
RUN npm install
COPY . /app
CMD ["node", "index.js"]