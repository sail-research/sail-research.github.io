"""Curriculum structural checks, executable examples and notebook/source consistency."""
from pathlib import Path
import contextlib
import hashlib
import io
import json
import re
import zipfile
import torch

ROOT=Path(__file__).resolve().parents[2]
torch.set_num_threads(1)
manifest=json.loads((ROOT/'curriculum/manifest.json').read_text(encoding='utf-8'))
assert len(manifest['lessons'])==42 and len(manifest['modules'])==6
assert len({l['id'] for l in manifest['lessons']})==42
assert len({l['module_id'] for l in manifest['lessons']})==6
results=[];counts=[]
for lesson in manifest['lessons']:
    path=ROOT/'curriculum'/lesson['file'];text=path.read_text(encoding='utf-8')
    assert hashlib.sha256(text.encode()).hexdigest()==lesson['sha256']
    words=len(re.findall(r'\b[\w-]+\b',text));assert words>=600,(path,words)
    assert '## Primary reading' in text
    assert any(term in text.lower() for term in ['exercises','final self-check','oral-defense questions']),path
    assert 'Prerequisites:' in text
    assert not re.search(r'\b(TODO|TBD|lorem ipsum)\b',text,re.I)
    namespace={'__name__':'__curriculum_example__'}
    for index,code in enumerate(re.findall(r'```python\n(.*?)\n```',text,re.S),1):
        with contextlib.redirect_stdout(io.StringIO()): exec(compile(code,f'{path}:example{index}','exec'),namespace)
        results.append({'file':lesson['file'],'block':index,'status':'passed'})
    counts.append({'file':lesson['file'],'words':words})
notebooks=list((ROOT/'curriculum/notebooks').glob('*.ipynb'));assert len(notebooks)==6
for path in notebooks:
    notebook=json.loads(path.read_text(encoding='utf-8'))
    assert notebook['nbformat']==4
    assert len({c['id'] for c in notebook['cells']})==len(notebook['cells'])
    namespace={'__name__':'__notebook_check__'}
    for cell in notebook['cells']:
        if cell['cell_type']=='code':
            assert cell['execution_count'] is None and cell['outputs']==[]
            with contextlib.redirect_stdout(io.StringIO()): exec(compile(''.join(cell['source']),str(path),'exec'),namespace)
bundle=ROOT/'public/training/materials/sail-training-labs.zip'
with zipfile.ZipFile(bundle) as archive:
    assert archive.testzip() is None
    assert 'requirements.txt' in archive.namelist() and 'run_all.py' in archive.namelist()
    assert len([n for n in archive.namelist() if n.endswith('.ipynb')])==6
    assert not any('.env' in n or '__pycache__' in n for n in archive.namelist())
report={'lessons':42,'modules':6,'lesson_word_count':sum(x['words'] for x in counts),
    'lesson_counts':counts,'python_examples':results,'notebooks_executed':6,
    'bundle_sha256':hashlib.sha256(bundle.read_bytes()).hexdigest(),'bundle_bytes':bundle.stat().st_size,'status':'passed'}
destination=ROOT/'docs/training-curriculum-qa';destination.mkdir(parents=True,exist_ok=True)
(destination/'content-checks.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['lesson_counts','python_examples']}))
