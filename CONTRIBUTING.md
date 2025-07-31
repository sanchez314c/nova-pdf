# Contributing to Nova PDF Reader

Thank you for your interest in contributing to Nova PDF Reader. This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites

- **Node.js** 20.0.0 or higher
- **pnpm** 9.0.0 or higher
- **Docker** 24.0+ with NVIDIA Container Toolkit (for GPU TTS)
- **NVIDIA GPU** with CUDA 12.8+ support (optional, for GPU-accelerated TTS)
- **Python** 3.10+ (for local TTS server development)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nova-pdf-reader.git
cd nova-pdf-reader

# Install dependencies
pnpm install

# Start TTS engine (GPU mode)
pnpm tts:start

# Start development mode
pnpm dev
```

### Project Structure

```
nova-pdf-reader/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Entry point
│   │   ├── preload.ts     # Context bridge
│   │   └── services/      # TTS & PDF services
│   ├── renderer/          # React frontend
│   │   ├── components/    # UI components
│   │   ├── stores/        # Zustand state
│   │   └── styles/        # Tailwind CSS
│   └── shared/            # Shared types
├── docker/                # Docker configurations
├── tts-server/            # Python TTS server
├── build/                 # Build resources
└── scripts/               # Utility scripts
```

## How to Contribute

### Types of Contributions

- **Bug Fixes**: Fix reported issues or discovered bugs
- **Features**: Implement new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Accessibility**: Improve application accessibility

### First-Time Contributors

Look for issues labeled `good first issue` or `help wanted`. These are specifically curated for new contributors.

## Pull Request Process

1. **Branch Naming**: Use descriptive branch names:
   - `feature/description` for new features
   - `fix/description` for bug fixes
   - `docs/description` for documentation changes
   - `refactor/description` for code refactoring

2. **Before Submitting**:
   - Ensure your code passes all linting rules: `pnpm lint`
   - Verify TypeScript types are correct: `pnpm type-check`
   - Run tests: `pnpm test`
   - Update documentation if needed
   - Add entries to CHANGELOG.md under `[Unreleased]`

3. **PR Requirements**:
   - Fill out the pull request template completely
   - Link related issues
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Ensure CI checks pass

4. **Review Process**:
   - At least one maintainer review is required
   - Address all review feedback
   - Keep PRs focused and reasonably sized

## Coding Standards

### TypeScript / React

- Follow the existing ESLint configuration
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zustand for state management
- Follow React best practices for performance

### Styling

- Use Tailwind CSS utility classes
- Follow the existing dark theme design system
- Use the `nova-*` color palette defined in `tailwind.config.js`

### Electron

- Maintain context isolation between main and renderer processes
- Use the preload script for IPC communication
- Follow Electron security best practices

### Python (TTS Server)

- Follow PEP 8 style guidelines
- Use type hints where possible
- Include docstrings for functions and classes

### General

- Write self-documenting code with clear variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Handle errors appropriately

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks

### Examples

```
feat(tts): add support for streaming audio playback
fix(pdf): resolve page rendering issue with large documents
docs(readme): update installation instructions
refactor(renderer): extract audio controls into separate component
```

## Reporting Bugs

Use the [Bug Report](https://github.com/mastercontrol/nova-pdf-reader/issues/new?template=bug_report.md) issue template. Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, GPU, Node.js version)
- Screenshots or logs if applicable

## Requesting Features

Use the [Feature Request](https://github.com/mastercontrol/nova-pdf-reader/issues/new?template=feature_request.md) issue template. Include:

- Clear description of the proposed feature
- Use case and motivation
- Any proposed implementation approach

## License

By contributing to Nova PDF Reader, you agree that your contributions will be licensed under the [MIT License](LICENSE).
