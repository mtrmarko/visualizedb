# Changelog

## 1.0.0 (2025-12-09)

### Features

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
