FROM node:latest as builder

RUN mkdir /app

ADD . /app
RUN \
  cd /app \
  && npm install \
  && make \
  && make source-package

FROM base:universal-focal

RUN \
  apt-get update \
  && apt-get install -y \
    nginx-extras \
    socat \
    python3-pip \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install j2cli

COPY --from=builder /app/jitsi-meet.tar.bz2 /

COPY docker-configs /config
COPY start-nginx.sh /
RUN \
  mkdir /config/nginx/sites \
  && mkdir /config/nginx/site-confs \
  && tar xjf /jitsi-meet.tar.bz2 -C /config/nginx/sites \
  && chmod 0755 /start-nginx.sh

RUN install-all-stubs

EXPOSE 80

CMD ["/usr/local/bin/ssm_env", "/start-nginx.sh"]
