ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

ENV DEBIAN_FRONTEND=noninteractive
ENV NVM_DIR="/usr/local/share/nvm"
ENV NVM_SYMLINK_CURRENT=true \
    PATH=${NVM_DIR}/current/bin:${PATH}

RUN apt-get update && curl -ssL https://raw.githubusercontent.com/microsoft/vscode-dev-containers/main/script-library/node-debian.sh -o /tmp/node-debian.sh \
    && apt-get update \
    && bash /tmp/node-debian.sh "${NVM_DIR}" \
    && curl -fsSL https://aka.ms/install-azd.sh | bash
