# Test Fixtures

These fixtures are example project files used to manually verify Guardian Scan detects correctly.

## How to Test

1. Copy `dep-scan.md` to your `.claude/commands/` directory:
   ```bash
   mkdir -p ~/.claude/commands
   cp dep-scan.md ~/.claude/commands/dep-scan.md
   ```
2. In Claude Code, navigate context to a fixture directory
3. Run `/dep-scan` and verify expected detections appear

## Fixture Reference

| Fixture | Files | Expected Detections | Layers Triggered |
|---------|-------|---------------------|-----------------|
| `npm/` | `package.json`, `package-lock.json` | CRITICAL: axios@1.14.1 (RAT), CRITICAL: plain-crypto-js@4.2.1 (RAT vector) | Layer 1 |
| `npm/src/api/client.js` | Source file | Layer 4 should find `require('axios')` at line 2 — reachable | Layer 4 |
| `pip/` | `requirements.txt`, `pyproject.toml` | CRITICAL: ctx@0.1.2 (env exfil), CRITICAL: colourama@0.4.4 (typosquat), HIGH: pillow@9.0.0 (CVE) | Layer 1 + 2 |
| `go/` | `go.mod`, `go.sum` | MEDIUM: golang.org/x/net old version (may have CVEs) | Layer 2 |
| `rust/` | `Cargo.toml` | HIGH: time@0.1.44 (RUSTSEC-2020-0071) | Layer 2 |
| `clean/` | `package.json`, `requirements.txt` | Zero findings — axios@1.7.9 is clean | None |

## Expected Report Snippets

### npm fixture
```
## 🚨 CRITICAL (2)
| axios           | 1.14.1 | package-lock.json | RAT injected — March 2026 hijack      | ✅ Yes (src/api/client.js:2) | Upgrade to 1.7.9 |
| plain-crypto-js | 4.2.1  | package-lock.json | RAT delivery vehicle (axios compromise) | ⚠️ Transitive           | Remove entirely  |
```

### pip fixture
```
## 🚨 CRITICAL (2)
| ctx       | 0.1.2 | requirements.txt | AWS env var exfiltration | Check source | Remove entirely |
| colourama | 0.4.4 | requirements.txt | Typosquat of colorama    | Check source | Replace with colorama==0.4.6 |
```

### clean fixture
```
✅ 5 packages scanned — no security findings detected.
```

## Adding New Fixtures

1. Create a subdirectory under `tests/fixtures/` named for the ecosystem or attack type
2. Add the manifest/lock file with the vulnerable dependency
3. Add an entry to the table above with expected behavior
4. If testing Layer 4 reachability, add a source file that imports the package
