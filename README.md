# VisualizeDB

VisualizeDB is a hard fork of [ChartDB](https://github.com/chartdb/chartdb>), a powerful, web-based database diagramming editor allowing you to instantly visualize your database schema, customize diagrams and export SQL scripts. The reason for a fork was my desire to self-host the tool and showcase various schema designs to recruiters, as part of my job search. I found the current self-hosted version of ChartDB limiting. While ChartDB offers a paid version where you can host and share diagrams, it did not align with my self-host goals. The self-hosted version of ChartDB only allows storing diagrams in local web browser's IndexDB, which makes it difficult to share with recruiters. So, I set out to add the missing features I wanted and strip out things I did not want included:

- Add ExpressJS based API backend to:
  - Store diagrams in a SQLite database
  - Enable JWT token based authentication
  - Enable diagram sharing via public links that enable users to view diagrams in restricted viewer mode
- Strip all analytics and references to ChartDB cloud offering and Github
- Switch the Docker image to use Caddy (my new favorite web/reverse proxy server) instead of Nginx

While I have some experience building ExpressJS backends and React front ends, it was never my main career focus. So, I am also using this project to showcase my prompt engineering skills and test out Claude Code, Gemini CLI and OpenAI Codex and Github Copilot. All 4 tools are being used for different bits of the development process.

## Supported Databases

- ✅ PostgreSQL
- ✅ MySQL
- ✅ SQL Server
- ✅ MariaDB
- ✅ SQLite
- ✅ CockroachDB
- ✅ ClickHouse
- ✅ Oracle

## Getting Started

### How To Use

```bash
npm install
npm run dev:all
```

### Build

```bash
npm install
npm run build
```

Or like this if you want to have AI capabilities:

```bash
npm install
VITE_OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> npm run build
```

### Run the Docker Container

```bash
docker run -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> -p 8080:80 ghcr.io/visualizedb/visualizedb:latest
```

#### Build and Run locally

```bash
docker build -t visualizedb .
docker run -e OPENAI_API_KEY=<YOUR_OPEN_AI_KEY> -p 8080:80 visualizedb
```

#### Using Custom Inference Server

```bash
# Build
docker build \
  --build-arg VITE_OPENAI_API_ENDPOINT=<YOUR_ENDPOINT> \
  --build-arg VITE_LLM_MODEL_NAME=<YOUR_MODEL_NAME> \
  -t visualizedb .

# Run
docker run \
  -e OPENAI_API_ENDPOINT=<YOUR_ENDPOINT> \
  -e LLM_MODEL_NAME=<YOUR_MODEL_NAME> \
  -p 8080:80 visualizedb
```

Open your browser and navigate to `http://localhost:8080`.

Example configuration for a local vLLM server:

```bash
VITE_OPENAI_API_ENDPOINT=http://localhost:8000/v1
VITE_LLM_MODEL_NAME=Qwen/Qwen2.5-32B-Instruct-AWQ
```

## ChartDB Fork Process

I cloned ChartDB main branch when the latest commit was 06aaa612a54a76f122a5dba374d92504c9a2b041, which was version 1.18.1. I then squashed all historical commits into one commit prior to the latest one (HEAD~1) in order to cleanup Git history and compact the repository a bit. I did keep the latest commit from ChartDB as a starting point and for historical reference.

## Contributing

Currently not accepting contributions. This is a personal project, intended for my personal use.

## License

VisualizeDB is licensed under the [GNU Affero General Public License v3.0](LICENSE) to comply with upstream ChartDB license requirements.
