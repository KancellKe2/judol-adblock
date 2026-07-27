# ⚙️ Setup & Konfigurasi Lengkap

Panduan lengkap setup **judol-adblock** dari awal sampai jalan.

---

## 📋 Daftar Isi

1. [Prasyarat](#prasyarat)
2. [Deploy Worker](#deploy-worker)
3. [Konfigurasi API OmniRoute](#konfigurasi-api-omniroute)
4. [Setup AdGuard](#setup-adguard)
5. [GitHub Actions (Auto Deploy)](#github-actions)
6. [Local Development](#local-development)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Prasyarat

Sebelum mulai, pastikan kamu punya:

- [ ] Akun [Cloudflare](https://www.cloudflare.com/) (gratis)
- [ ] Akun OmniRoute + API Key
- [ ] [Node.js](https://nodejs.org/) v18+ (untuk local development)
- [ ] (Opsional) Akun [GitHub](https://github.com/) untuk auto deploy

---

## 🚀 Deploy Worker

### Cara 1: Cloudflare Dashboard (Paling Mudah)

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik **Workers & Pages** di sidebar kiri
3. Klik **"Create Application"**
4. Klik **"Create Worker"**
5. Beri nama: `judol-adblock`
6. Copy-paste isi file [`src/worker.js`](../src/worker.js)
7. Klik **"Deploy"**
8. Catat URL worker kamu (contoh: `https://judol-adblock.xxx.workers.dev`)

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

### Langkah 1: Dapatkan API Key OmniRoute

1. Buka website OmniRoute: `http://129.226.89.157:20128`
2. Login atau daftar akun baru
3. Buka menu **API Keys** atau **Settings → API**
4. Klik **"Generate New Key"** atau **"Create API Key"**
5. Copy API Key yang diberikan
6. **Simpan API Key di tempat aman!**

### Langkah 2: Set Environment Variables di Cloudflare

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik **Workers & Pages** → pilih worker `judol-adblock`
3. Klik tab **Settings**
4. Klik **Variables and Secrets** di sidebar
5. Klik **"Add variable"**
6. Tambahkan variabel berikut:

#### Variable 1: API URL

| Field | Value |
|-------|-------|
| **Name** | `OMNIROUTE_API_URL` |
| **Type** | Text |
| **Value** | `http://129.226.89.157:20128/v1` |

#### Variable 2: API Key (Secret)

| Field | Value |
|-------|-------|
| **Name** | `OMNIROUTE_API_KEY` |
| **Type** | 🔒 Secret |
| **Value** | `API_KEY_KAMU_DISINI` |

> ⚠️ **Penting:** Pilih type **Secret** agar API key tersembunyi dan tidak terlihat publik!

7. Klik **"Save"** untuk menyimpan

### Langkah 3: Verifikasi

1. Buka URL worker: `https://judol-adblock.xxx.workers.dev/`
2. Klik endpoint `/blocklist`
3. Pastikan domain dari OmniRoute muncul di blocklist
4. Cek header response:
   - `X-Total-Domains` → Jumlah total domain
   - `X-Generated-In` → Waktu generate

### Contoh Setup

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Dashboard → Workers → judol-adblock        │
│  → Settings → Variables and Secrets                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name:     OMNIROUTE_API_URL                         ││
│  │ Type:     Text                                       ││
│  │ Value:    http://129.226.89.157:20128/v1             ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name:     OMNIROUTE_API_KEY                         ││
│  │ Type:     🔒 Secret                                  ││
│  │ Value:    *********************                      ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Setup AdGuard

### AdGuard DNS (Cloud)

1. Login ke [AdGuard DNS Dashboard](https://adguard-dns.io/)
2. Buka tab **Allowlist/Blocklist**
3. Klik **"Add Blocklist"**
4. Pilih **"Custom"**
5. Masukkan URL worker:
   ```
   https://judol-adblock.xxx.workers.dev/blocklist
   ```
6. Klik **"Add"**
7. Tunggu beberapa menit agar blocklist ter-download

### AdGuard Home (Self-hosted)

1. Buka dashboard AdGuard Home (biasanya `http://localhost:3000`)
2. Buka tab **Filters → DNS Blocklists**
3. Klik **"Add Blocklist"**
4. Pilih **"Use a custom blocklist"**
5. Masukkan URL worker
6. Klik **"Add"**

### Pi-hole

```bash
curl -s https://judol-adblock.xxx.workers.dev/blocklist.txt | \
  grep "^||" | sed 's/^||//' | sed 's/\^$//' | \
  xargs -I {} echo "0.0.0.0 {}" | \
  sudo tee -a /etc/pihole/custom.list

sudo pihole restartdns
```

---

## 🔄 GitHub Actions (Auto Deploy)

### Setup

1. Buka repo → **Settings** → **Secrets and variables** → **Actions**
2. Klik tab **Secrets**
3. Tambahkan secrets berikut:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Token dari Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | ID akun Cloudflare |
| `OMNIROUTE_API_KEY` | API Key OmniRoute (opsional) |

### Dapat Cloudflare API Token

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik ikon profil → **My Profile** → **API Tokens**
3. Klik **"Create Token"**
4. Pilih **"Edit Cloudflare Workers"** template
5. Klik **"Continue to summary"**
6. Klik **"Create Token"**
7. Copy token

### Dapat Account ID

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih domain kamu
3. Scroll ke bawah di sidebar kanan
4. Copy **"Account ID"**

### Auto Deploy

Setelah secrets diset, setiap push ke branch `main` akan otomatis deploy!

---

## 💻 Local Development

### Install

```bash
git clone https://github.com/KancellKe2/judol-adblock.git
cd judol-adblock
npm install
```

### Buat File .dev.vars

```bash
# File: .dev.vars
OMNIROUTE_API_URL=http://129.226.89.157:20128/v1
OMNIROUTE_API_KEY=API_KEY_KAMU_DISINI
```

### Jalankan Dev Server

```bash
wrangler dev
```

Worker akan jalan di `http://localhost:8787`

### Test

```bash
# Unit tests
npm test

# Test blocklist connectivity
npm run test:blocklist

# Manual test
curl http://localhost:8787/blocklist
```

### Deploy

```bash
wrangler deploy
```

---

## 📊 Sumber Domain

| # | Sumber | Keterangan | API Key Required? |
|---|--------|------------|-------------------|
| 1 | **Static List** | 200+ domain judi yang sudah diketahui | ❌ Tidak |
| 2 | **OmniRoute API** | Pencarian via API eksternal | ✅ Ya |
| 3 | **Tranco List** | Pattern matching dari top 1M domain | ❌ Tidak |
| 4 | **Keyword Engine** | Generate domain dari keyword judi | ❌ Tidak |

> 💡 Tanpa API key OmniRoute, worker **tetap berfungsi** menggunakan sumber lain!

---

## ❓ Troubleshooting

### API OmniRoute tidak jalan?

1. Pastikan API Key sudah benar (tidak ada spasi)
2. Pastikan API Key tidak expired
3. Cek status API: `curl http://129.226.89.157:20128/health`
4. Cek logs di Cloudflare Dashboard → Workers → Logs

### Blocklist kosong?

1. Cek apakah OmniRoute API aktif
2. Worker tetap jalan tanpa API key (menggunakan static list)
3. Coba test lokal: `npm run test:blocklist`

### Deploy gagal?

1. Pastikan API token Cloudflare benar
2. Pastikan Account ID benar
3. Cek GitHub Actions logs

### Worker error 500?

1. Cek Cloudflare Workers Logs
2. Pastikan semua environment variables sudah benar
3. Coba deploy ulang

---

## 📝 Catatan

- API Key OmniRoute **opsional** tapi sangat disarankan untuk hasil optimal
- Selalu gunakan type **Secret** untuk API key
- Jangan commit `.dev.vars` ke GitHub
- Worker otomatis cache selama 1 jam
