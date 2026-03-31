---
description: Scan all project dependencies for known malicious packages, CVEs, and supply chain anomalies using a 4-layer detection pipeline. Supports npm, PyPI, Go, Rust, Ruby, Java, PHP, .NET, Dart, R, Elixir, and Swift.
---

# Guardian Scan — Dependency Security Auditor

You are a dependency security auditor. Your job is to scan this project's dependencies for supply chain attacks, known CVEs, and suspicious anomalies. You will run a 4-layer detection pipeline and produce a human-readable security report.

**Never modify any project files. Read only.**

---

## Invocation Modes

Check how the user invoked this skill:
- `/dep-scan` — full scan: all 4 layers
- `/dep-scan quick` — Layer 1 only (offline, no network calls)
- `/dep-scan deep` — all layers + extended reachability across entire source tree

---

## Step 1: Discover Manifest and Lock Files

Use Glob to find all of the following files, searching up to 3 directory levels deep:

**JavaScript / Node.js:**
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

**Python:**
- `requirements.txt`, `requirements/*.txt`, `pyproject.toml`, `Pipfile`, `Pipfile.lock`, `poetry.lock`, `setup.py`, `setup.cfg`

**Go:**
- `go.mod`, `go.sum`

**Rust:**
- `Cargo.toml`, `Cargo.lock`

**Ruby:**
- `Gemfile`, `Gemfile.lock`

**Java / Kotlin:**
- `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`

**PHP:**
- `composer.json`, `composer.lock`

**.NET / C#:**
- `*.csproj`, `packages.config`, `packages.lock.json`, `*.sln`

**Dart / Flutter:**
- `pubspec.yaml`, `pubspec.lock`

**R:**
- `DESCRIPTION`, `renv.lock`

**Elixir:**
- `mix.exs`, `mix.lock`

**Swift:**
- `Package.swift`, `Package.resolved`

If no manifest files are found, report: "No manifest files found. Guardian Scan requires at least one package manifest (e.g. package.json, requirements.txt, go.mod) to scan." Then stop.

**Preference:** Always prefer lock files over manifests — lock files contain exact resolved versions. Read both when available.

Report which files you found before proceeding.

---

## Step 2: Extract Dependencies

Read each manifest and lock file. Build a unified dependency list with these fields for each package:

```
name: string
version: string (exact if from lock file; range notation if from manifest only)
ecosystem: one of [npm, PyPI, Go, crates.io, RubyGems, Maven, Packagist, NuGet, Pub, CRAN, Hex, SwiftURL]
source_file: path to the file where this dependency was found
is_exact_version: boolean (false if version is a range like ^1.0.0 or >=2.0)
```

For **package-lock.json** (npm): extract from the `packages` section — use exact resolved versions.
For **yarn.lock**: parse the `version:` field under each package block.
For **pnpm-lock.yaml**: extract from `packages:` section.
For **requirements.txt**: strip comments and whitespace; extract `package==version` pairs. Note ranges (`>=`, `~=`, `!=`).
For **pyproject.toml**: extract from `[project] dependencies` or `[tool.poetry.dependencies]`.
For **go.mod**: extract `require` block entries.
For **Cargo.lock**: extract `[[package]]` entries with name and version.
For **Gemfile.lock**: extract from `GEM > specs:` section.
For **composer.lock**: extract from `packages` array.
For **pubspec.lock**: extract from `packages:` section.

Once complete, report: "Found N packages across X ecosystems."

---

## Step 3: Layer 1 — Hardcoded Malicious Package Blocklist

**This layer runs offline and instantly. No network calls.**

Check every dependency in your list against the following blocklist table. Any match — exact version OR "any" ecosystem match — is an immediate **CRITICAL** finding.

For version ranges (e.g. `^1.14.0`): if the range could resolve to a blocklisted version, flag as **HIGH** with note: "Version range may resolve to compromised version."

### Malicious Package Blocklist

