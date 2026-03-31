# Guardian Scan

**A free Claude Code skill that scans your dependencies for supply chain attacks — zero install, no API key.**

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![Claude Code](https://img.shields.io/badge/Claude%20Code-skill-purple.svg)
![Ecosystems](https://img.shields.io/badge/ecosystems-12-green.svg)

---

## The Problem

Supply chain attacks against open source packages are accelerating:

| Incident | Date | Impact |
|----------|------|--------|
| **axios** | March 2026 | RAT injected into `axios@1.14.1` via maintainer credential hijack — 100M+ weekly downloads |
| **xz-utils** | March 2024 | SSH backdoor planted in build system (CVE-2024-3094) |
| **node-ipc** | March 2022 | Disk wiper targeting Russian/Belarusian IPs |
| **ua-parser-js** | Oct 2021 | Cryptominer + password stealer |
| **event-stream** | Nov 2018 | Bitcoin wallet theft via malicious transitive dependency |

**The gap:** `npm audit`, `pip-audit`, and `osv-scanner` all require a CVE to exist. Compromised packages in their first hours — or first days — are completely invisible to rule-based tools. By the time a CVE is published, millions of developers have already pulled the malicious version.

Guardian Scan adds a reasoning layer that catches what rules cannot.

---

## How It Works

Guardian Scan runs a **4-layer detection pipeline** every time you invoke `/dep-scan`:

| Layer | Method | Catches |
|-------|--------|---------|
| **1. Blocklist** | Instant offline check against embedded table of 30+ known compromised versions | Known-bad exact versions (zero network calls) |
| **2. CVE Database** | Live query to [OSV.dev](https://osv.dev) batch API — free, no auth | Published CVEs across 12 ecosystems |
| **3. Metadata Anomaly** | Fetches registry metadata from npm/PyPI | Dormant packages with sudden new releases, suspicious install scripts, version gaps |
| **4. AI Reasoning** | Claude's native intelligence — no extra API call | Reachability analysis, exploitability assessment, ranked remediation |

---

## Quick Install

```bash
# Step 1: Copy the skill into your project
cp dep-scan.md /path/to/your/project/.claude/commands/dep-scan.md

# Step 2: Run it in Claude Code
/dep-scan
```

That's it. No `pip install`. No `npm install`. No API key. No CI plumbing.

---

## What It Detects

| Ecosystem | Manifest Files |
|-----------|---------------|
| JavaScript / Node.js | `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile`, `poetry.lock` |
| Go | `go.mod`, `go.sum` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Ruby | `Gemfile`, `Gemfile.lock` |
| Java / Kotlin | `pom.xml`, `build.gradle` |
| PHP | `composer.json`, `composer.lock` |
| .NET / C# | `*.csproj`, `packages.config` |
| Dart / Flutter | `pubspec.yaml`, `pubspec.lock` |
| R | `DESCRIPTION`, `renv.lock` |
| Elixir | `mix.exs`, `mix.lock` |
| Swift | `Package.swift`, `Package.resolved` |

---

## Sample Output

```
# Guardian Scan — Dependency Security Report
Project: my-app
Scanned: 2026-03-31 13:00 UTC
Packages scanned: 142 across 2 ecosystems
Manifests read: package-lock.json, requirements.txt

---

## 🚨 CRITICAL (2)
| Package         | Version | File               | Threat                                    | Fix              |
|-----------------|---------|--------------------|-------------------------------------------|------------------|
| axios           | 1.14.1  | package-lock.json  | RAT injected — March 2026 hijack          | Upgrade to 1.7.9 |
| plain-crypto-js | 4.2.1   | package-lock.json  | RAT delivery vehicle (axios compromise)   | Remove entirely  |

## 🔴 HIGH (1)
| Package | Version | File            | CVE            | Severity | Fix     |
|---------|---------|-----------------|----------------|----------|---------|
| pillow  | 9.0.0   | requirements.txt | CVE-2023-44271 | 7.5      | >=10.0.0 |

## Reachability Analysis
- axios@1.14.1 → imported at src/api/client.js:1 (REACHABLE — axios.get() called line 6)

## Summary
✅ 142 packages scanned — 3 findings (2 CRITICAL, 1 HIGH)
```

---

## Scan Modes

| Command | What it does |
|---------|-------------|
| `/dep-scan` | Full scan — all 4 layers |
| `/dep-scan quick` | Layer 1 only — offline, no network calls. Fast, good for CI |
| `/dep-scan deep` | All layers + extended reachability across entire source tree |

---

## Contributing

The easiest contribution is **adding to the blocklist** — just submit a PR adding one row to the table in `dep-scan.md`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

Other ways to contribute:
- Improve anomaly detection heuristics (Layer 3)
- Add support for a new ecosystem
- Add test fixtures
- Report false positives

---

## License

Apache-2.0 — see [LICENSE](LICENSE).
