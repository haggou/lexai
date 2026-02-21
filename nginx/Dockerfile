FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our config
COPY nginx.conf /etc/nginx/conf.d/

# Expose ports
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
