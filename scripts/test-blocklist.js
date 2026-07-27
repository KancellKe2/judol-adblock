/**
 * Script untuk test blocklist
 * Jalankan: node scripts/test-blocklist.js
 */

const http = require("http");
const https = require("https");

const WORKER_URL =
  process.env.WORKER_URL || "http://localhost:8787";

const TEST_DOMAINS = [
  "sbobet.com",
  "joker123.com",
  "pragmaticplay.com",
  "google.com",
  "facebook.com",
  "poker88.com",
  "togelcc.com",
  "youtube.com",
  "slot88.com",
  "github.com",
];

console.log("🧪 Judol Adblock - Blocklist Tester\n");
console.log(`Target: ${WORKER_URL}\n`);

async function testBlocklist() {
  // 1. Test health
  console.log("── Health Check ──");
  try {
    const health = await fetchJSON(`${WORKER_URL}/health`);
    console.log(`  Status: ${health.status}`);
    console.log(`  Timestamp: ${new Date(health.timestamp).toISOString()}`);
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return;
  }

  // 2. Test root
  console.log("\n── Root Endpoint ──");
  try {
    const info = await fetchJSON(`${WORKER_URL}/`);
    console.log(`  Name: ${info.name}`);
    console.log(`  Version: ${info.version}`);
    console.log(`  Endpoints: ${Object.keys(info.endpoints).join(", ")}`);
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  // 3. Test blocklist
  console.log("\n── Blocklist ──");
  try {
    const resp = await fetchRaw(`${WORKER_URL}/blocklist`);
    const lines = resp.split("\n").filter((l) => l.startsWith("||"));
    console.log(`  Total blocked domains: ${lines.length}`);
    console.log(`  First 5:`);
    lines.slice(0, 5).forEach((l) => console.log(`    ${l}`));
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  // 4. Test domain checking
  console.log("\n── Domain Check ──");
  try {
    const blocklist = await fetchRaw(`${WORKER_URL}/blocklist`);

    for (const domain of TEST_DOMAINS) {
      const rule = `||${domain}^`;
      const blocked = blocklist.includes(rule);
      const icon = blocked ? "🔴" : "🟢";
      console.log(`  ${icon} ${domain} → ${blocked ? "BLOCKED" : "ALLOWED"}`);
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  // 5. Test stats
  console.log("\n── Stats ──");
  try {
    const stats = await fetchJSON(`${WORKER_URL}/stats`);
    console.log(JSON.stringify(stats, null, 2));
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  console.log("\n✅ Test complete!");
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Invalid JSON"));
          }
        });
      })
      .on("error", reject);
  });
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

testBlocklist().catch(console.error);
