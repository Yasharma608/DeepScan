# Adding to the Blocklist

The blocklist in `dep-scan.md` is the first line of defense — and the most direct way to protect the community. Every entry you add protects every Guardian Scan user immediately.

---

## What Qualifies

A package version qualifies for the blocklist if:

- **Confirmed malicious** — a public, credible source has documented that the package contains malicious code
- **Specific** — exact version(s) are known (or "any" for typosquats where the entire package is fake)
- **Publicly documented** — the evidence is accessible to reviewers

**Does NOT qualify:**
- Packages that are simply unmaintained or abandoned
- Packages with poor code quality or bad practices
- Packages you personally dislike or distrust without evidence
- Packages with only private/undisclosed vulnerabilities

---

## How to Submit

### Option A: GitHub Issue (Recommended for first-time contributors)

1. Open an issue using the **Missing Detection** template
2. Fill in: package name, ecosystem, version(s), evidence source, evidence link, attack description
3. A maintainer will review and add the entry — usually within 48 hours for clear cases

### Option B: Pull Request (For contributors comfortable with the format)

1. Fork the repository
2. Edit `dep-scan.md` — find the blocklist table under "Step 3: Layer 1"
3. Add your row (see format below)
4. Update `CHANGELOG.md` with your addition
5. Open a PR using the PR template — fill in the blocklist addition section

---

## Blocklist Table Format

Find the table in `dep-scan.md` under `### Malicious Package Blocklist`. Add a new row:

```
| Ecosystem | Package | Version(s) | Threat | Source |
```

**Example:**
```
| npm | evil-logger | 2.3.1 | Exfiltrates process.env to attacker server on import | https://github.com/ossf/malicious-packages/blob/main/... |
```

**Version field rules:**

| Pattern | Use when |
|---------|----------|
| `1.2.3` | Single compromised version |
| `1.2.3, 1.2.4` | Multiple specific versions |
| `any` | Entire package is malicious (typosquat, fake package) |

---

## Approved Evidence Sources

Listed in order of credibility:

1. **OpenSSF Malicious Packages** — `github.com/ossf/malicious-packages` — the authoritative community registry, cross-reviewed
2. **Socket.dev** — `socket.dev/npm/issues` — automated and human-reviewed supply chain threat reports
3. **NVD/CVE** — `nvd.nist.gov` — official CVE database with CVSS scores
4. **npm security advisories** — `npmjs.com/advisories`
5. **PyPI security advisories** — `pypi.org/security`
6. **Vendor security advisories** — official announcements from the affected package's maintainers

---

## Review Policy

| Type | Approvals Required | Typical Turnaround |
|------|-------------------|-------------------|
| Blocklist addition (new entry) | 1 maintainer + 1 linked source | 48 hours |
| Blocklist correction (fix existing entry) | 1 maintainer | 24 hours |
| Heuristic/logic change (Layer 3) | 2 maintainers | 1 week |
| New ecosystem support | 2 maintainers + test fixture | 2 weeks |

---

## PR Checklist for Blocklist Additions

Before opening a PR, verify:

- [ ] Evidence link is publicly accessible (open it in an incognito window)
- [ ] Package name and version are copied exactly from the registry
- [ ] Threat description is factual and under 15 words
- [ ] CHANGELOG.md updated
- [ ] If you have the fixture: tested `/dep-scan` against it and confirmed detection
