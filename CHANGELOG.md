# 📋 Changelog

Semua perubahan penting pada project ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2024-01-27

### ✨ Features

- **Cloudflare Worker** - Worker utama untuk serve blocklist
- **AdGuard DNS Format** - Output format `||domain.com^` yang kompatibel
- **OmniRoute API Integration** - Pencarian domain via API eksternal
- **Tranco List** - Pattern matching dari top 1M domain
- **Keyword Engine** - Generate domain berdasarkan keyword judi
- **Static Domain List** - 200+ domain judi yang sudah diketahui
- **Brand Combinations** - Generate domain dari brand + TLD
- **Auto-cache** - Cache 1 jam untuk performa optimal
- **GitHub Actions** - Auto-deploy saat push ke main

### 📦 Scripts

- `generate-blocklist.js` - Generate blocklist lokal
- `test-blocklist.js` - Test blocklist ke worker
- `worker.test.js` - Unit tests

### 📚 Documentation

- README.md - Dokumentasi lengkap
- docs/SETUP.md - Panduan setup & konfigurasi

---

## [Unreleased]

### Planned

- [ ] Web scraper untuk mengambil domain dari situs judi
- [ ] Database domain via Cloudflare KV
- [ ] Dashboard untuk monitoring
- [ ] Rate limiting & caching
- [ ] Multiple output formats (hosts file, dnsmasq)
- [ ] Auto-update scheduler
- [ ] Telegram bot untuk notifikasi
