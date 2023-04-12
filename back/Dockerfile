FROM node:alpine
WORKDIR /back
COPY package.json .
RUN npm install\
    && npm install typescript -g
COPY . .
RUN npm run build
EXPOSE 9000
CMD ["node", "./dist/server.js"]