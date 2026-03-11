FROM php:8.2-apache

# Extensões para NFePHP/sped-nfe
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libonig-dev \
    zip unzip \
    && docker-php-ext-install soap curl mbstring \
    && CFLAGS="-I/usr/src/php" docker-php-ext-install dom xmlreader xmlwriter simplexml \
    && a2enmod rewrite

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# DocumentRoot para /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY composer.json ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .

EXPOSE 80
