FROM node:16

LABEL author="Louis Huang <meowfish.org@gmail.com>"
LABEL description="Fund demo app"

WORKDIR /usr/src/app

# Install npm dependencies
COPY package*.json ./
# RUN npm install (dev only)
RUN npm ci --only=production

# Copy code and stuff:
# backend code:
COPY dist ./dist
# frontend code:
COPY _app ./_app
# credentials for HTTPS
COPY _ssl ./_ssl

COPY wait-for-it.sh ./wait-for-it.sh
COPY run.sh ./run.sh

# environment variables:
ENV NODE_ENV=production
ENV KOA_APP_KEY_0="prod-OEK5zjaAMPc3L6iK7PyUjCOziUH3rsrMKB9u8H07La1SkfwtuBoDnHaaPCkG5Brg"
ENV KOA_APP_KEY_1="prod-MNKeIebviQnCPo38ufHcSfw3FFv8EtnAe1xE02xkN1wkCV1B2z126U44yk2BQVK7"
ENV JWT_SECRET="prod-nq6eSLw5wOUMXyzSS9jUBH9CCkaapzZAPVEv"
ENV LOG_DIR="_logs"
ENV CONSOLE_LOG_LEVEL="debug"
ENV DB_HOST="postgres"
ENV DB_NAME="app_funds_prod"    
ENV DB_PASSWORD="pw20220501"
ENV PORT=3000
ENV REDIS_URL="redis://:pw20220501@redis:6379/1"

EXPOSE 3333

# CMD ["tail", "-f", "/dev/null"]
CMD ["./wait-for-it.sh", "postgres:5432", "--", "./run.sh"]
