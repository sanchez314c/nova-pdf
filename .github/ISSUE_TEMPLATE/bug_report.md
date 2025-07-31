---
name: Bug Report
about: Report a bug or unexpected behavior
title: '[BUG] '
labels: bug
assignees: sanchez314c
---

## Description

A clear description of what the bug is.

## Steps to Reproduce

1. Open the app
2. ...
3. ...

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## System Info

- OS: Ubuntu XX.XX
- Node.js version: `node --version`
- GPU: (e.g., NVIDIA RTX 3080)
- TTS mode: Docker GPU / Docker CPU / Local server
- App version: (from package.json)

## Logs

Paste any relevant logs:

```
# Electron DevTools console errors

# TTS server logs (if TTS-related)
docker logs nova-kokoro-tts --tail 30
# or
tail -30 /tmp/nova-tts-server.log
```

## Screenshots

If applicable, add screenshots.

## Additional Context

Anything else relevant.