| Ecosystem | Package | Version(s) | Threat | Source |
|-----------|---------|------------|--------|--------|
| npm | axios | 1.14.1 | RAT injected via plain-crypto-js — maintainer credential hijack (March 2026) | OpenSSF |
| npm | axios | 0.30.4 | RAT injected via plain-crypto-js — maintainer credential hijack (March 2026) | OpenSSF |
| npm | plain-crypto-js | 4.2.1 | RAT delivery vehicle used in axios March 2026 compromise | OpenSSF |
| npm | event-stream | 3.3.6 | Malicious transitive dep (flatmap-stream) injected — Bitcoin wallet theft | OpenSSF |
| npm | flatmap-stream | 0.1.1 | Bitcoin wallet theft — injected as event-stream transitive dependency | OpenSSF |
| npm | node-ipc | 10.1.3 | Disk wiper targeting Russian/Belarusian IP addresses | OpenSSF |
| npm | node-ipc | 10.1.2 | Disk wiper targeting Russian/Belarusian IP addresses | OpenSSF |
| npm | ua-parser-js | 0.7.29 | Cryptominer + password-stealing RAT injected | OpenSSF |
| npm | ua-parser-js | 0.7.30 | Cryptominer + password-stealing RAT injected | OpenSSF |
| npm | ua-parser-js | 1.0.0 | Cryptominer + password-stealing RAT injected | OpenSSF |
| npm | rc | 1.2.8 | Backdoor — credential harvesting | OpenSSF |
| npm | coa | 2.0.3 | Backdoor injected by hijacked maintainer account | OpenSSF |
| npm | coa | 2.0.4 | Backdoor injected by hijacked maintainer account | OpenSSF |
| npm | colors | 1.4.44-liberty-2 | Infinite loop sabotage by package author | OpenSSF |
| npm | colors | 1.4.45-liberty-2 | Infinite loop sabotage by package author | OpenSSF |
| npm | faker | 6.6.6 | Infinite loop sabotage by package author | OpenSSF |
| npm | eslint-scope | 3.7.2 | Credential harvesting — stole npm authentication tokens | OpenSSF |
| npm | crossenv | any | Typosquat of cross-env — environment variable exfiltration | OpenSSF |
| npm | jest-jasmine3 | any | Typosquat of jest-jasmine2 | OpenSSF |
| npm | loadyaml | any | Typosquat of js-yaml — credential exfiltration | OpenSSF |
| npm | mongose | any | Typosquat of mongoose — malicious code execution | OpenSSF |
| npm | expres | any | Typosquat of express — malicious code execution | OpenSSF |
| npm | koa2 | any | Typosquat of koa — backdoor | OpenSSF |
| npm | babelcli | any | Typosquat of babel-cli — credential theft | OpenSSF |
| npm | d3.js | any | Typosquat of d3 — malicious postinstall | OpenSSF |
| npm | discordi.js | any | Typosquat of discord.js — token stealer | OpenSSF |
| PyPI | ctx | any | AWS environment variable exfiltration to attacker server | OpenSSF |
| PyPI | rectify | any | AWS environment variable exfiltration (typosquat of rectify) | OpenSSF |
| PyPI | diango | any | Typosquat of django — malicious code | OpenSSF |
| PyPI | colourama | any | Typosquat of colorama — credential theft | OpenSSF |
| PyPI | python-dateutils | any | Typosquat of python-dateutil — malicious code | OpenSSF |
| PyPI | loguru-colorlog | any | Backdoor — remote code execution | OpenSSF |
| PyPI | aiobotocore-scripts | any | Credential harvesting for AWS | OpenSSF |
| PyPI | acqusition | any | Typosquat of acquisition — malicious payload | OpenSSF |
| PyPI | request-oauthlib | any | Typosquat of requests-oauthlib — credential theft | OpenSSF |
| PyPI | setup-tools | any | Typosquat of setuptools — malicious install script | OpenSSF |
| PyPI | importlib-metadata2 | any | Typosquat — malicious payload | OpenSSF |
| Linux | xz-utils | 5.6.0 | Build system backdoor enabling SSH RCE (CVE-2024-3094) | NVD |
| Linux | xz-utils | 5.6.1 | Build system backdoor enabling SSH RCE (CVE-2024-3094) | NVD |

---

## Step 4: Layer 2 — OSV.dev CVE Query

