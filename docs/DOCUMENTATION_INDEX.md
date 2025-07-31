# Documentation Index

**Project:** Nova PDF Reader v1.1.1
**Stack:** Electron 33 + React 18 + Vite 6 + TypeScript + Tailwind CSS 3.4 + Zustand 5
**TTS:** Kokoro-82M via Kokoro-FastAPI (Docker GPU/CPU or local Python)

This is the master index of all documentation for Nova PDF Reader.

---

## Root Files

| File | Description | Audience |
|------|-------------|----------|
| [README.md](../README.md) | Project overview, quick start, scripts, architecture summary | All |
| [LICENSE](../LICENSE) | MIT License | All |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute, PR process, coding standards | Contributors |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Contributor Covenant v2.1 | Contributors |
| [SECURITY.md](../SECURITY.md) | Vulnerability reporting policy, security scope | Security researchers |
| [CHANGELOG.md](../CHANGELOG.md) | Version history in Keep a Changelog format | All |
| [CLAUDE.md](../CLAUDE.md) | AI assistant project guidance, codebase context | AI tools |

---

## docs/ Files

### Getting Started

| File | Description | Audience |
|------|-------------|----------|
| [QUICK_START.md](QUICK_START.md) | Get running in under 5 minutes (TTS + app) | New users |
| [INSTALLATION.md](INSTALLATION.md) | Full install guide: Docker, local Python, AppImage, .deb | All users |
| [FAQ.md](FAQ.md) | Answers to common questions | All users |

### Development

| File | Description | Audience |
|------|-------------|----------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Dev setup, all scripts, directory structure, debugging, TypeScript configs | Developers |
| [WORKFLOW.md](WORKFLOW.md) | Git branches, commit conventions, dev loop, PR checklist, release process | Developers |
| [TESTING.md](TESTING.md) | Vitest setup, what to test, example tests, Electron IPC mocking | Developers |
| [CONFIGURATION.md](CONFIGURATION.md) | TTS backend URL, Docker config, Electron window settings, AppPreferences spec | Developers |

### Architecture and Reference

| File | Description | Audience |
|------|-------------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Process model, IPC flow, data flows, service designs, Linux transparency | Developers |
| [API.md](API.md) | Full preload bridge reference (window.nova), IPC channel table, Kokoro REST API | Developers |
| [TECHSTACK.md](TECHSTACK.md) | All runtime and dev dependencies with versions and purposes | Developers |

### Build and Deployment

| File | Description | Audience |
|------|-------------|----------|
| [BUILD_COMPILE.md](BUILD_COMPILE.md) | Build steps, TypeScript configs, Vite config, packaging with electron-builder | Developers |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Distributing AppImage and .deb, TTS backend requirements on target systems | DevOps / release |
| [PERFORMANCE.md](PERFORMANCE.md) | TTS latency benchmarks, memory profile, rendering notes, profiling tips | Developers |
| [MIGRATION.md](MIGRATION.md) | Upgrade notes between versions, planned future migrations | Developers |

### Product and Planning

| File | Description | Audience |
|------|-------------|----------|
| [PRD.md](PRD.md) | Product requirements, feature inventory, known bugs, roadmap | All |
| [TODO.md](TODO.md) | Backlog: high/medium/low priority items, technical debt, completed work | Developers |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Fixes for TTS, PDF, Electron, build, and window issues | All users |
| [LEARNINGS.md](LEARNINGS.md) | Technical decisions and lessons: Linux transparency, IPC buffers, TTS sanitization | Developers |

---

## Coverage Summary

| Category | Count | Files |
|----------|-------|-------|
| Root docs | 7 | README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, CLAUDE.md |
| Getting started | 3 | QUICK_START, INSTALLATION, FAQ |
| Development | 4 | DEVELOPMENT, WORKFLOW, TESTING, CONFIGURATION |
| Architecture and reference | 3 | ARCHITECTURE, API, TECHSTACK |
| Build and deployment | 4 | BUILD_COMPILE, DEPLOYMENT, PERFORMANCE, MIGRATION |
| Product and planning | 5 | PRD, TODO, TROUBLESHOOTING, LEARNINGS, DOCUMENTATION_INDEX |
| **Total** | **27** | |

---

## Where to Start

- **New to the project:** [QUICK_START.md](QUICK_START.md) then [ARCHITECTURE.md](ARCHITECTURE.md)
- **Setting up dev:** [DEVELOPMENT.md](DEVELOPMENT.md)
- **Understanding the API:** [API.md](API.md)
- **Something broken:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Product context:** [PRD.md](PRD.md)

---

*Last updated: 2026-03-27*
