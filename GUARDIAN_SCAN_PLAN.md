# Guardian Scan — Claude Skill for Dependency Security
## Full Implementation Plan (Claude Skill Only)

---

## Context

Supply chain attacks against open source packages are accelerating. The axios compromise of March 30, 2026 — where maintainer credentials were hijacked and a RAT was silently injected into `axios@1.14.1` and `axios@0.30.4` (100M+ weekly downloads) — exposed a critical gap: existing free tools don't detect **compromised but not-yet-CVE-listed packages**, and they produce no contextual reasoning a developer can act on.

This project delivers a **free, open source Claude Skill** that any Claude Code user can drop into their project and immediately scan all dependencies — no install, no API key configuration, no CI/CD plumbing. The skill uses Claude's native tools (Read, Bash, WebFetch, WebSearch, Grep) plus Claude's own intelligence to run a 4-layer detection pipeline and produce a human-readable security report.

---

## Feasibility Assessment — Why Claude Skill Only

| Format | Verdict | Reasoning |
|--------|---------|-----------|
| Standalone CLI | ❌ Out of scope | Requires Python packaging, PyPI, separate install, extra maintenance |
| VS Code Plugin | ❌ Out of scope | Complex extension API, separate release cycle |
| **Claude Skill (.md)** | ✅ **Chosen** | Zero install — drop one `.md` file in `.claude/commands/`, invoke `/dep-scan`. All logic lives in Claude's instructions. Uses Claude's built-in tools for file reads, web fetches, and shell calls. |

**Why this works perfectly as a skill:**
- Claude can `Read` manifest and lock files directly
- Claude can `WebFetch` the OSV.dev batch API (free, no key)
- Claude can `WebSearch` for recent compromise reports on a package
- Claude can `Bash` to call `npm audit`, `pip-audit`, or `osv-scanner` if the user already has them — but falls back gracefully if not
- Claude's own reasoning IS the Layer 4 AI analysis — no extra API call needed
- Publishable as a single `.md` file anyone can copy into their project

---

## Problem Statement

### Real-World Supply Chain Attacks the Skill Must Catch

| Incident | Date | Compromised Version | Attack |
|----------|------|---------------------|--------|
| **axios** | March 2026 | `1.14.1`, `0.30.4` | Maintainer hijack → RAT injected via `plain-crypto-js` |
| **event-stream** | Nov 2018 | `3.3.6` | Malicious transitive dep → Bitcoin wallet theft |
| **node-ipc** | Mar 2022 | `10.1.3` | Disk wiper targeting Russian IPs |
| **ctx / rectify** (PyPI) | May 2022 | Latest at time | Typosquat → AWS env var exfiltration |
| **xz-utils** | Mar 2024 | `5.6.0–5.6.1` | Build system backdoor → SSH compromise |

**The gap:** `npm audit`, `pip-audit`, and `osv-scanner` require a CVE to exist. Compromised packages in their first hours are invisible to rule-based tools. Claude's reasoning layer catches anomalies rules cannot.

---

## Skill Architecture

```
User types: /dep-scan
                │
                ▼
    ┌─────────────────────────┐
    │   dep-scan.md (Skill)   │
    │   Claude executes the   │
    │   instructions below    │
    └──────────┬──────────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │         Step 1: Manifest Discovery       │
    │  Glob / Read all manifest + lock files   │
    │  in the project directory                │
    └──────────┬──────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │         Step 2: Dependency Extraction    │
    │  Parse each manifest for name + version  │
    │  Prefer lock files (exact versions)      │
    └──────────┬──────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │     4-LAYER DETECTION PIPELINE           │
    │                                          │
    │  Layer 1: Hardcoded Malicious Blocklist  │
    │  (known compromised versions embedded    │
    │   directly in the skill's instructions)  │
    │                                          │
    │  Layer 2: OSV.dev CVE Query              │
    │  WebFetch → POST /v1/querybatch          │
    │  (free, no API key, covers 12 ecosystems)│
    │                                          │
    │  Layer 3: Metadata Anomaly Checks        │
    │  WebFetch npm/PyPI registry JSON APIs    │
    │  Check: dormancy, maintainer signals,    │
    │  install scripts, version gaps           │
    │                                          │
    │  Layer 4: Claude AI Reasoning            │
    │  Claude analyses all findings, checks    │
    │  reachability in project source,         │
    │  generates narrative + remediation       │
    └──────────┬──────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │         Step 3: Report Generation        │
    │  Markdown table output — severity-sorted │
    │  Critical / High / Medium / Low / Clean  │
    │  Per-finding: CVE ID, risk reason,       │
    │  affected file path, fix recommendation  │
    └─────────────────────────────────────────┘
```

