FROM alpine:latest as build

WORKDIR /opt/spark-application-composer

COPY config /opt/spark-application-composer/config
COPY controllers /opt/spark-application-composer/controllers
COPY lib /opt/spark-application-composer/lib
COPY models /opt/spark-application-composer/models
COPY public /opt/spark-application-composer/public
COPY schemas /opt/spark-application-composer/schemas
COPY index.js /opt/spark-application-composer/
COPY package.json /opt/spark-application-composer/
COPY package-lock.json /opt/spark-application-composer/
COPY server.js /opt/spark-application-composer/

ENV NODE_ENV development

RUN apk --no-cache add \
    nodejs \
    npm && \
    npm install && \
    npm prune --production

# Build the release image
FROM alpine:latest as release

WORKDIR /opt/spark-application-composer

RUN apk --no-cache add \
    nodejs \
    npm

COPY --from=build /opt/spark-application-composer/ /opt/spark-application-composer/

RUN echo `date` > /opt/spark-application-composer/public/build.txt

EXPOSE 8080
ENV PORT 8080

CMD ["node", "server.js"]
