# Contributing to mv3-proxy-kit

Thank you for your interest in contributing to `mv3-proxy-kit`! We are building the most reliable, cross-browser proxy and VPN toolkit for Manifest V3 extensions, and we are thrilled you are here to help us improve.

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). We expect all contributors to maintain a professional and welcoming environment for everyone.

## Reporting Bugs
If you find a bug, please use our **Bug Report Template** when opening an issue. A good bug report includes:
- Clear steps to reproduce the behavior.
- Expected vs. actual behavior.
- **Environment Details:** It is critical to state the exact browser (Chrome, Firefox, etc.) and version you are testing on, as MV3 implementations differ drastically between browsers.
- Any relevant logs from the background service worker.

## Suggesting Features
We welcome new ideas! Before writing any code, please open a discussion or issue using our **Feature Request Template**. This allows the maintainers to discuss the architectural implications and ensure your proposed solution aligns with the project's roadmap before you invest time in coding.

## Environment Setup
To get started locally, you will need Node.js (v18+) installed. Clone the repository and install all workspace dependencies:

```bash
git clone https://github.com/infralayers/mv3-proxy-kit.git
cd mv3-proxy-kit
npm install
```

## Architecture Overview
This project is structured as an npm workspace (monorepo) to separate the library from its testing tools:
- `packages/core/`: The actual `mv3-proxy-kit` library codebase. All core proxy logic, state management, and authentication code resides here.
- `packages/example-extension/`: A fully functional browser extension built using the core library. This is heavily used for manual cross-browser verification.

## Coding Standards
We enforce strict typing and formatting standards to ensure enterprise-grade code quality:
- Ensure there are no TypeScript errors by running `npm run typecheck`.
- All new functions must include TypeScript types for parameters and return values.

## Branching Strategy
Please create a new branch for your work. We follow standard branch naming conventions:
- `feat/your-feature-name` (For new features)
- `fix/your-bug-fix-name` (For bug fixes)
- `docs/your-doc-update` (For documentation changes)

## Commit Guidelines
We strictly enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages. This helps us auto-generate changelogs.
- Example: `feat: add support for declarative proxy whitelists`
- Example: `fix: resolve pacScript injection bug in Firefox`

## Testing Requirements
All new code must include accompanying test coverage.

### 1. Unit Tests
We use `vitest`. Because Chrome and Firefox mock APIs vary wildly, ensure your code handles both synchronous and asynchronous callback behaviors if interacting with browser APIs.
```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
```

### 2. Cross-Browser Manual Verification
If you are modifying core proxy or authentication logic, **you must manually verify your changes in real browsers** using the example extension.

1. Build both packages: 
   ```bash
   npm run build --workspace=packages/core
   npm run build --workspace=packages/example-extension
   ```
2. Navigate to `packages/example-extension/`.
3. Because Chrome and Firefox use incompatible manifests, copy the appropriate file into place:
   - **For Chrome:** `cp manifest.chrome.json manifest.json` (Load unpacked via `chrome://extensions/`)
   - **For Firefox:** `cp manifest.firefox.json manifest.json` (Load via `about:debugging#/runtime/this-firefox`)
4. Verify your logic end-to-end. (Delete the copied `manifest.json` when finished).

## Pull Request Process
1. Push your branch to your fork and submit a PR against the `main` branch.
2. Fill out the **Pull Request Template** checklist entirely. Do not skip the cross-browser verification check if you touched core proxy logic!
3. Ensure the CI/CD pipeline (GitHub Actions) is passing (Tests and Typechecks).
4. A maintainer will review your code across 5 axes: Correctness, Readability, Architecture, Security, and Performance.

## Getting Help
If you get stuck, have an architectural question, or just want to say hi, feel free to drop by our GitHub Discussions tab or join our [Discord Community](https://discord.gg/R8X3KGnpDD). We are happy to help!