---

## Detection Strategy — 4 Layers (All Inside the Skill)

### Layer 1: Hardcoded Malicious Package Blocklist (Instant, Offline)
The skill's instructions embed a curated table of **confirmed compromised package@version pairs** sourced from the OpenSSF Malicious Packages repository and Socket.dev incident reports. Claude checks each resolved dependency against this table before making any network calls.

**Included in blocklist at launch (and growing with community PRs):**
- `axios@1.14.1`, `axios@0.30.4`
- `event-stream@3.3.6`
- `node-ipc@10.1.3`
- `ctx` (any version, PyPI)
- `rectify` (any version, PyPI)
- `plain-crypto-js@4.2.1`
- *(+ full OpenSSF list subset: ~200 highest-risk entries)*

**Verdict:** CRITICAL — reported immediately, no further analysis needed.

### Layer 2: OSV.dev CVE Query (Live, Free)
Claude uses `WebFetch` to call the OSV.dev batch API:
```
POST https://api.osv.dev/v1/querybatch
Body: { "queries": [ {"package": {"name": "X", "ecosystem": "npm"}, "version": "Y"}, ... ] }
```
- Covers: npm, PyPI, Go, Rust, RubyGems, Maven, NuGet, Dart, crates.io, R, Elixir
- Returns: CVE ID, severity, description, fixed version
- Cost: Free, no authentication required

### Layer 3: Metadata Anomaly Checks (Live, Free Registry APIs)
Claude uses `WebFetch` on registry metadata endpoints to check anomaly signals:

| Signal | API | Heuristic |
|--------|-----|-----------|
| Long dormancy → sudden new version | `registry.npmjs.org/<pkg>` / `pypi.org/pypi/<pkg>/json` | Last release >2 years ago, new version published recently |
| Tiny package with install script | Same registry JSON | `scripts.preinstall` or `scripts.postinstall` present in `package.json` |
| Version number gap | Version list from registry | Checking if skip from e.g. 1.7.x to 1.14.x with no intermediates |
| Typosquatting risk | Claude's semantic reasoning | Edit distance vs well-known packages in the same ecosystem |
| Mismatched repository URL | Registry `repository` field | URL domain doesn't match expected hosting (e.g., GitHub) |

### Layer 4: Claude AI Deep Reasoning (Zero Extra Cost — Already in Context)
Using the findings from Layers 1–3, Claude:
1. **Checks reachability** — Greps the project source for import statements referencing flagged packages. Reports the exact file and line where the package is used.
2. **Assesses exploitability** — Is the vulnerable function actually called, or is the package imported but the risky API unused?
3. **Prioritises** — Ranks findings by: (severity × reachability × package popularity). Cuts noise.
4. **Writes remediation** — Exact version to pin to, alternative package suggestion, or "no action needed" with justification.
5. **Generates narrative** — Human-readable summary of the overall risk posture of the project.

---

## Supported Languages & Manifest Files

The skill's instructions tell Claude to look for all of the following:

| Language | Manifests to Read | Lock Files (preferred) |
|----------|------------------|----------------------|
| JavaScript / Node.js | `package.json` | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile`, `setup.py` | `poetry.lock`, `Pipfile.lock` |
| Go | `go.mod` | `go.sum` |
| Rust | `Cargo.toml` | `Cargo.lock` |
| Ruby | `Gemfile` | `Gemfile.lock` |
| Java / Kotlin | `pom.xml`, `build.gradle` | *(resolved from registry)* |
| PHP | `composer.json` | `composer.lock` |
| .NET / C# | `*.csproj`, `packages.config` | `packages.lock.json` |
| Dart / Flutter | `pubspec.yaml` | `pubspec.lock` |
| R | `DESCRIPTION` | `renv.lock` |
| Elixir | `mix.exs` | `mix.lock` |
| Swift | `Package.swift` | `Package.resolved` |

---

## Skill File Structure

The entire tool is **one markdown file**: `dep-scan.md`

**Location in this repo:** `.claude/commands/dep-scan.md`
**Invocation:** `/dep-scan` in any Claude Code session

**Internal structure of `dep-scan.md`:**

```
Section 1: Role & Goal
  - Sets Claude's role as a dependency security auditor

