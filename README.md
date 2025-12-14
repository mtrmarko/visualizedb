# VisualizeDB

VisualizeDB is a hard fork of [ChartDB](https://github.com/chartdb/chartdb>), a powerful, web-based database diagramming editor allowing you to instantly visualize your database schema, customize diagrams and export SQL scripts. The reason for a fork was my desire to self-host the tool and showcase various schema designs to recruiters, as part of my job search. I found the current self-hosted version of ChartDB limiting. While ChartDB offers a paid version where you can host and share diagrams, it did not align with my self-host goals. The self-hosted version of ChartDB only allows storing diagrams in local web browser's IndexDB, which makes it difficult to share with recruiters. So, I set out to add the missing features I wanted and strip out things I did not want:

- Add ExpressJS based API backend to:
  - Store diagrams in a SQLite database
  - Enable JWT token based authentication
  - Enable diagram sharing via public links that enable users to view diagrams in restricted viewer mode
- Strip all analytics and references to ChartDB cloud offering and Github
- Upgrade from Node 22 to 24
- Upgrade to the latest version of all package dependencies including React from version 18 to 19 and refactor code to address all compatibility issues
- Switch the Docker image to use Caddy (my new favorite web/reverse proxy server) instead of Nginx
- Add Docker Compose file since we now have a full stack app
- Convert the project to use `pnpm` instead of `npm` package manager as a way to improve security and optimize package management and build performance and reduce disk usage
- Organize the repository as monorepo and leverage pnpm workspaces to streamline dependency management between frontend and backend code
- Add commit linting to ensure commit messages are adequate and standardized according to [Conventional Commits standard](https://www.conventionalcommits.org)
- Rework Github Actions:
  - CI action now uses pnpm
  - Combine Release and Publish actions
  - Remove `googleapis/release-please-action` reusable action as a way to automated releases and replace with `standard-version` node package
    - Release process now relies on running the version bump with `pnpm release` which will scan historical commits, prepare the CHANGELOG.md file and bump the version based on the commit types. Lastly, on new version tag push, Github Action will kick off the release pipeline that creates a Github release and pushes the container image to Docker Hub
  - Use Docker buildx to build image, include SBOM and provenance and scan for vulnerabilities as a way to secure and document packages and dependencies

While I have some experience building ExpressJS backends and React front ends, it was never my main career focus. So, I am also using this project as a test grounds and a showcase for:

- Ability to securely architect full stack apps and effectively pick and manage the modern JavaScript, TypeScript, CI/CD (DevOps) and container (Docker) tooling
- Experiment with large language model (LLM) tools and practice prompt engineering. I have used the following to various degrees:
  - Claude and Claude Code
  - ChatGPT and Codex
  - Gemini and Gemini CLI
  - Github Copilot web agents and VSCode extension

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
pnpm install
pnpm run dev:all
```

### Build

```bash
pnpm install
pnpm run build
```

### Build and Run in Docker locally

```bash
docker compose build
docker compose up -d
```

Open your browser and navigate to `https://localhost`.

## ChartDB Fork Process

I cloned ChartDB main branch when the latest commit was 06aaa612a54a76f122a5dba374d92504c9a2b041, which was version 1.18.1. I then squashed all historical commits into one commit prior to the latest one (HEAD~1) in order to cleanup Git history and compact the repository a bit. I did keep the latest commit from ChartDB as a starting point and for historical reference.

## Contributing

Currently not accepting contributions. This is a personal project, intended for my personal use.

## License

VisualizeDB is licensed under the [GNU Affero General Public License v3.0](LICENSE) to comply with upstream ChartDB license requirements.
