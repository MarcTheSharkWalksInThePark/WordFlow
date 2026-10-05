# Public hosting: requirements, not implementation

This repository preserves the existing **local** WordFlow behavior and RULING 59 security. It is ready for a later hosting design phase, not public deployment. **Hosting needs its own Marcus ruling and verification before any deployment.**

## URL retrieval and SSRF

[normalizeRemoteUrl](server.js#L223) accepts HTTP(S) syntax without classifying the destination. [readRemoteUrl](server.js#L150) calls fetch with `redirect: "follow"` at line 162. A reachable public endpoint could therefore read internal resources. The loopback fixture in the parity tests deliberately demonstrates the preserved local behavior; it is not an SSRF defence.

Before hosting, resolve each destination through controlled DNS and reject **private, loopback and link-local** addresses, including IPv6 and IPv4-mapped forms. Reject non-public/special-use destinations by an explicit policy, not hostname text alone. Bind the actual connection to the vetted result to prevent DNS rebinding or a second unchecked DNS lookup. Handle redirects explicitly: validate the scheme, resolve and classify the next destination, and re-check **every redirect** before connecting. Add offline DNS/redirect/private-address witnesses and verify that no request bytes reach a forbidden fixture. Preserve sensible redirect and response-size/time limits.

## Inbound Host policy

[checkHostHeader](server.js#L16) currently follows the bind address. [startupWarning](server.js#L107) documents that non-loopback HOST switches the check off; [isAllowedHostHeader](server.js#L118) permits only loopback names on the actual bound port (portless at port 80). [serverOptions](server.js#L114) preserves Node's missing-Host 400 while the app check is off; duplicate Host fields are always refused at [request entry](server.js#L44).

Hosting requires an explicit **allowed-hosts setting** for approved public domains, replacing “Host check off” for non-loopback binds. Keep the duplicate-Host and raw-target checks, define proxy Host/forwarded-header trust, and test public domain names, wrong ports, missing/foreign/duplicate Host fields and proxy rewrites. Do not trust arbitrary client-supplied forwarded headers.

## Upload and resource limits

[maxUploadBytes](server.js#L18) is already 24 MiB; [readMultipartFile](server.js#L283) and [readLimitedBuffer](server.js#L255) enforce it, with the existing connection-destroy behavior on overflow. [maxRemoteBytes](server.js#L17) is 3 MiB and [readLimitedText](server.js#L235) enforces it; URL retrieval has a 12-second abort timer at [line 158](server.js#L158).

Hosting must deliberately choose upload/body limits at both proxy and app layers, rate limits, per-client and global concurrency limits, and a bounded queue. Limit temporary disk use, extracted output and decompression expansion for PDF/DOCX. [extractUploadedFile](server.js#L182) writes a temporary file and removes it in a finally block; [runExtractor](server.js#L354) currently starts a Python process with **no extractor timeout**, memory bound or concurrency cap. Add a deadline that terminates the extractor (and children), bounded stdout/stderr, cancellation and cleanup tests. A fetch timeout does not limit extraction.

## HTTPS and logging

Use HTTPS through a correctly configured reverse proxy, with HTTP redirected to HTTPS, certificate renewal and explicit trust boundaries. Keep the application upstream on loopback or a restricted private connection. Restrict request sizes/timeouts and explicitly define which public Host reaches the app. The existing [server creation](server.js#L39) uses plain HTTP and does not supply TLS.

Never log document content, upload bodies, extracted text or full sensitive URLs. [sendJson](server.js#L458) returns extraction/retrieval bodies to the requester; it is not a logging facility. The catch at [line 80](server.js#L80) logs raw exceptions, and [runExtractor](server.js#L369) accumulates stderr: review these paths before hosting so a parser exception cannot expose content, filenames or secrets. Log bounded operational metadata, redact errors, define access and retention, and test that synthetic document text is absent from logs. No public logging changes were made in this extraction.

## Secrets and operations

WordFlow currently needs **no secrets**. [loadLocalEnv](server.js#L131) and [runExtractor's env](server.js#L358) preserve the existing loader and inherited environment. Hosting must use a secret manager or narrowly scoped injected environment, restrict filesystem/process access, and avoid passing unrelated credentials to extractors. Keep `.env*` out of Git and deployment assets; the [static allowlist](server.js#L32), [path resolver](server.js#L439) and [independent dotfile guard](server.js#L454) remain mandatory. Test only with synthetic dummy secrets. Decide authentication/authorization, retention, deployment backup, monitoring and the licence under the later hosting ruling.

Nothing in this document deploys a service, changes the local URL policy or disables a protection.