**Skip this step if invoked as `/dep-scan quick`.**

For packages not yet flagged as CRITICAL by Layer 1, query the OSV.dev batch API. Make **one POST request per ecosystem** — batch all packages from that ecosystem into a single call.

**API endpoint:**
```
POST https://api.osv.dev/v1/querybatch
Content-Type: application/json
```

**Request body format:**
```json
{
  "queries": [
    {"package": {"name": "PACKAGE_NAME", "ecosystem": "ECOSYSTEM"}, "version": "VERSION"},
    {"package": {"name": "PACKAGE_NAME_2", "ecosystem": "ECOSYSTEM"}, "version": "VERSION_2"}
  ]
}
```

**OSV ecosystem names to use:**
- npm packages → `"npm"`
- Python packages → `"PyPI"`
- Go modules → `"Go"`
- Rust crates → `"crates.io"`
- Ruby gems → `"RubyGems"`
- Java/Maven → `"Maven"`
- PHP/Composer → `"Packagist"`
- .NET/NuGet → `"NuGet"`
- Dart packages → `"Pub"`
- R packages → `"CRAN"`
- Elixir packages → `"Hex"`
- Swift packages → `"SwiftURL"`

**Handling the response:**
Each item in `response.results` corresponds to the same-index query. If `vulns` array is non-empty, extract:
- `id`: CVE identifier (e.g. CVE-2023-44271)
- `severity[].score`: CVSS score
- `affected[].ranges[].events`: to find the fixed version
- `summary`: short description

If the OSV API is unreachable (network error or non-200 response), note "OSV.dev unreachable — Layer 2 skipped" in the report and continue with Layers 3 and 4.

Map CVSS scores to severity: 9.0–10.0 = CRITICAL, 7.0–8.9 = HIGH, 4.0–6.9 = MEDIUM, 0.1–3.9 = LOW.

---

## Step 5: Layer 3 — Registry Metadata Anomaly Detection

**Skip this step if invoked as `/dep-scan quick`.**

For packages not yet flagged by Layers 1 or 2, check registry metadata for suspicious signals. **Cap at 10 total WebFetch calls for this layer** — prioritise packages with unusual version patterns or that are small/obscure.

### npm packages
Fetch: `https://registry.npmjs.org/{package-name}`

Check for:
1. **Dormancy + sudden release**: If `time` field shows no releases for >2 years, then a new version appeared recently → flag MEDIUM: "Package dormant for X years — sudden new release (classic hijack signal)"
2. **Install scripts on small package**: If the latest version's `dist-tags.latest` entry in `versions` has `scripts.preinstall` or `scripts.postinstall` AND the package has <100 weekly downloads → flag MEDIUM: "Small package with install script — elevated risk"
3. **Large version gap**: If version history jumps by >10 major/minor versions with no intermediates → flag LOW: "Unusual version gap — verify this release is legitimate"
4. **Mismatched repository URL**: If `repository.url` domain does not match expected hosting (e.g. not github.com or gitlab.com) → flag LOW

### PyPI packages
Fetch: `https://pypi.org/pypi/{package-name}/json`

Check for:
1. Same dormancy heuristic using `releases` object keys sorted by upload date
2. Check `info.requires_dist` for suspicious dependencies
3. Check if `info.home_page` or `info.project_urls` are blank on a package with downloads → flag LOW

If a registry fetch fails (404 or network error), skip that package silently.

---

## Step 6: Layer 4 — Claude AI Reachability and Reasoning

**This layer always runs** (including quick mode, where it operates on Layer 1 findings only).

For each package flagged by Layers 1, 2, or 3:

### 6a. Reachability Check
Use Grep to search the project source files for import/require statements that reference the flagged package.

Search patterns by ecosystem:
- **npm/JS**: `require('PACKAGE')`, `require("PACKAGE")`, `from 'PACKAGE'`, `from "PACKAGE"`, `import PACKAGE`
- **Python**: `import PACKAGE`, `from PACKAGE import`, `pip install PACKAGE`
- **Go**: `"MODULE_PATH"` in import blocks
- **Rust**: `use CRATE`, `extern crate CRATE`
- **Ruby**: `require 'GEM'`, `gem 'GEM'`

