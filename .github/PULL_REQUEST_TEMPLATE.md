## Type of Change

- [ ] Blocklist addition (new malicious package entry)
- [ ] Heuristic improvement (Layer 3 anomaly detection)
- [ ] New ecosystem support
- [ ] Bug fix
- [ ] Documentation
- [ ] Test fixture

---

## For Blocklist Additions

**Package:** <!-- e.g. evil-package -->
**Ecosystem:** <!-- e.g. npm, PyPI, Go -->
**Compromised version(s):** <!-- e.g. 1.2.3 or "any" for typosquats -->
**Evidence source with link:** <!-- Must be publicly accessible -->
**Attack type:** <!-- e.g. credential theft, cryptominer, disk wiper, env var exfiltration -->

---

## Testing

- [ ] Tested `/dep-scan` against the relevant test fixture and confirmed detection
- [ ] Verified no false positives on a clean project
- [ ] If adding a new fixture: confirmed it is listed in `tests/README.md`

---

## Checklist

- [ ] Evidence links are publicly accessible
- [ ] Added entry to `CHANGELOG.md`
- [ ] For logic/heuristic changes: included a description of what improved and why
