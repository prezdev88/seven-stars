FROM nginx:stable-alpine

COPY index.html style.css game.js /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/
