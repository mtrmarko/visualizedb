# Contributing to VisualizeDB

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages. This allows us to automatically generate changelogs and determine version bumps.

### Commit Message Format

Each commit message consists of a **type**, an optional **scope**, and a **subject**:

```
<type>(<scope>): <subject>
```

**Example:**
```
feat: add dark mode toggle
fix: resolve authentication token expiration
docs: update API documentation
refactor: simplify database query logic
```

### Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or correcting tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the commit body:

```
feat!: redesign API authentication flow

BREAKING CHANGE: JWT tokens now expire after 15 minutes instead of 24 hours
```

This triggers a major version bump.

## Pull Request Guidelines

### PR Title Format

PR titles **must** follow the same conventional commit format since they become commit messages when squash-merged:

✅ **Good PR titles:**
- `feat: add CSV export functionality`
- `fix: correct database migration error`
- `docs: update installation instructions`

❌ **Bad PR titles:**
- `Update stuff`
- `Bug fixes`
- `WIP: working on feature`

The PR title check workflow will automatically validate your PR title.

### Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make your changes with conventional commits:**
   ```bash
   git commit -m "feat: add user search functionality"
   git commit -m "test: add tests for user search"
   ```

3. **Push and create a PR:**
   - Ensure PR title follows conventional commits format
   - The PR will be squash-merged, so the PR title becomes the final commit message

4. **Before committing:**
   - Lint will automatically run via pre-commit hook
   - Commit message format will be validated via commit-msg hook

## Release Process

Releases are created manually by maintainers when ready to deploy.

### For Maintainers: Creating a Release

1. **Ensure you're on the main branch with latest changes:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Run the release script:**
   ```bash
   # Automatic version bump based on commit types
   pnpm release

   # Or manually specify version bump:
   pnpm release:patch  # 1.0.0 → 1.0.1
   pnpm release:minor  # 1.0.0 → 1.1.0
   pnpm release:major  # 1.0.0 → 2.0.0
   ```

3. **Review the changes:**
   - Check the updated version in `package.json`
   - Review the generated `CHANGELOG.md`
   - Verify the commit message and tag

4. **Push the release:**
   ```bash
   git push --follow-tags origin main
   ```

5. **GitHub Actions will automatically:**
   - Build the project
   - Run tests
   - Create a GitHub Release with changelog
   - Build Docker image (when configured)

### Preview Release Changes

To see what would happen without making changes:

```bash
pnpm release:dry-run
```

This shows the version bump and changelog that would be generated.

## Testing Locally

### Run linting:
```bash
pnpm run lint          # Check for issues
pnpm run lint:fix      # Auto-fix issues
```

### Run tests:
```bash
pnpm run test          # Run all tests
```

### Build the project:
```bash
pnpm run build         # Build all packages
```

## Questions?

If you have questions about the contribution process, feel free to open an issue or discussion on GitHub.