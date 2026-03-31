# Security Policy

## Reporting a Vulnerability in Guardian Scan

If you discover a security vulnerability **in the Guardian Scan skill itself** (e.g., a way the skill's instructions could be exploited to run malicious commands, exfiltrate data, or modify project files), please report it privately:

1. Use GitHub's **Private Security Advisory** feature: go to the repository → Security tab → "Report a vulnerability"
2. Or email the maintainers directly (listed in the repository's GitHub profile)

**Please do not open a public GitHub issue for security vulnerabilities in the skill itself.**

We follow a **90-day disclosure timeline**: we aim to acknowledge reports within 48 hours, and to publish a fix and advisory within 90 days.

---

## Reporting a False Negative (Missed Detection)

If Guardian Scan failed to detect a package that you believe is malicious or vulnerable:

1. Open an issue using the **Missing Detection** template
2. Include: package name, ecosystem, version, and a link to public evidence
3. The maintainers will review and add to the blocklist if confirmed

---

## Reporting a False Positive (Incorrect Detection)

If Guardian Scan flagged a package that is safe:

1. Open an issue using the **False Positive** template
2. Include: package name, version, which layer flagged it, and why it is benign
3. Do not submit a PR to remove a blocklist entry without first opening an issue

---

## Scope

This security policy covers the `dep-scan.md` skill file and the Guardian Scan repository. It does **not** cover vulnerabilities in packages that Guardian Scan detects — those should be reported to the respective package maintainers.
