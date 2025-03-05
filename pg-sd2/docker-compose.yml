version: '3.3'
services:
  web:
    build:
      context: ./
    volumes:
      - .:/src
    command: supervisor -e  'js,pug,html' index.js
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: mysql
    restart: always
    env_file:
      - ./.env
    ports:
      - "3308:3306"
    volumes:
      - ./db:/var/lib/mysql
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    restart: always
    env_file:
      - ./.env
    ports:
      - "8081:80"
