# Third-party notices

WordFlow's own code is Copyright (c) 2026 Marcus, all rights reserved; see LICENSE.
The following unmodified bundled files retain their own licences.

- PDF.js / pdfjs-dist 6.4.299, Mozilla Foundation, Apache License 2.0.
  Full licence: [vendor/pdfjs/LICENSE](vendor/pdfjs/LICENSE).
- PDF.js character maps: [vendor/pdfjs/cmaps/LICENSE](vendor/pdfjs/cmaps/LICENSE).
- Foxit standard font data: [vendor/pdfjs/standard_fonts/LICENSE_FOXIT](vendor/pdfjs/standard_fonts/LICENSE_FOXIT).
- Liberation font data: [vendor/pdfjs/standard_fonts/LICENSE_LIBERATION](vendor/pdfjs/standard_fonts/LICENSE_LIBERATION).

Source: official npm registry tarball
https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.4.299.tgz (accessed 2026-10-06).
No runtime CDN or package installation. The tarball's npm integrity is
`sha512-AVl138zALtfaAPvADulE0PZThbYzCBS79nL4pOSL/6Sm/4AH5A21BD9VHt97OlCuzJuCpmeZtAtkinisF4Vb1g==`.
Tarball SHA-256 and SHA-256 of every retained file: vendor/manifest.json in the repository.
No ZIP library is bundled: native DecompressionStream("deflate-raw") is verified by the DOCX goldens.
