FROM nginx:1.21.6-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# For certificates with a password:
RUN mkdir -p /etc/keys
RUN echo 'louis' > /etc/keys/global.pass