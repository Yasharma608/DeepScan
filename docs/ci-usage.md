# Using Guardian Scan in CI/CD

Guardian Scan is designed for local developer use, but can be integrated into CI pipelines via Claude Code's headless execution mode.

---

## Recommended Approach: Quick Mode in CI

For CI pipelines, use `/dep-scan quick` — it runs Layer 1 (blocklist) only, with no network calls. This is:
- Fast (no OSV API or registry calls)
- Deterministic (same result every run)
- Zero external dependencies

Run the full scan (`/dep-scan`) locally before merging. Use CI as a safety net for known-bad versions.

---

## GitHub Actions

```yaml
name: Dependency Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  guardian-scan:
    name: Guardian Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Copy Guardian Scan skill
        run: |
          mkdir -p .claude/commands
          cp dep-scan.md .claude/commands/dep-scan.md

      - name: Run Guardian Scan (quick mode)
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "/dep-scan quick" --output-format text > scan-report.txt 2>&1
          cat scan-report.txt

      - name: Fail on CRITICAL findings
        run: |
          if grep -q "🚨 CRITICAL" scan-report.txt; then
            echo "CRITICAL security findings detected. Review scan-report.txt"
            exit 1
          fi

      - name: Upload scan report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: guardian-scan-report
          path: scan-report.txt
```

---

## GitLab CI

```yaml
guardian-scan:
  stage: security
  image: node:20
  before_script:
    - npm install -g @anthropic-ai/claude-code
    - mkdir -p .claude/commands
    - cp dep-scan.md .claude/commands/dep-scan.md
  script:
    - claude -p "/dep-scan quick" --output-format text > scan-report.txt 2>&1
    - cat scan-report.txt
    - |
      if grep -q "🚨 CRITICAL" scan-report.txt; then
        echo "CRITICAL findings — see scan-report.txt"
        exit 1
      fi
  artifacts:
    paths:
      - scan-report.txt
    when: always
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

---

## Pre-commit Hook

To scan before every commit (local only):

```bash
# .git/hooks/pre-commit
#!/bin/bash
set -e

if command -v claude &> /dev/null && [ -f ".claude/commands/dep-scan.md" ]; then
  echo "Running Guardian Scan (quick mode)..."
  OUTPUT=$(claude -p "/dep-scan quick" --output-format text 2>&1)

  if echo "$OUTPUT" | grep -q "🚨 CRITICAL"; then
    echo ""
    echo "🚨 Guardian Scan: CRITICAL security findings detected!"
    echo "$OUTPUT" | grep -A 5 "🚨 CRITICAL"
    echo ""
    echo "Run '/dep-scan' in Claude Code for full details."
    echo "To bypass: git commit --no-verify (not recommended)"
    exit 1
  fi
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Important Caveats

| Concern | Detail |
|---------|--------|
| **API key required** | CI runs require `ANTHROPIC_API_KEY` in environment secrets — Layer 4 (Claude AI reasoning) always runs |
| **Full scan in CI** | Layers 2–3 make network calls to OSV.dev and npm/PyPI; use quick mode to avoid external dependencies |
| **Token cost** | Each full scan uses ~2,000–8,000 tokens depending on project size; quick mode uses ~1,000–3,000 |
| **Rate limits** | If running on many PRs simultaneously, consider caching or batching scans |
| **False positives** | If a blocklist entry causes a false positive in CI, add a `# guardian-scan: ignore` comment in the manifest or use the `guardian-scan.toml` allowlist |

---

## Allowlist for CI False Positives

If a specific package version is incorrectly flagged in your project, create `guardian-scan.toml` at the project root:

```toml
# guardian-scan.toml
# Suppress known false positives

[[ignore]]
package = "example-package"
version = "1.2.3"
ecosystem = "npm"
reason = "Internal fork — not the malicious public version"
expires = "2026-12-31"  # Optional: auto-expires the suppression
```

Guardian Scan checks for this file and skips suppressed entries.
