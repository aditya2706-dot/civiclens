FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first for Docker caching
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Setting Node environment
ENV NODE_ENV=production

# The port your Express backend uses
EXPOSE 5001

# Start the server
CMD ["npm", "start"]
