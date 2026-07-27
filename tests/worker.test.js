const { runInNewContext } = require("vm");

/**
 * Unit tests untuk judol-adblock worker
 * Jalankan: npm test
 */

const worker = require("../src/worker.js");

// ══════════════════════════════════════════════════════════
//  MOCK ENVIRONMENT
// ══════════════════════════════════════════════════════════

const mockEnv = {
  OMNIROUTE_API_URL: "",
  MY_KV: {
    get: async () => null,
    put: async () => {},
  },
};

// ══════════════════════════════════════════════════════════
//  TEST UTILITIES
// ══════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✅ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ❌ ${message}`);
  }
}

async function testRequest(path) {
  const request = new Request(`http://localhost${path}`);
  return await worker.default.fetch(request, mockEnv);
}

// ══════════════════════════════════════════════════════════
//  TESTS
// ══════════════════════════════════════════════════════════

async function runTests() {
  console.log("🧪 Judol Adblock - Unit Tests\n");

  // ── Test 1: Root endpoint ──
  console.log("── Root Endpoint ──");
  {
    const resp = await testRequest("/");
    const data = await resp.json();

    assert(resp.status === 200, "Status 200");
    assert(data.name === "judol-adblock", "Name is judol-adblock");
    assert(data.endpoints !== undefined, "Has endpoints");
    assert(data.endpoints.blocklist === "/blocklist", "Has /blocklist endpoint");
  }

  // ── Test 2: Health endpoint ──
  console.log("\n── Health Endpoint ──");
  {
    const resp = await testRequest("/health");
    const data = await resp.json();

    assert(resp.status === 200, "Status 200");
    assert(data.status === "ok", "Status is ok");
    assert(data.timestamp !== undefined, "Has timestamp");
  }

  // ── Test 3: Blocklist endpoint ──
  console.log("\n── Blocklist Endpoint ──");
  {
    const resp = await testRequest("/blocklist");
    const text = await resp.text();
    const lines = text.split("\n").filter((l) => l.startsWith("||"));

    assert(resp.status === 200, "Status 200");
    assert(resp.headers.get("Content-Type").includes("text/plain"), "Content-Type is text/plain");
    assert(lines.length > 0, `Has ${lines.length} blocked domains`);

    // Check format
    const firstRule = lines[0];
    assert(firstRule.startsWith("||"), "Rule starts with ||");
    assert(firstRule.endsWith("^"), "Rule ends with ^");
  }

  // ── Test 4: Known domains are blocked ──
  console.log("\n── Known Domains Blocked ──");
  {
    const resp = await testRequest("/blocklist");
    const text = await resp.text();

    const knownDomains = [
      "sbobet.com",
      "joker123.com",
      "pragmaticplay.com",
      "poker88.com",
      "togelcc.com",
    ];

    for (const domain of knownDomains) {
      const rule = `||${domain}^`;
      assert(text.includes(rule), `${domain} is blocked`);
    }
  }

  // ── Test 5: Safe domains are NOT blocked ──
  console.log("\n── Safe Domains NOT Blocked ──");
  {
    const resp = await testRequest("/blocklist");
    const text = await resp.text();

    const safeDomains = [
      "google.com",
      "github.com",
      "microsoft.com",
      "apple.com",
    ];

    for (const domain of safeDomains) {
      const rule = `||${domain}^`;
      assert(!text.includes(rule), `${domain} is NOT blocked`);
    }
  }

  // ── Test 6: Blocklist.txt endpoint ──
  console.log("\n── Blocklist.txt Endpoint ──");
  {
    const resp = await testRequest("/blocklist.txt");

    assert(resp.status === 200, "Status 200");
    assert(resp.headers.get("Content-Type").includes("text/plain"), "Content-Type is text/plain");
  }

  // ── Test 7: 404 for unknown routes ──
  console.log("\n── 404 for Unknown Routes ──");
  {
    const resp = await testRequest("/unknown");

    assert(resp.status === 404, "Status 404");
  }

  // ── Test 8: Stats endpoint ──
  console.log("\n── Stats Endpoint ──");
  {
    const resp = await testRequest("/stats");

    assert(resp.status === 200, "Status 200");
  }

  // ── Summary ──
  console.log("\n═══════════════════════════════════════");
  console.log(`  Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("═══════════════════════════════════════\n");

  process.exit(testsFailed > 0 ? 1 : 0);
}

// ══════════════════════════════════════════════════════════
//  POLYFILLS (untuk local testing)
// ══════════════════════════════════════════════════════════

if (typeof Request === "undefined") {
  globalThis.Request = class Request {
    constructor(url) {
      this.url = url;
      this.method = "GET";
    }
  };
}

if (typeof Response === "undefined") {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    async json() {
      return JSON.parse(this.body);
    }
    async text() {
      return this.body;
    }
  };
}

if (typeof Headers === "undefined") {
  globalThis.Headers = Map;
}

// Run
runTests();
