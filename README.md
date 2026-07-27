# 🛡️ judol-adblock

**Cloudflare Worker untuk memblokir domain judi online — kompatibel dengan AdGuard DNS.**

Worker ini secara otomatis mengumpulkan, memverifikasi, dan memblokir ribuan domain judi online dari berbagai sumber.

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 🌐 **Cloudflare Worker** | Deploy serverless, tidak perlu VPS |
| 🛡️ **AdGuard DNS** | Format `\|\|domain.com^` yang kompatibel |
| 🔍 **API OmniRoute** | Pencarian & verifikasi domain via API |
| 📊 **Tranco List** | Pattern matching dari top 1M domain |
| 🎯 **Keyword Engine** | Deteksi domain judi berdasarkan keyword |
| 📦 **Static List** | Database domain judi yang sudah diketahui |
| ⚡ **Auto-cache** | Cache 1 jam untuk performa optimal |

## 🚀 Deploy

### Cara 1: Cloudflare Dashboard (Paling Mudah)

1. Buka [Cloudflare Workers](https://workers.cloudflare.com/)
2. Klik **"Create Application"** → **"Create Worker"**
3. Beri nama: `judol-adblock`
4. Copy-paste isi file [`src/worker.js`](src/worker.js)
5. Klik **"Deploy"**

### Cara 2: Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login ke Cloudflare
wrangler login

# Deploy
wrangler deploy
```

## 🔧 Konfigurasi

### Environment Variables

Set di **Cloudflare Dashboard → Workers → judol-adblock → Settings → Variables**:

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `OMNIROUTE_API_URL` | ❌ | `http://129.226.89.157:20128/v1` | Base URL API OmniRoute |

### KV Namespace (Optional)

Untuk caching stats:

1. Buka **Workers & Pages → KV**
2. Buat namespace baru (nama: `MY_KV`)
3. Buka tab **Settings** → **Bindings** → **Add binding**
4. Type: `KV Namespace`, Name: `MY_KV`
5. Pilih namespace yang tadi dibuat

## 📡 API Endpoints

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /` | Info & daftar endpoints |
| `GET /blocklist` | Blocklist dalam format AdGuard DNS |
| `GET /blocklist.txt` | Sama dengan `/blocklist` |
| `GET /stats` | Statistik blocklist |
| `GET /health` | Health check |

## 🛡️ Cara Pakai

### AdGuard DNS (Recommended)

1. Buka **AdGuard DNS Dashboard** → **Allowlist/Blocklist**
2. Klik **"Add Blocklist"**
3. Pilih **"Custom"**
4. Masukkan URL worker kamu:
   ```
   https://judol-adblock.your-subdomain.workers.dev/blocklist
   ```
5. Klik **"Add"**

### AdGuard Home

1. Buka **AdGuard Home** → **Filters → DNS Blocklists**
2. Klik **"Add Blocklist"**
3. Pilih **"Use a custom blocklist"**
4. Masukkan URL worker
5. Klik **"Add"**

### Pi-hole

```bash
# Tambahkan ke custom list
curl -s https://judol-adblock.your-subdomain.workers.dev/blocklist.txt | \
  grep "^\|\|" >> /etc/pihole/custom.list
```

## 📊 Sumber Domain

| # | Sumber | Deskripsi |
|---|--------|-----------|
| 1 | **Static List** | 200+ domain judi yang sudah diketahui |
| 2 | **OmniRoute API** | Pencarian via API eksternal |
| 3 | **Tranco List** | Pattern matching dari top 1M domain |
| 4 | **Keyword Engine** | Generate domain berdasarkan keyword judi |

## 📁 Struktur Project

```
judol-adblock/
├── README.md              # Dokumentasi
├── wrangler.toml          # Config Cloudflare Workers
└── src/
    └── worker.js          # Worker utama
```

## 🔨 Development

```bash
# Jalankan local dev server
wrangler dev

# Test blocklist
curl http://localhost:8787/blocklist

# Deploy
wrangler deploy
```

## 📋 Contoh Output

```
! Title: Judol Blocklist - Domain Judi Online
! Homepage: https://github.com/KancellKe2/judol-adblock
! Last modified: 2024-01-15T10:30:00.000Z
! Total domains: 5000+
! ────────────────────────────────────────────────

||188bet.com^
||sbobet.com^
||joker123.com^
||pragmaticplay.com^
||poker88.com^
...
```

## ⚠️ Disclaimer

- Project ini untuk **penggunaan pribadi** dan **edukasi**
- Domain list diambil dari sumber publik
- Selalu verifikasi sebelum memblokir
- Gunakan dengan bijak

## 📄 License

MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.

---

**Made with ❤️ by [KancellKe2](https://github.com/KancellKe2)**
