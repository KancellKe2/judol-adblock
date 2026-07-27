# ⚙️ Konfigurasi

## Environment Variables

### Cloudflare Worker

Set di Cloudflare Dashboard → Workers → judol-adblock → Settings → Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OMNIROUTE_API_URL` | ❌ | `http://129.226.89.157:20128/v1` | Base URL API OmniRoute |

### KV Namespace

1. Buka Workers & Pages → KV
2. Buat namespace baru (nama: `MY_KV`)
3. Buka tab Settings → Bindings → Add binding
4. Type: KV Namespace, Name: `MY_KV`
5. Pilih namespace yang tadi dibuat

---

## GitHub Actions (Auto Deploy)

### Setup

1. Buka repo → Settings → Secrets and variables → Actions
2. Tambahkan secrets:
   - `CLOUDFLARE_API_TOKEN`: Token dari Cloudflare
   - `CLOUDFLARE_ACCOUNT_ID`: ID akun Cloudflare

### Cara Dapat Cloudflare API Token

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Klik ikon profil → My Profile → API Tokens
3. Klik "Create Token"
4. Pilih "Edit Cloudflare Workers" template
5. Klik "Continue to summary"
6. Klik "Create Token"
7. Copy token dan simpan sebagai secret `CLOUDFLARE_API_TOKEN`

### Cara Dapat Account ID

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih domain kamu
3. Scroll ke bawah di sidebar kanan
4. Copy "Account ID"

---

## Local Development

### Install

```bash
npm install
```

### Jalankan Dev Server

```bash
npm run dev
```

Worker akan jalan di `http://localhost:8787`

### Test

```bash
npm test
```

### Deploy

```bash
npm run deploy
```

---

## AdGuard DNS Setup

### AdGuard DNS (Cloud)

1. Login ke [AdGuard DNS Dashboard](https://adguard-dns.io/)
2. Buka tab "Allowlist/Blocklist"
3. Klik "Add Blocklist"
4. Pilih "Custom"
5. Masukkan URL worker:
   ```
   https://judol-adblock.YOUR_SUBDOMAIN.workers.dev/blocklist
   ```
6. Klik "Add"

### AdGuard Home (Self-hosted)

1. Buka dashboard AdGuard Home
2. Buka tab "Filters → DNS Blocklists"
3. Klik "Add Blocklist"
4. Pilih "Use a custom blocklist"
5. Masukkan URL worker
6. Klik "Add"

### Pi-hole

```bash
# Download blocklist
curl -s https://judol-adblock.YOUR_SUBDOMAIN.workers.dev/blocklist.txt \
  | grep "^||" | sed 's/^||//' | sed 's/\^$//' \
  | xargs -I {} echo "0.0.0.0 {}" \
  >> /etc/pihole/custom.list

# Restart Pi-hole
pihole restartdns
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Info & daftar endpoints |
| `/health` | GET | Health check |
| `/blocklist` | GET | Blocklist (AdGuard format) |
| `/blocklist.txt` | GET | Sama dengan `/blocklist` |
| `/stats` | GET | Statistik blocklist |

---

## Troubleshooting

### Worker tidak bisa diakses

1. Pastikan worker sudah di-deploy
2. Cek URL di Cloudflare Dashboard
3. Pastikan tidak ada error di Logs

### Blocklist kosong

1. Cek apakah OmniRoute API aktif
2. Cek network di Cloudflare Workers Logs
3. Coba test lokal dengan `npm test`

### Deploy gagal

1. Pastikan API token benar
2. Pastikan Account ID benar
3. Cek GitHub Actions logs
