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


FROM eclipse-temurin:21-jre-noble AS runtime
WORKDIR /app

# Run as non-root
RUN if ! getent passwd 1000 >/dev/null 2>&1; then useradd -r -u 1000 appuser; fi

COPY --from=build --chown=1000:1000 /workspace/target/*.jar /app/app.jar
USER 1000

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""

# Render injects PORT; default locally to 8080
EXPOSE 8080
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]

