#!/bin/bash

# Script para inicialização rápida do Vincent AI Core via Docker

echo "🚀 Iniciando Vincent AI Core..."

# Verifica se o arquivo .env existe, se não, cria um a partir do exemplo
if [ ! -f .env ]; then
    echo "⚠️ .env não encontrado. Criando a partir do .env.example..."
    cp .env.example .env
    echo "❗ Por favor, edite o arquivo .env e adicione sua GROQ_API_KEY antes de continuar."
    exit 1
fi

# Build e Up do container
echo "📦 Construindo e subindo containers..."
docker compose up -d --build

echo "✅ Container iniciado com sucesso!"
echo "📡 Acompanhe os logs para o pareamento do WhatsApp:"
echo "👉 docker compose logs -f"
