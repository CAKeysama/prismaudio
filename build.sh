#!/usr/bin/env bash
# Script de Build Automático para Render.com

echo "Instalando dependências do Python..."
pip install -r backend/requirements.txt

echo "Instalando dependências do Node.js..."
cd frontend
npm install

echo "Compilando o Frontend..."
npm run build
cd ..

echo "Build concluído!"
