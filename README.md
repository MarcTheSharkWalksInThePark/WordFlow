# WordFlow

Standalone WordFlow speed reader, canonical under [RULING W1](docs/DECISIONS.md). Front-end behavior and local security are preserved from MarcDeck master `11092e1`.

## Start locally

Use Node **24.16.0 or later**; 24.16.0 is the verified version. No npm installation or npm dependencies are required.

```powershell
cd 'C:\Users\Marcu\Documents\WordFlow'
npm start
```

Open the URL printed at startup, normally **http://localhost:8080/**. WordFlow binds to `127.0.0.1`; if the port is occupied, it tries the next 20 ports. Stop with Ctrl+C.

Text uploads work without Python. PDF and DOCX require Python plus the exact packages in `requirements.txt`. On this machine the unchanged resolver selects:

```text
C:\Users\Marcu\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
Python 3.12.14; pypdf 6.10.0; python-docx 1.2.0
```

For another machine, select your Python interpreter explicitly and install the pinned requirements during your own setup:

```powershell
py -m pip install -r requirements.txt
$env:PYTHON = (py -c "import sys; print(sys.executable)")
npm start
```

No packages were installed during extraction or verification. The resolver tries shell `PYTHON`, then the existing Codex runtime, then `python`. A shell `PYTHON` override must have both pinned libraries. The Codex runtime is a local convenience, not a portable deployment dependency.

Set `$env:PORT` in the shell for another port. No secrets or environment files are needed. The unchanged env loader can read user-created `.env.local` / `.env`; these files are ignored by Git. The original order is retained: HOST and PORT are decided **before** that loader, so set bind options in the shell.

An explicit non-loopback `HOST` opts into exposure and prints a warning that the Host check is off. Public hosting is **not approved or implemented**. Read [HOSTING.md](HOSTING.md); deployment needs its own ruling and verification.

## Verify

```powershell
npm test
npm run mutations -- --out docs/verification/results/mutations.json
```

The regression corpus uses synthetic TXT/PDF/DOCX and a local HTTP fixture. PDF/DOCX skip only when their libraries are absent from the selected interpreter, with explicit messages. The security suite retains all 32 applicable RULING 59 checks. Tests enforce loopback before binds and connections; unsafe bind mutations are refused before a socket exists. No npm dependencies are added.

Old/new parity requires a disposable master worktree created from a **scratch clone**, never this task's source checkout. Put only a synthetic dummy env file in that worktree. Then:

```powershell
npm run parity -- --old 'C:\path\to\disposable-master-worktree' --new 'C:\Users\Marcu\Documents\WordFlow' --out docs/verification/results/parity.json
```

The optional `npm run smoke` uses already-installed Chrome and Playwright; it installs nothing. Set `WORDFLOW_CHROME` or `WORDFLOW_PLAYWRIGHT_DIR` if needed. The recorded smoke used Codex's existing bundled Playwright, an isolated browser profile, and a loopback deny-proxy.

Full provenance and results: [standalone verification report](docs/verification/2026-10-05_codex_wordflow_standalone.md). Repository hosting name, visibility, licence and backup remain Marcus's decisions. `LICENSE` is deliberately undecided.
