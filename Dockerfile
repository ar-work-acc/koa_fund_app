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

# other settings file (lazy here, should set the ENV variables)
COPY _prod.env ./_prod.env
# Other environment variables:
ENV NODE_ENV production

EXPOSE 3333

# CMD ["tail", "-f", "/dev/null"]
CMD ["./wait-for-it.sh", "postgres:5432", "--", "./run.sh"]
