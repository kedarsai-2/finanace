## Render-friendly Dockerfile (Spring Boot / Maven, Java 21)
## - Multi-stage build: compile in Maven image, run on slim JRE
## - Binds to Render's injected $PORT
## - Default profile: prod (override via env if desired)
##
## Build on Render:
##   Root Directory: backend
##   Dockerfile Path: Dockerfile
##

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Cache deps first
COPY pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

# Build
COPY src ./src
RUN mvn -q -DskipTests -Pprod package


FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Run as non-root
RUN set -eux; \
    # Some base images may already have UID 1000 or useradd quirks; be idempotent.
    if ! getent passwd 1000 >/dev/null; then \
      useradd -r -u 1000 -m -d /home/appuser -s /usr/sbin/nologin appuser; \
    fi; \
    chown -R 1000:1000 /app
USER 1000:1000

COPY --from=build /workspace/target/*.jar /app/app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""

# Render injects PORT; default locally to 8080
EXPOSE 8080
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]

