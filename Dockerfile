FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM php:8.4-cli-alpine
RUN apk add --no-cache \
    icu-dev \
    postgresql-dev \
    libpng-dev \
    oniguruma-dev \
  && docker-php-ext-install intl pdo pdo_pgsql mbstring
WORKDIR /var/www/html
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
COPY --from=frontend-builder /app/public/build /var/www/html/public/build
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
  && php artisan config:clear \
  && php artisan route:clear \
  && php artisan view:clear
ENV APP_ENV=production \
    APP_DEBUG=false
# EXPOSE is optional on Render; the important part is binding to $PORT
CMD sh -lc 'set -e; php artisan optimize:clear; php artisan serve --host=0.0.0.0 --port="$PORT" & PID=$!; i=0; until php artisan migrate --force; do i=$((i+1)); if [ $i -ge 30 ]; then echo "migrate failed after retries" >&2; kill $PID; exit 1; fi; echo "migrate failed, retrying... ($i/30)" >&2; sleep 2; done; wait $PID'
