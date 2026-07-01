# 📚 Personal Study Reader

Personal web-based reader for studying custom materials.

> ⚠️ **Private repository** — This is for personal use only.

## Features

- 📱 **Mobile-first** — Designed for reading on the go
- 🌿 **Eye-friendly** — Warm cream/sepia tones that don't strain your eyes
- 📊 **Progress tracking** — Never lose where you left off
- 🔍 **Instant search** — Find any unit quickly
- 👆 **Swipe navigation** — Swipe left/right between units
- 🌙 **Dark mode** — Warm sepia night mode for low-light reading
- 📶 **PWA / Offline** — Install as an app, read without internet
- ⌨️ **Keyboard shortcuts** — Arrow keys, D for dark mode

## How to Use

### On your PC
```bash
python -m http.server 8080
```
Open http://localhost:8080

### On your phone
1. Start server on PC (above)
2. Find your PC's IP: `ipconfig` (look for `192.168.x.x`)
3. On phone: go to `http://192.168.x.x:8080`
4. Add to Home Screen for app experience

## Structure

```
├── index.html      # Main app
├── styles.css      # Design system
├── app.js          # Application logic
├── units.json      # Study structure
├── manifest.json   # PWA config
├── sw.js           # Service worker (offline)
└── pages/          # Page images (JPEG)
```

## Regenerating Images
```bash
pip install pymupdf
python extract_pdf.py
```

---

*For personal use only.*
