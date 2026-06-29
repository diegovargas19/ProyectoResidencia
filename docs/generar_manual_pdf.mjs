import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const docsDir = path.resolve('docs');
const mdPath = path.join(docsDir, 'manual_usuario.md');
const htmlPath = path.join(docsDir, 'manual_usuario.html');
const pdfPath = path.join(docsDir, 'manual_usuario.pdf');

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderInline = (value) =>
  escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const markdownToHtml = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed === '---') {
      closeList();
      html.push('<hr />');
      continue;
    }

    if (trimmed.startsWith('# ')) {
      closeList();
      html.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      closeList();
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      closeList();
      html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith('- ')) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }

      html.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (orderedMatch) {
      closeList();
      html.push(
        `<p class="step"><span>${orderedMatch[1]}</span>${renderInline(
          orderedMatch[2]
        )}</p>`
      );
      continue;
    }

    closeList();
    html.push(`<p>${renderInline(trimmed)}</p>`);
  }

  closeList();
  return html.join('\n');
};

const markdown = fs.readFileSync(mdPath, 'utf8');
const body = markdownToHtml(markdown);
const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Manual de Usuario - Sistema de Gestion de Proyectos Academicos</title>
    <style>
      @page {
        size: Letter;
        margin: 18mm 16mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: #172033;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11pt;
        line-height: 1.55;
      }

      main {
        max-width: 780px;
        margin: 0 auto;
      }

      h1,
      h2,
      h3 {
        color: #0b162c;
        line-height: 1.2;
      }

      h1 {
        margin: 0 0 12px;
        padding-top: 12px;
        font-size: 28pt;
      }

      h2 {
        margin: 30px 0 10px;
        padding-top: 8px;
        border-top: 2px solid #e5e7eb;
        font-size: 17pt;
        break-after: avoid;
      }

      h3 {
        margin: 20px 0 8px;
        font-size: 13pt;
        break-after: avoid;
      }

      p {
        margin: 7px 0;
      }

      ul {
        margin: 8px 0 14px;
        padding-left: 20px;
      }

      li {
        margin: 4px 0;
      }

      hr {
        margin: 24px 0;
        border: 0;
        border-top: 1px solid #d9dee8;
      }

      .step {
        display: flex;
        gap: 10px;
        margin: 6px 0;
      }

      .step span {
        display: inline-flex;
        width: 22px;
        height: 22px;
        flex: 0 0 22px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #991b1b;
        color: white;
        font-size: 9pt;
        font-weight: 700;
      }

      strong {
        color: #0b162c;
      }

      h1:first-of-type {
        margin-top: 70px;
        padding: 40px 0 0;
        border-top: 8px solid #991b1b;
      }

      h1:first-of-type + h2 {
        border-top: 0;
      }

      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        h2 {
          break-inside: avoid;
        }

        ul,
        p {
          break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <main>
      ${body}
    </main>
  </body>
</html>
`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML generado: ${htmlPath}`);

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const browserPath = browserCandidates.find((candidate) =>
  fs.existsSync(candidate)
);

if (!browserPath) {
  console.log('No se encontro Chrome o Edge para generar PDF automaticamente.');
  process.exit(0);
}

const result = spawnSync(
  browserPath,
  [
    '--headless',
    '--disable-gpu',
    `--print-to-pdf=${pdfPath}`,
    `file:///${htmlPath.replace(/\\/g, '/')}`,
  ],
  {
    stdio: 'inherit',
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`PDF generado: ${pdfPath}`);
