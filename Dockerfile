# syntax=docker/dockerfile:1
# Minimal static nginx image — the repo has no app source yet, so we serve
# a placeholder page. Replace with a real Dockerfile once source is added.
FROM nginx:1.27-alpine

# Copy placeholder page
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80

# Default nginx CMD (daemon off) is inherited from the base image