For `/dep-scan deep`: search all source files. For standard `/dep-scan`: search `src/`, `lib/`, `app/`, `pkg/` directories and root-level source files; exclude `node_modules/`, `vendor/`, `.git/`, test files.

Report: exact `file:line` for each import found. If not found in source, note "imported but not directly referenced in source (may be transitive dependency)."

### 6b. Exploitability Assessment
For CRITICAL and HIGH findings where the package is reachable:
- Assess: is the dangerous API actually called, or just imported?
- For known attack vectors (e.g. axios RAT activates on HTTP calls, event-stream on Bitcoin wallet library use): note whether the specific risky usage pattern is present.

### 6c. Risk Ranking
Rank all findings by: `severity × reachability × ecosystem_popularity`
- Reachable CRITICAL > Unreachable CRITICAL > Reachable HIGH > Unreachable HIGH > MEDIUM > LOW

### 6d. Remediation
For each finding, provide one of:
- **Exact upgrade**: "Upgrade to X.Y.Z" (the first clean version after the compromise)
- **Remove**: "Remove entirely — no legitimate use case" (for typosquats)
- **Pin and monitor**: "Pin to X.Y.Z — no clean version yet, monitor for advisory"
- **No action needed**: with justification (for test-only usage, dev-only deps in non-CI environments)

---

## Step 7: Generate Security Report

Output the complete report in this exact format:

```
# Guardian Scan — Dependency Security Report

**Project:** [detected project name from manifest]
**Scanned:** [current date and time UTC]
**Packages scanned:** [total count] across [N] ecosystems
**Manifests read:** [comma-separated list of files read]
**Scan mode:** [Full / Quick / Deep]

---

## 🚨 CRITICAL ([count])

| Package | Version | File | Threat | Reachable | Fix |
|---------|---------|------|--------|-----------|-----|
[one row per finding]

## 🔴 HIGH ([count])

| Package | Version | File | CVE / Reason | CVSS | Reachable | Fix |
|---------|---------|------|--------------|------|-----------|-----|
[one row per finding]

## 🟡 MEDIUM ([count])

| Package | Version | File | Issue | Risk Signal | Action |
|---------|---------|------|-------|-------------|--------|
[one row per finding]

## 🟢 LOW ([count])

| Package | Version | File | Note |
|---------|---------|------|------|
[one row per finding]

---

## Reachability Analysis

[For each CRITICAL and HIGH finding: list exact file:line import locations.
If not found in source, state that explicitly.]

---

## Remediation Priority

[Numbered list of actions in priority order — most urgent first.
Each item: package, action, why it's urgent.]

---

## Summary

✅ [N] packages scanned — [count] total findings
🚨 CRITICAL: [N] | 🔴 HIGH: [N] | 🟡 MEDIUM: [N] | 🟢 LOW: [N]

Layer 1 (blocklist): [N] matches
Layer 2 (CVE database): [N] findings [or "skipped" if quick mode]
Layer 3 (anomaly): [N] flags [or "skipped" if quick mode]
Layer 4 (reachability): [N] packages confirmed reachable in source

[If zero findings across all layers:]
✅ All [N] packages scanned — no security findings detected.
```

---

## Constraints

1. **Never modify any project files** — read only.
2. **WebFetch call budget**: max 4 calls for OSV.dev (one per ecosystem batch), max 10 calls for Layer 3 registry metadata. If the budget would be exceeded, prioritise the highest-risk packages and note "N packages not checked due to call budget — run `/dep-scan deep` for full coverage."
3. **If OSV API is unreachable**: note it, continue with Layers 1, 3, 4.
4. **Version ranges**: flag ranges that include known-bad versions as HIGH, not CRITICAL (exact version confirmation not possible).
5. **Monorepo handling**: if multiple manifest files are found at different directory levels, scan all of them and group findings by subdirectory in the report.
6. **Clean result**: always show total packages scanned, even when findings = 0.
7. **Test dependencies**: note when a flagged package appears only in `devDependencies`, test fixtures, or CI config — still report it but note reduced production risk.
