# Installation

## Prerequisites

- [Claude Code](https://claude.ai/code) CLI installed and authenticated
- A project with at least one manifest file (`package.json`, `requirements.txt`, `go.mod`, etc.)

No other prerequisites. No `pip install`. No `npm install`. No API key.

---

## Install (2 steps)

### macOS / Linux

```bash
# Step 1: Create the commands directory in your project (if it doesn't exist)
mkdir -p /path/to/your/project/.claude/commands

# Step 2: Copy the skill
cp dep-scan.md /path/to/your/project/.claude/commands/dep-scan.md
```

### Windows (PowerShell)

```powershell
# Step 1: Create the commands directory
New-Item -ItemType Directory -Force -Path "C:\path\to\your\project\.claude\commands"

# Step 2: Copy the skill
Copy-Item dep-scan.md "C:\path\to\your\project\.claude\commands\dep-scan.md"
```

---

## Verify

Open Claude Code in your project directory and type `/dep`. The `/dep-scan` command should appear in the autocomplete menu.

Run it:
```
/dep-scan
```

You should see Claude begin reading your manifest files and producing a security report within a few seconds.

**If `/dep-scan` doesn't appear in autocomplete:**
- Ensure the file is named exactly `dep-scan.md` (not `dep_scan.md` or `depscan.md`)
- Ensure it's in `.claude/commands/` inside your project root (not your home directory)
- Restart Claude Code and try again

---

## Global Install (Optional)

To make Guardian Scan available in every project without copying:

```bash
mkdir -p ~/.claude/commands
cp dep-scan.md ~/.claude/commands/dep-scan.md
```

---

## Updating

To update to the latest version, replace the file:

```bash
# Download latest and replace
curl -o ~/.claude/commands/dep-scan.md \
  https://raw.githubusercontent.com/guardian-scan/guardian-scan/main/dep-scan.md
```

Or manually copy the updated `dep-scan.md` over the existing file.
