@echo off
echo 🚀 Iniciando infraestrutura do WhatsApp (Evolution API)...
docker compose -f infrastructure/evolution-api/docker-compose.yml up -d
echo ✅ Evolution API iniciada em http://localhost:8081
echo 🔑 API Key: 429614461957a853b9b3
pause
