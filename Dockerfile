# Use lightweight Node.js 18 image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Inform Docker the app listens on port 3000
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]