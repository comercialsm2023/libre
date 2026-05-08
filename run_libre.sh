#!/bin/bash

# 1. Sincronizar Base de Dados do Drive
echo "Sincronizando base de dados do Google Drive..."
python3 drive_sync.py

# 2. Iniciar MeiliSearch (Busca Interna)
echo "Iniciando MeiliSearch (Motor de Busca)..."
./meilisearch --db-path ./meili_data --master-key "DrhYf7zENyR6AlUCKmnz0eYASOQdl6zxH7s7MKFSfFCt" --no-analytics &
MEILI_PID=$!

# 3. Iniciar FerretDB em Background (Usando SQLite)
echo "Iniciando FerretDB (Tradução MongoDB -> SQLite)..."
# Usamos o porto 27017 para o LibreChat pensar que é o Mongo real
./ferretdb --handler sqlite --sqlite-url "file:./data/" --listen-addr 127.0.0.1:27017 &
FERRET_PID=$!

# Esperar os serviços iniciarem
sleep 10

# 4. Configurar Variáveis de Ambiente
export MONGO_URI="mongodb://127.0.0.1:27017/libre"
export GOOGLE_KEY="AIzaSyDMW0BmCW2X5iL5tm1KVtt6pzRn_LHKS4E"
export SEARCH=true
export MEILI_HOST="http://127.0.0.1:7700"
export MEILI_MASTER_KEY="DrhYf7zENyR6AlUCKmnz0eYASOQdl6zxH7s7MKFSfFCt"

# 5. Iniciar a App Libre
echo "Iniciando a App Libre (Modo Dev)..."
npm run backend:dev

# Ao terminar (Ctrl+C), fazer o upload final para o Drive
function finish {
    echo "Encerrando e fazendo backup final para o Google Drive..."
    kill $FERRET_PID
    kill $MEILI_PID
    python3 drive_sync.py --upload
    exit
}
trap finish SIGINT SIGTERM
