"""Evidence-only generator; uses existing runtime, historical source in temporary storage."""
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile
import zipfile
from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import docx
import pypdf

root = pathlib.Path(__file__).resolve().parents[4]
fixtures = root / 'tests/fixtures'
historical = subprocess.check_output(['git', 'show', '3921959:extract_text.py'], cwd=root)
with tempfile.TemporaryDirectory(prefix='wordflow-goldens-') as scratch:
    extractor = pathlib.Path(scratch) / 'extract_text.py'
    extractor.write_bytes(historical)
    doc = Document()
    run = doc.add_paragraph().add_run('e')
    run._r.append(OxmlElement('w:noBreakHyphen'))
    run.add_text('mail works.')
    doc.save(fixtures / 'nobreakhyphen.docx')

    doc = Document()
    doc.add_paragraph('Renamed main part body.', style='Heading 1')
    doc.add_paragraph('Ordinary body sentence.')
    original = pathlib.Path(scratch) / 'original.docx'
    doc.save(original)
    # Rename both main and styles parts; exercise relative and root-relative relationships.
    replacements = {
        '[Content_Types].xml': [('word/document.xml', 'word/document2.xml'), ('word/styles.xml', 'word/styles2.xml')],
        '_rels/.rels': [('word/document.xml', 'word/document2.xml')],
        'word/_rels/document.xml.rels': [('Target="styles.xml"', 'Target="/word/styles2.xml"')],
    }
    renamed = {'word/document.xml': 'word/document2.xml', 'word/styles.xml': 'word/styles2.xml',
               'word/_rels/document.xml.rels': 'word/_rels/document2.xml.rels'}
    with zipfile.ZipFile(original) as src, zipfile.ZipFile(fixtures / 'document2.docx', 'w', zipfile.ZIP_DEFLATED) as dst:
        for name in src.namelist():
            data = src.read(name)
            for before, after in replacements.get(name, []):
                data = data.replace(before.encode(), after.encode())
            dst.writestr(renamed.get(name, name), data)

    doc = Document()
    style = doc.styles.add_style('Heading Character Trap', WD_STYLE_TYPE.CHARACTER)
    paragraph = doc.add_paragraph('Mislinked style paragraph')
    pstyle = OxmlElement('w:pStyle')
    pstyle.set(qn('w:val'), style.style_id)
    paragraph._p.get_or_add_pPr().append(pstyle)
    doc.add_paragraph('Ordinary body sentence.')
    doc.save(fixtures / 'charstyle-as-pstyle.docx')

    rows = []
    capture_file = fixtures / 'capture.json'
    capture = json.loads(capture_file.read_text())
    for name in ['nobreakhyphen.docx', 'document2.docx', 'charstyle-as-pstyle.docx']:
        fixture = fixtures / name
        golden = subprocess.check_output([sys.executable, str(extractor), str(fixture)])
        (fixtures / (name + '.golden.json')).write_bytes(golden)
        row = {'file': name, 'sha256': hashlib.sha256(fixture.read_bytes()).hexdigest(),
               'goldenSha256': hashlib.sha256(golden).hexdigest()}
        rows.append(row)
        capture['records'].append(row)
    capture_file.write_text(json.dumps(capture, indent=2) + '\n', encoding='utf-8', newline='\n')
    evidence = {'historicalCommit': '3921959', 'historicalBlob': subprocess.check_output(
        ['git', 'rev-parse', '3921959:extract_text.py'], cwd=root).decode().strip(),
        'extractorSha256': hashlib.sha256(historical).hexdigest(), 'python': sys.version.split()[0],
        'python-docx': docx.__version__, 'pypdf': pypdf.__version__, 'records': rows,
        'source': 'CC extraction.json S5 differential; document2 also renames the styles part'}
    (pathlib.Path(__file__).parent / 'golden-provenance.json').write_text(
        json.dumps(evidence, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps(evidence))
