# PrismAudio Hybrid (Local Service + Web UI + Desktop)

Este projeto foi organizado como aplicação híbrida no modelo "uTorrent Web":

- **Backend local** (Node + Express) em `backend/server.js`
- **Frontend web** (React + Vite) em `frontend/`
- **Empacotamento desktop** com Electron em `electron/main.cjs`
- **Builds finais** em `dist/`

## Estrutura de pastas

```text
/backend    -> serviço local (localhost), proxy API e segurança básica
/frontend   -> interface web React
/electron   -> processo desktop (abre janela e inicia backend interno)
/dist       -> instalador/artefatos gerados pelo electron-builder
```

## Requisitos

- Node.js 20+
- npm 10+
- (Opcional) Python para backend legado (`backend/main.py`)

## Variáveis de ambiente

- `PORT` (padrão `3000`)
- `HOST` (padrão `127.0.0.1`)
- `OPEN_BROWSER` (`true|false`, padrão `false`)
- `PYTHON_API_URL` (padrão `http://127.0.0.1:8000`)
- `AUTO_START_PYTHON` (`true|false`, padrão `true`)
- `PYTHON_CMD` (padrão `python`)

## Desenvolvimento (com hot reload)

1. Instale dependências:

```bash
npm run install:all
```

2. Suba backend + frontend com recarga automática:

```bash
npm run dev
```

- Frontend: `http://127.0.0.1:5173`
- Backend local: `http://127.0.0.1:3000`

## Inicialização local automática (abre navegador)

```bash
npm run start:local
```

Esse comando sobe o servidor local e abre o navegador padrão em `http://127.0.0.1:3000`.

## Build frontend

```bash
npm run build:frontend
```

## Rodar app desktop (dev)

```bash
npm run electron:dev
```

## Gerar executável Windows (.exe)

```bash
npm run electron:build
```

Após finalizar, os arquivos ficam em `dist/`.

## Segurança básica aplicada

- Bind explícito em `127.0.0.1` por padrão (não expõe externamente)
- Validação de payload no endpoint `/api/generate`
- `x-powered-by` desabilitado
- Limite de `1mb` em JSON
- Proxy interno apenas para rotas `/api` e `/audio`

## Logging

Logs simples com timestamp no backend local (`INFO`, `WARN`, `ERROR`).
