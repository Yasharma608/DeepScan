# Contributing to Guardian Scan

Thank you for helping make the open source supply chain more secure.

## Types of Contributions

Listed from easiest to most involved:

### 1. Blocklist Additions (Easiest)
Add a row to the malicious package table in `dep-scan.md`. This is the highest-value contribution — every addition protects every user immediately.

**Requirements:**
- Package name, ecosystem, exact compromised version(s)
- A publicly accessible link to evidence (see approved sources below)
- Brief description of the attack

**Approved evidence sources (in order of credibility):**
1. [OpenSSF Malicious Packages](https://github.com/ossf/malicious-packages)
2. [Socket.dev security reports](https://socket.dev/npm/issues)
3. [NVD/CVE database](https://nvd.nist.gov/)
4. npm or PyPI security advisories
5. Vendor security advisories

**Blocklist table format:**
```
| Ecosystem | Package | Version(s) | Threat | Source |
```

Example row:
```
| npm | evil-package | 2.3.1 | Exfiltrates env vars on install | https://github.com/ossf/malicious-packages/... |
```

**Version specification:**
- Exact version: `1.2.3`
- Multiple versions: `1.2.3, 1.2.4`
- All versions (typosquats only): `any`

**PR checklist for blocklist additions:**
- [ ] Evidence source is publicly accessible
- [ ] Package name and version are exact (copy from registry)
- [ ] Threat description is factual and brief (not editorial)
- [ ] Added entry to `CHANGELOG.md`
- [ ] Tested: ran `/dep-scan` on the relevant test fixture and confirmed detection

**Review policy:** 1 maintainer approval + 1 linked source. Merges usually within 48 hours.

---

### 2. Heuristic Improvements (Layer 3)
Improve the anomaly detection logic in the Layer 3 section of `dep-scan.md`. Examples: adding a new signal to check, improving the dormancy threshold, adding a new registry API.

**Review policy:** 2 maintainer approvals. Must include a test fixture that demonstrates the improvement.

---

### 3. New Ecosystem Support
Add manifest parsing instructions for a language/ecosystem not yet supported.

Open a GitHub issue using the **New Ecosystem** template first to confirm scope before writing code.

**What to provide:**
- Manifest and lock file names
- Registry metadata API URL
- OSV.dev ecosystem name
- At least one test fixture

---

### 4. Test Fixtures
Add example manifest files to `tests/fixtures/` that demonstrate a detection case. Each fixture should have a companion entry in `tests/README.md` describing the expected behavior.

---

### 5. Documentation
Improvements to `docs/`, `README.md`, or inline skill documentation are always welcome.

---

## False Positives

If Guardian Scan flags a package incorrectly, please open an issue using the **False Positive** template. Do not submit a PR to remove a blocklist entry without opening an issue first — maintainers need to verify the claim.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

---

## Development Setup

No build step required. The entire skill is `dep-scan.md` — edit it directly and test by copying to `.claude/commands/dep-scan.md` in a project that has the relevant fixture files.
