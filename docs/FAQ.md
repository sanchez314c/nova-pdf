# FAQ

**Q: The TTS status shows "OFFLINE" but I started the container.**

The app polls `http://localhost:8880/v1/audio/voices` with a 3-second timeout. If the container just started, give it 30-60 seconds (GPU) or 60-120 seconds (CPU) to load the model. Click "Refresh Status" in the sidebar to recheck.

---

**Q: Can I use it without a GPU?**

Yes. Use the CPU Docker image:

```bash
docker compose -f docker/docker-compose.cpu.yml up -d
```

TTS is much slower (real-time or slower vs 35x-100x with GPU), but it works.

---

**Q: What file types are supported?**

PDF (`.pdf`), plain text (`.txt`), and Markdown (`.md`). Password-protected PDFs are not supported - pdf.js can't decrypt them.

---

**Q: Why does the app look like it's floating with a gap around it?**

That's intentional. The frameless transparent Electron window lets the app render 16px from all screen edges, creating a floating effect with the Neo-Noir Glass Monitor design.

---

**Q: Pages jump around when reading markdown.**

Text files are split into virtual pages at 3000-character boundaries. The split point prefers newlines, but long paragraphs may split mid-sentence. This is a known limitation of the current `TextService` implementation.

---

**Q: Audio cuts off or doesn't play.**

Check the browser console in DevTools (opens automatically in dev mode). Common causes:
- TTS went offline mid-playback (check Docker container)
- The page has no extractable text (some PDFs are scanned images)
- Browser audio context needs user interaction first (click anything)

---

**Q: The window won't go transparent on my Linux setup.**

Ensure your compositor supports alpha channels. Try running with `--enable-transparent-visuals` (already included in the dev script). Some minimal WMs don't support compositing.

---

**Q: Can I change the default voice?**

Not persistently yet (AppPreferences is defined in types.ts but not yet wired to storage). Select your preferred voice each session from the dropdown in TTSControls.

---

**Q: Is there a Windows or macOS version?**

Not officially. The Linux-specific `app.commandLine.appendSwitch` calls for transparency would need to be gated, and the build targets would need updating. The `pnpm dist:all` script exists but hasn't been tested on other platforms.

---

**Q: Where are TTS server logs?**

Docker:

```bash
docker logs nova-kokoro-tts -f
```

Local Python server:

```bash
tail -f /tmp/nova-tts-server.log
```
