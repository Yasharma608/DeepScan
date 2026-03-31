# How Guardian Scan Works

## The Problem with Existing Tools

`npm audit`, `pip-audit`, and `osv-scanner` are excellent tools — but they have a fundamental limitation: **they require a CVE to exist before they can detect a vulnerability.**

When the axios maintainer account was hijacked in March 2026 and a RAT was injected into `axios@1.14.1`, the malicious version was available for download for hours before any CVE was published. Every developer who ran `npm install` during that window pulled malicious code silently.

Rule-based tools are blind to zero-hour attacks. Guardian Scan adds a reasoning layer that is not.

---

## The 4-Layer Detection Pipeline

### Layer 1 — Hardcoded Malicious Package Blocklist

**Speed:** Instant (no network calls)
**Catches:** Known-bad exact package versions

The skill embeds a curated table of confirmed malicious package versions directly in its instructions. Claude checks every resolved dependency against this table before making any network call.

Sources for the blocklist:
- [OpenSSF Malicious Packages](https://github.com/ossf/malicious-packages) — the authoritative community registry
- [Socket.dev incident reports](https://socket.dev)
- NVD/CVE database for packages with known compromise dates

**What it catches:** Any package version confirmed malicious — axios@1.14.1, event-stream@3.3.6, node-ipc@10.1.3, xz-utils@5.6.0, PyPI typosquats (ctx, rectify, colourama), and 30+ others.

**Limitation:** Only catches exact known-bad versions. A new compromise not yet in the blocklist will not be caught by this layer alone. The blocklist grows via community PRs.

---

### Layer 2 — OSV.dev CVE Query

**Speed:** 1–4 seconds (one network call per ecosystem)
**Catches:** Published CVEs across 12 package ecosystems

Claude calls the [OSV.dev](https://osv.dev) batch API — a free, public, unauthenticated endpoint run by Google. All packages from each ecosystem are batched into a single POST request.

```
POST https://api.osv.dev/v1/querybatch
{"queries": [{"package": {"name": "pillow", "ecosystem": "PyPI"}, "version": "9.0.0"}, ...]}
```

The response includes CVE IDs, CVSS severity scores, descriptions, and fixed versions.

**Ecosystems covered:** npm, PyPI, Go, crates.io, RubyGems, Maven, Packagist, NuGet, Pub (Dart), CRAN (R), Hex (Elixir), SwiftURL.

**Limitation:** Requires a published CVE. Zero-hour attacks with no advisory are invisible to this layer.

---

### Layer 3 — Registry Metadata Anomaly Detection

**Speed:** 2–10 seconds (up to 10 registry API calls)
**Catches:** Suspicious patterns that precede CVE publication

Claude fetches package metadata from the npm and PyPI registries and checks for signals associated with supply chain attacks:

| Signal | Why It Matters |
|--------|----------------|
| **Long dormancy, then sudden new release** | Classic maintainer hijack pattern — attacker waits for high download count, then releases malicious version after years of inactivity |
| **Small package with install script** | `preinstall`/`postinstall` in `package.json` runs arbitrary code at install time — high risk for small/obscure packages |
| **Large version number gap** | Legitimate packages rarely skip from v1.7 to v1.14 — may indicate version number spoofing |
| **Mismatched repository URL** | Package claiming to be from a well-known org but hosted elsewhere |

This layer catches zero-hour attacks before CVEs exist. It also has higher false positive risk — findings are reported as MEDIUM, not CRITICAL.

**Limitation:** Capped at 10 registry calls per scan to avoid excessive network usage. Focus is on npm and PyPI (highest attack surface).

---

### Layer 4 — Claude AI Reasoning

**Speed:** Instant (already in context — no extra API call)
**Catches:** Everything the other layers miss; reduces noise from layers 1–3

This is what distinguishes Guardian Scan from rule-based tools. Claude's native intelligence:

1. **Reachability check** — Greps your source files to find where flagged packages are imported. A vulnerable package you never call is lower priority than one your critical API path uses.

2. **Exploitability assessment** — Is the dangerous function actually invoked? For example: a package with a CVE in its XML parser poses no risk if you only use it for JSON.

3. **Risk ranking** — Combines severity × reachability × package popularity to sort findings. Cuts noise so you see the most important issues first.

4. **Remediation** — Writes specific, actionable fixes: the exact version to upgrade to, or the package to remove and what to replace it with.

5. **Narrative** — Explains findings in plain language so any developer can understand the risk without reading CVE descriptions.

---

## Report Structure

The final report has five sections:

- **🚨 CRITICAL** — Confirmed malicious versions (Layer 1 matches). Act immediately.
- **🔴 HIGH** — Published CVEs with CVSS ≥7.0. Prioritise in next sprint.
- **🟡 MEDIUM** — Anomaly signals or lower-severity CVEs. Review and decide.
- **🟢 LOW** — Minor signals worth noting. Address when convenient.
- **Reachability Analysis** — Where flagged packages are imported in your source.
- **Remediation Priority** — Ordered action list.
