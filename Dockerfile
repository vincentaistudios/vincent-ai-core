FROM node:20-bookworm-slim

# Instalação de dependências do sistema (ffmpeg para áudio/vídeo)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro para aproveitar o cache das camadas do Docker
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar o restante do código
COPY . .

# Garantir que as pastas de dados existam e tenham as permissões corretas
RUN mkdir -p banco_de_dados/sessao banco_de_dados/estado banco_de_dados/recursos

ENV NODE_ENV=production

# O bot é um processo stateful, expor portas se necessário para o Dashboard (3099)
EXPOSE 3099

CMD ["npm", "start"]
