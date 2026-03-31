# Changelog

All notable changes to Guardian Scan are documented here.

## [0.1.0] - 2026-03-31

### Added
- Initial release of `dep-scan.md` Claude Code skill
- Layer 1: Hardcoded blocklist covering 30+ confirmed malicious package versions including axios@1.14.1, event-stream@3.3.6, node-ipc@10.1.3, xz-utils@5.6.0-5.6.1, ua-parser-js compromised versions, PyPI typosquats (ctx, rectify, colourama), and more
- Layer 2: Live OSV.dev CVE batch query — free, no authentication, covers 12 ecosystems in 1 call per ecosystem
- Layer 3: Registry metadata anomaly detection for npm and PyPI (dormancy signals, install scripts, version gaps)
- Layer 4: Claude AI reachability analysis — checks which flagged packages are actually imported in project source, assesses exploitability, generates ranked remediation
- Support for 12 languages/ecosystems: JavaScript/Node.js, Python, Go, Rust, Ruby, Java/Kotlin, PHP, .NET/C#, Dart/Flutter, R, Elixir, Swift
- `/dep-scan` full scan mode (all 4 layers)
- `/dep-scan quick` offline mode (Layer 1 blocklist only, no network calls)
- `/dep-scan deep` extended mode (all layers + full source tree reachability)
- Test fixtures for npm (axios@1.14.1 + plain-crypto-js@4.2.1), Python (ctx + pillow CVE), Go, Rust, and clean projects
- GitHub issue templates for false positives, missing detections, and new ecosystem requests
- GitHub Actions workflow for skill validation on PRs
- Full documentation: installation guide, architecture explainer, blocklist contribution guide, CI usage guide
