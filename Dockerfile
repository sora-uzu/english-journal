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
EXPOSE 8000
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
