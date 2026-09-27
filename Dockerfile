# ==========================================
# Etapa 1: Build de la aplicación Java (Maven)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copiar archivos de Maven wrapper y POM
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

# Copiar el código fuente y compilar el JAR ejecutable
COPY src ./src
RUN ./mvnw package -DskipTests

# ==========================================
# Etapa 2: Imagen final liviana para producción
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copiar el JAR generado desde la etapa de construcción
COPY --from=builder /app/target/crintx-0.0.1-SNAPSHOT.jar app.jar

# Exponer el puerto del backend
EXPOSE 8080

# Variables de entorno por defecto
ENV PORT=8080
ENV STORAGE_TYPE=mongodb

# Ejecutar el backend
ENTRYPOINT ["java", "-jar", "app.jar"]