Section 2: Step-by-Step Instructions
  - Step 1: Discover manifests (Glob all known filenames)
  - Step 2: Read and parse each manifest / lock file
  - Step 3: Build unified dependency list {name, version, ecosystem, source_file}
  - Step 4: Layer 1 — Check against embedded blocklist table
  - Step 5: Layer 2 — WebFetch OSV batch query (batched, one call per ecosystem)
  - Step 6: Layer 3 — WebFetch registry metadata for packages not yet flagged
  - Step 7: Layer 4 — Grep source files for flagged package imports
  - Step 8: Render final report

Section 3: Embedded Malicious Package Blocklist
  - Markdown table: ecosystem | package | version | reason | source

Section 4: Report Template
  - Exact output format Claude must follow
  - Severity legend, table schema, remediation format

Section 5: Constraints
  - Don't make more than 3 WebFetch calls per run without user permission
  - If OSV API is unreachable, proceed with Layers 1, 3, 4 and note the skip
  - Never modify any project files
  - Always show clean packages count alongside findings
```

---

## Open Source Repository Structure

The repo is minimal — the skill is the product:

```
guardian-scan-skill/
├── README.md                     # What it is, how to install (copy 1 file), demo GIF
├── LICENSE                       # Apache-2.0
├── CONTRIBUTING.md               # How to add to the blocklist or improve detection
├── CODE_OF_CONDUCT.md
├── SECURITY.md                   # Responsible disclosure
├── CHANGELOG.md
│
├── .github/
│   ├── workflows/
│   │   └── validate.yml          # Lint the skill markdown on PRs
│   ├── ISSUE_TEMPLATE/
│   │   ├── false_positive.yml    # Report a wrong detection
│   │   ├── missing_detection.yml # Report a package that should be flagged
│   │   └── new_ecosystem.yml     # Request support for a new language
│   └── PULL_REQUEST_TEMPLATE.md
│
├── dep-scan.md                   # ← THE SKILL (copy this to .claude/commands/)
│
├── tests/
│   ├── fixtures/
│   │   ├── npm/
│   │   │   ├── package.json           # with axios@1.14.1
│   │   │   └── package-lock.json
│   │   ├── pip/
│   │   │   └── requirements.txt       # with known CVE packages
│   │   ├── go/
│   │   │   └── go.mod
│   │   └── clean/                     # projects with no issues (false positive test)
│   └── README.md                      # How to manually verify the skill against fixtures
│
└── docs/
    ├── installation.md           # 3-step install guide
    ├── how-it-works.md           # Explains the 4 layers
    ├── adding-to-blocklist.md    # Community contribution guide
    └── ci-usage.md               # How to run via Claude Code in CI pipelines
