# Claude Instructions for WordFlow

**Read `AGENTS.md` first.** It holds the shared rules: rulings in force, the RULING 59 protections,
how to run, test and push, Python, verification discipline, worklogs and open items. If this file
and `AGENTS.md` ever disagree, `AGENTS.md` wins until Marcus rules.

- Local path: `C:\Users\Marcu\Documents\WordFlow`
- Remote: `https://github.com/MarcTheSharkWalksInThePark/WordFlow` (private), branch `master`.

## Before doing anything

1. Read `AGENTS.md`, `docs/DECISIONS.md` (RULING W1 and the 19 dispositions), `README.md` and
   `HOSTING.md`.
2. Read the latest reports in `docs/verification/`. They are claims to check, not facts.
3. Run `git status` and `git log --oneline -5`, and confirm `git config core.hooksPath` is
   `.githooks`.

## Hard rules (restated from AGENTS.md)

- This repository is canonical for WordFlow (RULING W1). Never change WordFlow inside MarcDeck.
- Do not weaken any RULING 59 protection without a new ruling.
- Never open, print or copy a `.env` file.
- Push only with `bash tools/push.sh`. Never `git push` directly and never `--no-verify`.
- Hosting needs its own ruling and verification (`HOSTING.md`).

## Claude Code specifics

- **Worklog:** `C:\Users\Marcu\Documents\AI brain\AI brain\09_AI_Worklog\ClaudeCode\YYYY-MM-DD_claude-code-log.md`,
  one entry per session with an HH:MM time. Never create the vault's dated daily note.
- **Project note:** `03_Projects/Active/WordFlow.md` in the vault. Update hot-cache when state
  changes.
- **Line endings.** `server.js` and the front-end files are CRLF (`.gitattributes`); `*.sh`,
  `.githooks/*`, `*.cjs`, `*.json` and `*.md` are LF. Edit with tools that keep the existing
  endings, and scan for stray CR or non-ASCII after writing.
- **Bash on Windows.** Use `"C:\Program Files\Git\bin\bash.exe"` with a script file. Heredocs and
  `sed` have dropped backslashes here; write scripts that contain backslashes with a file-writing
  tool.
- **Report honestly.** Say what was verified, what was not, and whether anything was pushed.

## Updates

### 2026-10-05 - claude-code

Created with `AGENTS.md`.
