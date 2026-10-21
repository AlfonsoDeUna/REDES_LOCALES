from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
css_files = ['base.css', 'journey.css', 'packet-labs.css', 'security-labs.css']
js_files = ['journey.js', 'packet-labs.js', 'security-labs.js', 'app.js']
css = '\n'.join((SRC / name).read_text(encoding='utf-8') for name in css_files)
js = '\n;\n'.join((SRC / name).read_text(encoding='utf-8') for name in js_files)
assert '</script' not in js.lower(), 'Unexpected closing script tag in source'
html = (SRC / 'shell.html').read_text(encoding='utf-8').replace('/* STYLES */', css).replace('/* SCRIPTS */', js)
(ROOT / 'index.html').write_text(html, encoding='utf-8')
print(f'Built index.html: {len(html.encode()):,} bytes; all assets embedded.')
