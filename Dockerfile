FROM node:16-alpine3.11

WORKDIR /root

# Get the entrypoint script from the current directory
COPY --chown=root:root entrypoint.sh /root

#Make the entrypoint script executable and install npm
RUN chmod 700 entrypoint.sh && npm install @slidev/cli @slidev/theme-default

WORKDIR /root/slides

ENTRYPOINT [ "/root/entrypoint.sh" ]