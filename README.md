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

---

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

---

## 🔑 Konfigurasi API OmniRoute

### Langkah 1: Dapatkan API Key

1. Buka website OmniRoute: `http://129.226.89.157:20128`
2. Login atau daftar akun baru
3. Buka menu **API Keys** atau **Settings → API**
4. Klik **"Generate New Key"** atau **"Create API Key"**
5. Copy API Key yang diberikan
6. **Simpan API Key di tempat aman!**

### Langkah 2: Set Environment Variables di Cloudflare

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik **Workers & Pages** di sidebar kiri
3. Klik worker `judol-adblock`
4. Klik tab **Settings** (atas)
5. Klik **Variables and Secrets** di sidebar kiri
6. Klik **"Add variable"**
7. Tambahkan variabel berikut:

| Variable Name | Type | Value |
|---------------|------|-------|
| `OMNIROUTE_API_URL` | **Text** | `http://129.226.89.157:20128/v1` |
| `OMNIROUTE_API_KEY` | **Secret** 🔒 | `API_KEY_KAMU_DISINI` |

8. Untuk `OMNIROUTE_API_KEY`, pilih **"Encrypt"** atau **"Secret"** agar API key tersembunyi
9. Klik **"Save"**

> ⚠️ **Penting:** API Key harus diset sebagai **Secret** agar tidak terlihat publik!

### Langkah 3: Verifikasi

1. Buka URL worker kamu: `https://judol-adblock.your-subdomain.workers.dev/`
2. Klik `/blocklist`
3. Pastikan domain dari OmniRoute muncul di blocklist
4. Cek header response untuk info sumber data

### Contoh Setup Lengkap

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Dashboard → Workers → judol-adblock        │
│  → Settings → Variables and Secrets                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Variable 1:                                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name:     OMNIROUTE_API_URL                         ││
│  │ Type:     Text                                       ││
│  │ Value:    http://129.226.89.157:20128/v1             ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  Variable 2:                                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name:     OMNIROUTE_API_KEY                         ││
│  │ Type:     🔒 Secret                                  ││
│  │ Value:    *********************                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│                         [Save]                           │
└─────────────────────────────────────────────────────────┘
```

### Langkah 4 (Opsional): Set via Wrangler CLI

Alternatif jika pakai CLI, buat file `.dev.vars` di root project:

```bash
# File: .dev.vars (untuk local development)
OMNIROUTE_API_URL=http://129.226.89.157:20128/v1
OMNIROUTE_API_KEY=API_KEY_KAMU_DISINI
```

```bash
# File: wrangler.toml (sudah include, tinggal uncomment)
[vars]
OMNIROUTE_API_URL = "http://129.226.89.157:20128/v1"
OMNIROUTE_API_KEY = "API_KEY_KAMU_DISINI"
```

> ⚠️ Jangan commit `.dev.vars` ke GitHub! File ini sudah ada di `.gitignore`

---

## 🔧 Konfigurasi Lainnya

### Environment Variables

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `OMNIROUTE_API_URL` | ❌ | `http://129.226.89.157:20128/v1` | Base URL API OmniRoute |
| `OMNIROUTE_API_KEY` | ✅ | - | API Key OmniRoute (WAJIB untuk pencarian) |

### KV Namespace (Optional)

Untuk caching stats:

1. Buka **Workers & Pages → KV**
2. Buat namespace baru (nama: `MY_KV`)
3. Buka tab **Settings** → **Bindings** → **Add binding**
4. Type: `KV Namespace`, Name: `MY_KV`
5. Pilih namespace yang tadi dibuat

---

## 📡 API Endpoints

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /` | Info & daftar endpoints |
| `GET /blocklist` | Blocklist dalam format AdGuard DNS |
| `GET /blocklist.txt` | Sama dengan `/blocklist` |
| `GET /stats` | Statistik blocklist |
| `GET /health` | Health check |

---

## 🛡️ Cara Pakai di AdGuard

### AdGuard DNS (Cloud)

1. Login ke [AdGuard DNS Dashboard](https://adguard-dns.io/)
2. Buka tab **Allowlist/Blocklist**
3. Klik **"Add Blocklist"**
4. Pilih **"Custom"**
5. Masukkan URL worker kamu:
   ```
   https://judol-adblock.your-subdomain.workers.dev/blocklist
   ```
6. Klik **"Add"**

### AdGuard Home (Self-hosted)

1. Buka dashboard AdGuard Home
2. Buka tab **Filters → DNS Blocklists**
3. Klik **"Add Blocklist"**
4. Pilih **"Use a custom blocklist"**
5. Masukkan URL worker
6. Klik **"Add"**

### Pi-hole

```bash
curl -s https://judol-adblock.your-subdomain.workers.dev/blocklist.txt | \
  grep "^\|\|" >> /etc/pihole/custom.list
```

---

## 📊 Sumber Domain

| # | Sumber | Deskripsi |
|---|--------|-----------|
| 1 | **Static List** | 200+ domain judi yang sudah diketahui |
| 2 | **OmniRoute API** | Pencarian via API eksternal (perlu API key) |
| 3 | **Tranco List** | Pattern matching dari top 1M domain |
| 4 | **Keyword Engine** | Generate domain berdasarkan keyword judi |

> 💡 Tanpa API key OmniRoute, worker tetap berfungsi menggunakan sumber lain (Static, Tranco, Keyword Engine).

---

## 📁 Struktur Project

```
judol-adblock/
├── README.md                  # Dokumentasi
├── CHANGELOG.md               # Changelog
├── LICENSE                    # MIT License
├── package.json               # Node.js config
├── wrangler.toml              # Config Cloudflare Workers
├── .dev.vars                  # Local env (jangan commit!)
├── .gitignore
├── docs/
│   └── SETUP.md               # Panduan setup lengkap
├── scripts/
│   ├── generate-blocklist.js  # Generate blocklist lokal
│   └── test-blocklist.js      # Test blocklist
├── src/
│   └── worker.js              # Worker utama
├── tests/
│   └── worker.test.js         # Unit tests
└── .github/
    └── workflows/
        └── deploy.yml         # Auto deploy
```

---

## 🔨 Development

```bash
# Install dependencies
npm install

# Jalankan local dev server
wrangler dev

# Test blocklist
curl http://localhost:8787/blocklist

# Run unit tests
npm test

# Test blocklist connectivity
npm run test:blocklist

# Deploy
wrangler deploy
```

---

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

---

## ❓ Troubleshooting

### API OmniRoute tidak jalan?

1. Pastikan API Key sudah benar
2. Pastikan API Key tidak expired
3. Cek status API di `http://129.226.89.157:20128/health`
4. Cek logs di Cloudflare Dashboard → Workers → judol-adblock → Logs

### Blocklist kosong?

1. Worker tetap jalan tanpa API key (menggunakan static list)
2. Cek apakah OmniRoute API aktif
3. Coba test lokal dengan `npm run test:blocklist`

### Deploy gagal?

1. Pastikan API token Cloudflare benar
2. Pastikan Account ID benar
3. Cek GitHub Actions logs

---

## ⚠️ Disclaimer

- Project ini untuk **penggunaan pribadi** dan **edukasi**
- Domain list diambil dari sumber publik
- Selalu verifikasi sebelum memblokir
- Gunakan dengan bijak

## 📄 License

MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.

---

**Made with ❤️ by [KancellKe2](https://github.com/KancellKe2)**
