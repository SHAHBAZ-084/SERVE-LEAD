# Use Node.js as base
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Set dynamic PORT for Cloud Run
ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

# Start command
CMD [ "node", "server.js" ]
