#!/bin/bash

# 1. Baixar BD do Drive (Cache inicial)
echo "--- Sincronizando com o Google Drive (Download) ---"
python3 drive_sync.py

# 2. Iniciar MeiliSearch em Background
echo "--- Iniciando MeiliSearch ---"
./meilisearch --db-path ./meili_data --master-key "${MEILI_MASTER_KEY}" --no-analytics --http-addr "127.0.0.1:7700" &
MEILI_PID=$!

# 3. Iniciar FerretDB em Background
echo "--- Iniciando FerretDB ---"
./ferretdb --handler sqlite --sqlite-url "file:./data/" --listen-addr 127.0.0.1:27017 &
FERRET_PID=$!

# Esperar bancos iniciarem
sleep 5

# 4. Iniciar Backup Periódico (A cada 5 minutos)
(
  while true; do
    sleep 300
    echo "--- Backup Periódico para o Drive ---"
    python3 drive_sync.py --upload
  done
) &
BACKUP_PID=$!

# 5. Iniciar a App LibreChat
echo "--- Iniciando LibreChat ---"
export MONGO_URI="mongodb://127.0.0.1:27017/libre"
node api/server/index.js &
APP_PID=$!

# Função para encerramento gracioso
function graceful_shutdown {
    echo "--- Recebido sinal de paragem. Fazendo upload final... ---"
    python3 drive_sync.py --upload
    kill $APP_PID
    kill $FERRET_PID
    kill $MEILI_PID
    kill $BACKUP_PID
    exit 0
}

trap graceful_shutdown SIGINT SIGTERM

# Manter o script vivo enquanto a app corre
wait $APP_PID
