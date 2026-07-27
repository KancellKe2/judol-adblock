/**
 * judol-adblock - Cloudflare Worker
 * Pencari & pemblokir domain judi online untuk AdGuard DNS
 *
 * Format output: AdGuard DNS compatible (||domain.com^)
 *
 * Deploy: https://workers.cloudflare.com/
 * Config: Set OMNIROUTE_API_URL di Environment Variables
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Routes ──────────────────────────────────────────
    if (url.pathname === "/") {
      return jsonResponse({
        name: "judol-adblock",
        version: "1.0.0",
        description: "Domain judi online blocker untuk AdGuard DNS",
        endpoints: {
          blocklist: "/blocklist",
          blocklist_plain: "/blocklist.txt",
          stats: "/stats",
          health: "/health",
        },
      });
    }

    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok", timestamp: Date.now() });
    }

    if (url.pathname === "/stats") {
      const stats = await getStats(env);
      return jsonResponse(stats);
    }

    if (url.pathname === "/blocklist" || url.pathname === "/blocklist.txt") {
      return await serveBlocklist(request, env);
    }

    return notFound();
  },
};

// ══════════════════════════════════════════════════════════
//  BLOCKLIST GENERATOR
// ══════════════════════════════════════════════════════════

async function serveBlocklist(request, env) {
  const startTime = Date.now();

  try {
    const allDomains = new Set();

    // 1. Static known gambling domains
    getStaticDomains().forEach((d) => allDomains.add(d));

    // 2. OmniRoute API
    if (env.OMNIROUTE_API_URL) {
      const omniDomains = await fetchOmniRoute(env);
      omniDomains.forEach((d) => allDomains.add(d));
    }

    // 3. Tranco top list + pattern matching
    const trancoDomains = await fetchTrancoList();
    trancoDomains.forEach((d) => allDomains.add(d));

    // 4. Keyword-based gambling domains
    const keywordDomains = await fetchKeywordDomains(env);
    keywordDomains.forEach((d) => allDomains.add(d));

    // Generate AdGuard DNS format
    const blocklist = generateAdGuardBlocklist(allDomains);

    const elapsed = Date.now() - startTime;

    // Store stats
    await putEnv(env, "last_stats", JSON.stringify({
      total_domains: allDomains.length,
      last_updated: new Date().toISOString(),
      elapsed_ms: elapsed,
      sources: {
        static: getStaticDomains().length,
        omniroute: env.OMNIROUTE_API_URL ? "active" : "inactive",
      },
    }));

    return new Response(blocklist, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Total-Domains": String(allDomains.size),
        "X-Generated-In": `${elapsed}ms`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(`# Error generating blocklist: ${err.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// ══════════════════════════════════════════════════════════
//  OMNIROUTE API
// ══════════════════════════════════════════════════════════

async function fetchOmniRoute(env) {
  const baseUrl = env.OMNIROUTE_API_URL || "http://129.226.89.157:20128/v1";
  const apiKey = env.OMNIROUTE_API_KEY || "";
  const domains = [];

  // Build headers dengan API key
  const headers = {
    "Accept": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["X-API-Key"] = apiKey;
  }

  try {
    // Coba beberapa endpoint umum OmniRoute
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

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(`${baseUrl}${endpoint}`, {
          headers: headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (resp.ok) {
          const data = await resp.json();
          const extracted = extractDomainsFromResponse(data);
          domains.push(...extracted);
        }
      } catch {
        // Skip failed endpoint
      }
    }
  } catch (err) {
    console.error("OmniRoute error:", err.message);
  }

  return [...new Set(domains)];
}

function extractDomainsFromResponse(data) {
  const domains = [];

  if (typeof data === "string") {
    // Plain text, one domain per line
    return data
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .filter((l) => isValidDomain(l));
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "string" && isValidDomain(item)) {
        domains.push(item);
      } else if (item && typeof item === "object") {
        // Try common field names
        const val =
          item.domain ||
          item.name ||
          item.url ||
          item.host ||
          item.target ||
          item.result ||
          "";
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
    // Nested response — try common keys
    const keys = ["data", "results", "domains", "items", "list", "entries"];
    for (const key of keys) {
      if (data[key]) {
        const nested = extractDomainsFromResponse(data[key]);
        domains.push(...nested);
      }
    }
  }

  return [...new Set(domains)];
}

// ══════════════════════════════════════════════════════════
//  TRANCO TOP LIST (Pattern Matching)
// ══════════════════════════════════════════════════════════

async function fetchTrancoList() {
  const gamblingKeywords = [
    "judi", "slot", "casino", "poker", "betting", "bet",
    "togel", "lottery", "jackpot", "bandar", "agen",
    "baccarat", "roulette", "blackjack", "dicing",
    "parlay", "taruhan", "agenjudi", "slotgacor",
    "pragmatic", "habanero", "pgsoft", "microgaming",
    "joker123", "playtech", "flowgaming",
  ];

  const domains = [];

  try {
    // Tranco top 1M list
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(
      "https://tranco-list.eu/api/ranks/top/1000000",
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (resp.ok) {
      const text = await resp.text();
      const lines = text.split("\n");

      for (const line of lines) {
        const domain = line.trim();
        if (!domain) continue;

        const lower = domain.toLowerCase();
        for (const kw of gamblingKeywords) {
          if (lower.includes(kw)) {
            domains.push(domain);
            break;
          }
        }
      }
    }
  } catch {
    // Tranco list not available
  }

  return [...new Set(domains)];
}

// ══════════════════════════════════════════════════════════
//  KEYWORD DOMAIN GENERATOR
// ══════════════════════════════════════════════════════════

async function fetchKeywordDomains(env) {
  const domains = [];

  // Generate common gambling domain patterns
  const prefixes = [
    "www", "m", "mobile", "wap", "api", "link", "official",
  ];

  const brands = [
    "joker", "pragmatic", "habanero", "pgsoft", "microgaming",
    "spadegaming", "playtech", "flowgaming", "advantplay",
    "ioncasino", "sexybaccarat", "prettygaming", "allbet",
    "sabasports", "cmd368", "sbobet", "maxbet", "nova88",
    "afbcash", "m88", "dafabet", "w88", "188bet",
    "tbsbet", "cmd368", "ibcbet", "togelcc", "bingo4d",
    "klik4d", "seni4d", "jayatogel", "penta88",
  ];

  const tlds = [
    "com", "net", "org", "info", "xyz", "online",
    "site", "club", "bet", "casino", "games",
    "slot", "win", "live", "link", "cam",
  ];

  for (const brand of brands) {
    for (const tld of tlds) {
      domains.push(`${brand}.${tld}`);
      for (const prefix of prefixes) {
        domains.push(`${prefix}.${brand}.${tld}`);
      }
    }
  }

  return [...new Set(domains)];
}

// ══════════════════════════════════════════════════════════
//  STATIC DOMAIN LIST (Known gambling sites)
// ══════════════════════════════════════════════════════════

function getStaticDomains() {
  return [
    // ── SBOBET Group ──
    "sbobet.com", "sboetasia.com", "sbobet888.com",
    "sbo.bet", "sbobetonline.com", "sbobet168.com",
    "sbotop.com", "sbotopmobile.com",

    // ── MAXBET / IBCBET ──
    "maxbet.com", "maxbetsports.com", "ibcbet.com",
    "nova88.com", "nova88bet.com",

    // ── CMD368 ──
    "cmd368.com", "cmd368.link", "cmd368s.com",

    // ── Joker123 ──
    "joker123.com", "joker123net.com", "joker388.net",
    "jokerwin123.com", "joker168.com", "joker888.net",

    // ── Pragmatic Play ──
    "pragmaticplay.com", "pragmaticplay88.com",
    "pragmaticid.com", "pragmaticplay168.com",

    // ── HABANERO ──
    "habanero.com", "habaneroslot.com",
    "habanero88.com", "habanero666.com",

    // ── PGSOFT ──
    "pgsoft.com", "pgslot.com", "pgslot168.com",
    "pggame168.com", "pggames.com",

    // ── Playtech ──
    "playtech.com", "playtechslots.com",
    "playtechcasino.com",

    // ── Microgaming ──
    "microgaming.com", "microgaming88.com",
    "microgaming666.com",

    // ── Spadegaming ──
    "spadegaming.com", "spade77.com",
    "spadegaming168.com",

    // ── Flow Gaming ──
    "flowgaming.com", "flowgaming88.com",

    // ── Live Casino ──
    "sexybaccarat.com", "prettygaming.com",
    "ioncasino.com", "allbet.com",
    "dreamgaming.com", "sa-gaming.com",
    "evo-gaming.com", "evogaming.com",
    "biggaming.com", "agcasino.com",

    // ── Togel / Lottery ──
    "togelcc.com", "jayatogel.com", "klik4d.com",
    "bingo4d.com", "toto4d.com", "indotogel.com",
    "togel55.com", "seni4d.com", "togelkita.com",
    "penta88.com", "togelhoki.com",

    // ── Sportsbook ──
    "afbcash.com", "m88.com", "dafabet.com",
    "w88.com", "188bet.com", "tbsbet.com",
    "m88asia.com", "bet365.com",

    // ── Slot Online (common patterns) ──
    "slot88.com", "slotgacor.com", "slotonline.com",
    "slot777.com", "slot168.com", "rajaslot.com",
    "hokislot.com", "bosslot.com", "gacorslot.com",
    "sultanslot.com", "kingslot.com", "queenslot.com",
    "hotslot.com", "superslot.com", "ultraslot.com",
    "betingslot.com", "gudangslot.com", "pulau88.com",

    // ── Agen / Bandar ──
    "agenjudi.com", "agenbola.com", "agenpoker.com",
    "bandarjudi.com", "bandarbola.com", "bandarq.com",
    "rajabandar.com", "dewabet.com", "asianbet.com",

    // ── Poker Online ──
    "poker88.com", "pokerace99.com", "pokeronline.com",
    "dominoqq.com", "domino88.com", "domino99.com",
    "idnpoker.com", "idnplay.com", "pokerqq.com",
    "lapakpoker.com", "dewapoker.com",
  ];
}

// ══════════════════════════════════════════════════════════
//  ADGUARD BLOCKLIST GENERATOR
// ══════════════════════════════════════════════════════════

function generateAdGuardBlocklist(domains) {
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
//  UTILITIES
// ══════════════════════════════════════════════════════════

function isValidDomain(str) {
  if (!str || str.length < 3 || str.length > 253) return false;
  if (str.includes(" ") || str.includes("\t")) return false;
  if (str.startsWith(".") || str.endsWith(".")) return false;
  if (str.startsWith("-") || str.endsWith("-")) return false;

  const domainRegex =
    /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;
  return domainRegex.test(str);
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}

async function getStats(env) {
  try {
    const stats = await env.MY_KV?.get("last_stats");
    return stats ? JSON.parse(stats) : { message: "No stats available" };
  } catch {
    return { message: "Stats not available" };
  }
}

async function putEnv(env, key, value) {
  try {
    await env.MY_KV?.put(key, value);
  } catch {
    // KV not configured, skip
  }
}
