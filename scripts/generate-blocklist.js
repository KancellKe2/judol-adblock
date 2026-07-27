/**
 * Script untuk generate blocklist secara lokal
 * Jalankan: node scripts/generate-blocklist.js
 * Output: output/blocklist.txt
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ── Config ──
const OMNIROUTE_API_URL =
  process.env.OMNIROUTE_API_URL || "http://129.226.89.157:20128/v1";

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "blocklist.txt");

// ── Gambling Keywords ──
const GAMBLING_KEYWORDS = [
  "judi", "slot", "casino", "poker", "betting", "bet",
  "togel", "lottery", "jackpot", "bandar", "agen",
  "baccarat", "roulette", "blackjack", "dicing",
  "parlay", "taruhan", "agenjudi", "slotgacor",
  "pragmatic", "habanero", "pgsoft", "microgaming",
  "joker123", "playtech", "flowgaming",
];

// ── Static Domains ──
const STATIC_DOMAINS = [
  "sbobet.com", "sboetasia.com", "sbobet888.com",
  "sbo.bet", "sbobetonline.com", "sbobet168.com",
  "sbotop.com", "sbotopmobile.com",
  "maxbet.com", "maxbetsports.com", "ibcbet.com",
  "nova88.com", "nova88bet.com",
  "cmd368.com", "cmd368.link", "cmd368s.com",
  "joker123.com", "joker123net.com", "joker388.net",
  "jokerwin123.com", "joker168.com", "joker888.net",
  "pragmaticplay.com", "pragmaticplay88.com",
  "pragmaticid.com", "pragmaticplay168.com",
  "habanero.com", "habaneroslot.com",
  "habanero88.com", "habanero666.com",
  "pgsoft.com", "pgslot.com", "pgslot168.com",
  "pggame168.com", "pggames.com",
  "playtech.com", "playtechslots.com", "playtechcasino.com",
  "microgaming.com", "microgaming88.com", "microgaming666.com",
  "spadegaming.com", "spade77.com", "spadegaming168.com",
  "flowgaming.com", "flowgaming88.com",
  "sexybaccarat.com", "prettygaming.com",
  "ioncasino.com", "allbet.com",
  "dreamgaming.com", "sa-gaming.com",
  "evo-gaming.com", "evogaming.com",
  "biggaming.com", "agcasino.com",
  "togelcc.com", "jayatogel.com", "klik4d.com",
  "bingo4d.com", "toto4d.com", "indotogel.com",
  "togel55.com", "seni4d.com", "togelkita.com",
  "penta88.com", "togelhoki.com",
  "afbcash.com", "m88.com", "dafabet.com",
  "w88.com", "188bet.com", "tbsbet.com",
  "m88asia.com", "bet365.com",
  "slot88.com", "slotgacor.com", "slotonline.com",
  "slot777.com", "slot168.com", "rajaslot.com",
  "hokislot.com", "bosslot.com", "gacorslot.com",
  "sultanslot.com", "kingslot.com", "queenslot.com",
  "hotslot.com", "superslot.com", "ultraslot.com",
  "betingslot.com", "gudangslot.com", "pulau88.com",
  "agenjudi.com", "agenbola.com", "agenpoker.com",
  "bandarjudi.com", "bandarbola.com", "bandarq.com",
  "rajabandar.com", "dewabet.com", "asianbet.com",
  "poker88.com", "pokerace99.com", "pokeronline.com",
  "dominoqq.com", "domino88.com", "domino99.com",
  "idnpoker.com", "idnplay.com", "pokerqq.com",
  "lapakpoker.com", "dewapoker.com",
];

// ── Brand Combinations ──
const BRANDS = [
  "joker", "pragmatic", "habanero", "pgsoft", "microgaming",
  "spadegaming", "playtech", "flowgaming", "advantplay",
  "ioncasino", "sexybaccarat", "prettygaming", "allbet",
  "sabasports", "cmd368", "sbobet", "maxbet", "nova88",
  "afbcash", "m88", "dafabet", "w88", "188bet",
  "tbsbet", "ibcbet", "togelcc", "bingo4d",
  "klik4d", "seni4d", "jayatogel", "penta88",
];

const TLD = [
  "com", "net", "org", "info", "xyz", "online",
  "site", "club", "bet", "casino", "games",
  "slot", "win", "live", "link", "cam",
];

const PREFIXES = ["www", "m", "mobile", "wap", "api", "link", "official"];

// ══════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════

async function main() {
  console.log("🛡️  Judol Adblock - Blocklist Generator\n");

  const allDomains = new Set();

  // 1. Static
  console.log("📦 Loading static domains...");
  STATIC_DOMAINS.forEach((d) => allDomains.add(d));
  console.log(`   ✓ ${STATIC_DOMAINS.length} static domains`);

  // 2. Brand combinations
  console.log("🔧 Generating brand combinations...");
  const brandDomains = generateBrandCombinations();
  brandDomains.forEach((d) => allDomains.add(d));
  console.log(`   ✓ ${brandDomains.length} brand combinations`);

  // 3. OmniRoute API
  if (OMNIROUTE_API_URL) {
    console.log("🔍 Fetching from OmniRoute API...");
    try {
      const omniDomains = await fetchOmniRoute();
      omniDomains.forEach((d) => allDomains.add(d));
      console.log(`   ✓ ${omniDomains.length} domains from OmniRoute`);
    } catch (err) {
      console.log(`   ⚠ OmniRoute unavailable: ${err.message}`);
    }
  }

  // 4. Tranco list
  console.log("📊 Fetching Tranco list...");
  try {
    const trancoDomains = await fetchTrancoList();
    trancoDomains.forEach((d) => allDomains.add(d));
    console.log(`   ✓ ${trancoDomains.length} gambling domains from Tranco`);
  } catch (err) {
    console.log(`   ⚠ Tranco unavailable: ${err.message}`);
  }

  // Generate output
  console.log("\n📝 Generating blocklist...");
  const blocklist = generateBlocklist([...allDomains]);

  // Write file
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, blocklist, "utf-8");

  console.log(`✅ Done! ${allDomains.size} domains written to ${OUTPUT_FILE}`);
}

// ══════════════════════════════════════════════════════════
//  FUNCTIONS
// ══════════════════════════════════════════════════════════

function generateBrandCombinations() {
  const domains = [];
  for (const brand of BRANDS) {
    for (const tld of TLD) {
      domains.push(`${brand}.${tld}`);
      for (const prefix of PREFIXES) {
        domains.push(`${prefix}.${brand}.${tld}`);
      }
    }
  }
  return [...new Set(domains)];
}

function fetchOmniRoute() {
  return new Promise((resolve, reject) => {
    const endpoints = [
      "/domains",
      "/search?q=gambling",
      "/search?q=judi",
      "/search?q=slot",
      "/search?q=casino",
      "/search?q=betting",
      "/search?q=poker",
      "/search?q=lottery",
      "/search?q=togel",
      "/list?type=gambling",
      "/query?keyword=judi",
      "/query?keyword=slot",
      "/query?keyword=casino",
    ];

    const allDomains = [];
    let completed = 0;

    for (const endpoint of endpoints) {
      const url = `${OMNIROUTE_API_URL}${endpoint}`;
      const client = url.startsWith("https") ? https : http;

      const req = client.get(url, { timeout: 5000 }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const domains = extractDomains(json);
            allDomains.push(...domains);
          } catch {
            // Not JSON, try as text
            const lines = data.split("\n").filter((l) => l.trim());
            lines.forEach((line) => {
              if (isValidDomain(line.trim())) {
                allDomains.push(line.trim());
              }
            });
          }
          completed++;
          if (completed === endpoints.length) {
            resolve([...new Set(allDomains)]);
          }
        });
      });

      req.on("error", () => {
        completed++;
        if (completed === endpoints.length) {
          resolve([...new Set(allDomains)]);
        }
      });

      req.on("timeout", () => {
        req.destroy();
        completed++;
        if (completed === endpoints.length) {
          resolve([...new Set(allDomains)]);
        }
      });
    }
  });
}

function extractDomains(data) {
  const domains = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "string" && isValidDomain(item)) {
        domains.push(item);
      } else if (item && typeof item === "object") {
        const val = item.domain || item.name || item.url || item.host || "";
        const cleaned = val
          .replace(/^https?:\/\//, "")
          .replace(/\/.*$/, "")
          .trim();
        if (isValidDomain(cleaned)) {
          domains.push(cleaned);
        }
      }
    }
  } else if (data && typeof data === "object") {
    const keys = ["data", "results", "domains", "items", "list", "entries"];
    for (const key of keys) {
      if (data[key]) {
        domains.push(...extractDomains(data[key]));
      }
    }
  }

  return domains;
}

function fetchTrancoList() {
  return new Promise((resolve, reject) => {
    https
      .get("https://tranco-list.eu/api/ranks/top/1000000", { timeout: 10000 }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const domains = [];
          const lines = data.split("\n");

          for (const line of lines) {
            const domain = line.trim();
            if (!domain) continue;

            const lower = domain.toLowerCase();
            for (const kw of GAMBLING_KEYWORDS) {
              if (lower.includes(kw)) {
                domains.push(domain);
                break;
              }
            }
          }

          resolve(domains);
        });
      })
      .on("error", reject)
      .on("timeout", function () {
        this.destroy();
        reject(new Error("timeout"));
      });
  });
}

function isValidDomain(str) {
  if (!str || str.length < 3 || str.length > 253) return false;
  if (str.includes(" ") || str.includes("\t")) return false;
  if (str.startsWith(".") || str.endsWith(".")) return false;
  if (str.startsWith("-") || str.endsWith("-")) return false;

  const domainRegex =
    /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;
  return domainRegex.test(str);
}

function generateBlocklist(domains) {
  const sorted = [...domains].sort();

  const header = [
    "! Title: Judol Blocklist - Domain Judi Online",
    "! Homepage: https://github.com/KancellKe2/judol-adblock",
    `! Last modified: ${new Date().toISOString()}`,
    `! Total domains: ${sorted.length}`,
    "! License: MIT",
    "!",
    "! Format: AdGuard DNS compatible",
    "! Gunakan filter ini di AdGuard DNS atau AdGuard Home",
    "! ────────────────────────────────────────────────",
    "",
  ];

  const rules = sorted.map((d) => `||${d}^`);

  return header.join("\n") + rules.join("\n") + "\n";
}

// ══════════════════════════════════════════════════════════
//  RUN
// ══════════════════════════════════════════════════════════

main().catch(console.error);
