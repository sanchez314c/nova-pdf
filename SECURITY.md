# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | Yes       |
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

We take the security of Nova PDF Reader seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainers with a detailed description of the vulnerability
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity within 5 business days
- **Resolution**: We aim to release a fix within 30 days for critical vulnerabilities
- **Disclosure**: We will coordinate with you on public disclosure timing

### Scope

The following are in scope for security reports:

- **Electron Security**: Context isolation bypasses, nodeIntegration issues, sandbox escapes
- **IPC Vulnerabilities**: Unauthorized IPC message handling, input validation issues
- **File System Access**: Path traversal, unauthorized file access
- **Network Security**: TTS API communication, data exposure
- **Dependency Vulnerabilities**: Known CVEs in project dependencies
- **Docker Security**: Container escape, privilege escalation

### Out of Scope

- Vulnerabilities in third-party services not directly managed by this project
- Social engineering attacks
- Denial of service attacks that require significant resources
- Issues in dependencies that already have upstream fixes available

## Security Best Practices

Nova PDF Reader implements the following security measures:

- **Context Isolation**: Main and renderer processes are strictly isolated
- **Sandbox Mode**: Renderer process runs in a sandboxed environment
- **No nodeIntegration**: Node.js APIs are not exposed to the renderer
- **Content Security Policy**: CSP headers restrict resource loading
- **Preload Scripts**: All IPC communication goes through a typed preload bridge
- **Input Sanitization**: TTS text is sanitized to strip HTML, URLs, and markdown

## Dependencies

We regularly monitor and update dependencies to address known vulnerabilities. Run `pnpm audit` to check for known issues in the dependency tree.