```

---

## Phased Delivery Plan

### Phase 1 — MVP Skill (Week 1)
**Goal:** Working skill for npm and pip projects
- `dep-scan.md` with Layer 1 (blocklist: top 50 known malicious versions) + Layer 2 (OSV query for npm + PyPI)
- Parses `package.json`, `package-lock.json`, `requirements.txt`
- Terminal report output
- Test manually against `axios@1.14.1` fixture → must flag CRITICAL

### Phase 2 — All Language Support (Week 2)
**Goal:** All 12 manifest parsers working inside the skill instructions
- Add manifest parsing instructions for Go, Rust, Ruby, Java, PHP, .NET, Dart, R, Elixir, Swift
- Expand OSV queries to all supported ecosystems
- Test against fixtures for each language

### Phase 3 — Layer 3 Metadata Anomaly (Week 3)
**Goal:** Detect zero-hour attacks with no CVE
- Add npm registry + PyPI JSON API fetches for anomaly signals
- Add dormancy detection, install script detection, version gap heuristic
- Backtest: run skill against `event-stream@3.3.6` and `node-ipc@10.1.3` fixtures → must flag

### Phase 4 — Layer 4 Reachability + Polish (Week 4)
**Goal:** Reduce noise, improve signal quality
- Add Grep instructions for import/require statement detection
- Add reachability assessment to report
- Add "clean" summary section (packages scanned, 0 issues)
- Add `--quick` mode (Layer 1 only, no network calls) as an instruction variant

### Phase 5 — Open Source Launch (Week 5)
**Goal:** Community-ready repository
- README with demo GIF/screenshot
- CONTRIBUTING.md with blocklist submission process
- GitHub Discussions enabled
- Announce on OpenSSF Slack, r/netsec, Hacker News

---

## Team Roles

| Role | Responsibilities |
|------|-----------------|
| **Security Engineer** | Curate the initial blocklist (OpenSSF + Socket.dev), design anomaly heuristics, validate detection accuracy, maintain backtest corpus |
| **AI / Claude Engineer** | Author the skill prompt (precision, instruction clarity, tool usage), optimise OSV batch call structure, minimise WebFetch calls per scan |
| **Open Source Engineer** | Repo setup, CI for skill linting, fixture creation, CONTRIBUTING guide, false-positive workflow |
| **Community / DevRel** | README quality, launch communications, issue triage, blocklist PR review process |

---

## Community & Open Source Strategy

### Installation is One Step
```bash
cp dep-scan.md /path/to/your/project/.claude/commands/
```
Then in Claude Code: `/dep-scan`

No pip install. No npm install. No API key. Zero friction.

### Community Contribution Ladder
1. **Blocklist additions** — submit a PR adding a row to the blocklist table in `dep-scan.md`. Lowest barrier, highest community value.
2. **Heuristic improvements** — improve the anomaly detection instructions in Layer 3 section.
3. **New language manifest parsing** — add parsing instructions for a new ecosystem.
4. **Test fixtures** — add a manifest file to `tests/fixtures/` that demonstrates a detection.

### False Positive Management (Critical)
- Dedicated GitHub issue template (`false_positive.yml`) captures: package, version, ecosystem, why flagged, why it's benign.
- Allowlist instruction in skill: users can add a comment in their manifest (`# guardian-scan: ignore`) or a `guardian-scan.toml` to suppress known FPs.

---

## Key Decisions Before Any Coding

These must be resolved before writing the skill:

1. **Blocklist size in Phase 1** — Embed top 50 known malicious versions inline, or fetch from a hosted JSON file at scan time? Recommend: embed top 200 (covers all major incidents), fetch updates via `WebFetch` on the repo's raw URL for freshness.

2. **WebFetch call budget** — OSV batch can cover all packages in 1 call per ecosystem (max 3–4 calls total). Layer 3 metadata checks could require 1 call per suspicious package — cap at how many? Recommend: cap at 10 registry metadata calls per scan, flag remainder as "unverified."

3. **Output format** — Markdown table (renders in Claude Code terminal) vs structured JSON vs both? Recommend: Markdown by default (readable), with an option for the user to ask for JSON at the end of the skill instructions.

4. **Skill invocation variants** — Single `/dep-scan` for everything, or also offer `/dep-scan quick` (Layer 1 only, no network) and `/dep-scan deep` (all layers + reachability)? Recommend: single command, Claude detects project size and adapts verbosity.

5. **How to handle monorepos** — Scan root only or recurse into subdirectories? Recommend: recurse up to 3 levels deep, report by subdirectory.

6. **Reachability scope** — When checking if a flagged package is imported, search only `src/` or the entire project? Recommend: search all non-test source files, note test-only usage separately.

7. **Blocklist maintenance ownership** — Who merges blocklist PRs? Recommend: any maintainer can merge blocklist additions with a linked source (OpenSSF, Socket.dev, NVD), but heuristic/logic changes require 2 maintainer reviews.

8. **Repository name** — `guardian-scan-skill`? `dep-scan`? `claude-dep-scanner`? Needs to be memorable and findable.

---

## Verification Plan

### After Phase 1
- Copy skill into a test project containing `axios@1.14.1` in `package.json`
- Run `/dep-scan` → Layer 1 must flag `axios@1.14.1` as CRITICAL with reason "Compromised version — March 2026 RAT injection"
- Run on a clean project → report shows "X packages scanned, 0 findings"

### After Phase 3
- Run against `event-stream@3.3.6` fixture → Layer 1 flags it (in blocklist)
- Create a fixture with a dormant PyPI package that had a new release — Layer 3 anomaly should flag it

### After Phase 4
- Run on this repo's `frontend/` directory with `axios@1.7.7` range → Layer 3 should flag the range as capable of resolving to compromised versions; Layer 4 should find the import in `src/api/client.js` and report it as reachable

### Ongoing
- Monthly: manually test 5 recently reported compromised packages against the skill — all must be detected
- Measure false positive rate: run against 20 popular open source projects — target <3% false positive rate