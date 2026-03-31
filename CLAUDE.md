# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Guardian Scan is a free Claude Code skill (`dep-scan.md`) that scans project dependencies for supply chain attacks, known CVEs, and suspicious anomalies. The skill is the product — it is a single Markdown file users copy into `.claude/commands/` and invoke via `/dep-scan`.

## Architecture

The entire tool lives in one file: `dep-scan.md`. It contains:
- Role definition and invocation modes (`/dep-scan`, `/dep-scan quick`, `/dep-scan deep`)
- Step-by-step instructions Claude follows: manifest discovery → dependency extraction → 4-layer detection → report generation
- Embedded malicious package blocklist (Layer 1) — 38+ confirmed malicious versions
- OSV.dev API call structure (Layer 2)
- Registry metadata anomaly heuristics (Layer 3)
- Reachability and remediation instructions (Layer 4)
- Report output template

## Repository Structure

```
dep-scan.md                  ← THE SKILL — the core product
tests/fixtures/              ← Example manifests for manual testing
  npm/                       ← axios@1.14.1 + plain-crypto-js@4.2.1 (CRITICAL)
  pip/                       ← ctx + colourama (CRITICAL), pillow (HIGH CVE)
  go/                        ← old golang.org/x/net (MEDIUM)
  rust/                      ← time@0.1.44 (HIGH CVE)
  clean/                     ← Zero findings (false positive test)
docs/                        ← Installation, how-it-works, blocklist guide, CI guide
.github/                     ← Workflows, issue templates, PR template
```

## Key Decisions (from GUARDIAN_SCAN_PLAN.md)

- **No CLI, no VS Code plugin** — skill-only format; zero friction install
- **WebFetch budget**: max 4 OSV calls (one per ecosystem batch), max 10 registry metadata calls
- **Output**: Markdown table by default; JSON available on request
- **Monorepo**: recurse up to 3 levels, group findings by subdirectory
- **Version ranges**: flag as HIGH (not CRITICAL) if range includes a blocklisted version
- **Test-only deps**: still report but note reduced production risk

## Editing the Skill

When modifying `dep-scan.md`:
1. The blocklist table is under `### Malicious Package Blocklist` in Step 3
2. Keep instruction steps numbered and explicit — Claude executes them literally
3. The report template at the end defines exact output format — don't change column names without updating the instructions that reference them
4. After any change, test against `tests/fixtures/npm/` — `axios@1.14.1` must always flag CRITICAL

## Validation

The GitHub Actions workflow (`.github/workflows/validate.yml`) checks:
- Markdown lint on `dep-scan.md` and `docs/`
- Blocklist table header format
- Fixture JSON validity
