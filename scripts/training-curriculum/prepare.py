"""Build stable publication metadata, six notebooks and the credential-free lab bundle."""
from pathlib import Path
import hashlib
import json
import re
import uuid
import zipfile

ROOT=Path(__file__).resolve().parents[2]
COURSE=ROOT/'curriculum'
TRACK='81e30aaf-3703-418b-9586-35a3180fe425'
CONFIG=[
 ('01-math','1935f47b-6ca7-4b6d-ab42-f1a4dc2c5f44','Math Foundations','01-math.md',
  {1:'d264a22b-5740-4406-9282-57a10ec2d593',4:'dc448454-f65e-437b-b402-a5625b17b8d0'},
  'Translate mathematical notation into checked tensor operations.\nDerive and verify gradients with analytic, numerical and automatic methods.\nUse least squares, SVD, probability and uncertainty correctly.\nExplain optimization and numerical failure modes.\nDeliver a reproducible mathematical notebook with meaningful tests.'),
 ('02-ml','ad443309-80cd-4329-a69f-abdf8179e053','Machine Learning and Deep Learning','02-ml.md',
  {3:'e34bf65c-7009-4012-8bae-6f51a671e76e',4:'7842b035-81aa-43cd-a763-733d37d4f4a5'},
  'Build a leakage-safe data and model-selection workflow.\nImplement and debug linear, MLP and CNN baselines.\nExplain attention shapes, masking and Transformer components.\nEvaluate predictions, probabilities and uncertainty with correct denominators.\nReport a controlled, reproducible model comparison.'),
 ('03-trust','f1bca7aa-02ed-45f5-a6f8-fe4a65c35370','Trustworthy AI','03-trust.md',
  {1:'53797745-8903-4f83-9c3d-2798e58aa4d8',3:'c67c541f-8551-4180-9e88-a311c54e6915'},
  'Define a risk context and precise adversary capabilities.\nEvaluate bounded adversarial and local backdoor experiments with clean controls.\nDistinguish empirical defense evidence from formal guarantees.\nExplain differential-privacy assumptions and group-metric tradeoffs.\nProduce a reproducible audit, model card and risk register.'),
 ('04-federated','52acad61-2d9d-40b3-8b2c-765e4ff87b28','Distributed and Federated Learning','04-federated.md',
  {1:'6ff5b579-8b88-4771-a9ee-4943943dd0ab',5:'b912a1b9-db8a-490f-a1b3-54f6756af0f8'},
  'Define global/local objectives and weighting policies.\nImplement and verify FedAvg and the FedProx local objective.\nBuild and audit IID and heterogeneous client partitions.\nCompare quality, client outcomes, local work and communication budgets.\nDistinguish simulation, secure aggregation and differential privacy.'),
 ('05-efficient','c8044d48-b97b-46a4-b789-bc50f608c6c1','Efficient Machine Learning','05-efficient.md',
  {1:'1375a3b3-4f1c-4101-a570-154337794b39',2:'a9bae6d0-fcb6-4c12-ae32-ffef7c4cec00'},
  'Define parameter, storage, compute and runtime resource metrics.\nMeasure latency under a reproducible workload and report its limitations.\nExplain and implement pruning, quantization, low-rank and distillation examples.\nDistinguish trainable parameters from deployed representation and execution.\nBuild a measured Pareto comparison with honest quality/resource tradeoffs.'),
 ('06-project','b037f5b9-888b-416b-acb5-bec8b7f247dc','Mini-project','06-project.md',
  {6:'aff0fb38-082d-4f4d-b654-60adaea7a261'},
  'Turn a broad interest into a testable research question.\nMap primary-source evidence and document reproduction fidelity.\nPredeclare a protocol and preserve auditable artifacts.\nComplete one assigned pillar project with a controlled extension.\nWrite, reproduce and defend a bounded research conclusion.')]
PROJECTS=[
 ('4c47943f-36c4-4712-abc6-45015d2698ca','03-trustworthy-project.md',
  'Investigate a controlled training-only backdoor mechanism on your own small model. Compare clean utility and non-target attack success under a precise threat model, with a clean-model trigger control and a reproducible extension.'),
 ('e7553040-5fbc-49b0-860b-e97605030ae2','04-federated-project.md',
  'Compare IID and label-skewed federated training under a declared local-work and communication budget. Verify weighted aggregation, report client/global outcomes and test one controlled extension.'),
 ('1bc03bef-42ca-4c2c-b6fe-dc44f584d413','05-efficiency-project.md',
  'Measure the predictive-quality and resource tradeoff of one model-efficiency intervention. Use a fixed workload, valid baseline, raw timing evidence and a Pareto analysis with clearly labeled representations.')]


def read(path): return path.read_text(encoding='utf-8')
def dump(path,value): path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
def body(text): return text.split('\n',1)[1].lstrip()


def main():
    modules=[];lessons=[];notebook_paths=[]
    for folder,module_id,title,assignment,existing,outcomes in CONFIG:
        paths=sorted((COURSE/'lessons'/folder).glob('*.md'))
        modules.append({'id':module_id,'track_id':TRACK,'title':title,'outcomes':outcomes,
            'assignment_file':f'assignments/{assignment}',
            'description':f'{len(paths)} detailed lessons with derivations, worked examples, runnable CPU code, exercises, self-checks and primary readings. '+outcomes.split('\n')[0],
            'material_url':'https://www.sail-research.com/training/materials/sail-training-labs.zip'})
        cells=[]
        for i,path in enumerate(paths,1):
            content=read(path);lesson_title=content.splitlines()[0].removeprefix('# ')
            lesson_id=existing.get(i,str(uuid.uuid5(uuid.UUID(module_id),path.name)))
            reference_section=content.split('## Primary reading')[-1]
            primary=re.findall(r'\]\((https://[^)]+)\)',reference_section)[0]
            metadata=next((line for line in content.splitlines() if line.startswith('**Core time:') or line.startswith('**Estimated project effort:')),'')
            description=re.sub(r'\*\*','',metadata)
            lessons.append({'id':lesson_id,'module_id':module_id,'title':lesson_title,
                'file':path.relative_to(COURSE).as_posix(),'description':description,
                'order_index':i*10,'is_active':True,'lesson_type':'Practical' if i==len(paths) or folder=='06-project' and i in [3,4,5] else 'Reading',
                'material_url':primary,'sha256':hashlib.sha256(content.encode()).hexdigest()})
            # Notebook cells preserve all prose; only explicit Python fences become executable cells.
            cursor=0
            for match in re.finditer(r'```python\n(.*?)\n```',content,re.S):
                before=content[cursor:match.start()]
                if before.strip(): cells.append({'cell_type':'markdown','metadata':{},'source':before.splitlines(True)})
                cells.append({'cell_type':'code','metadata':{},'execution_count':None,'outputs':[],
                              'source':match.group(1).splitlines(True)})
                cursor=match.end()
            if content[cursor:].strip(): cells.append({'cell_type':'markdown','metadata':{},'source':content[cursor:].splitlines(True)})
        notebook=COURSE/'notebooks'/f'{folder}.ipynb'
        for index,cell in enumerate(cells): cell['id']=hashlib.sha256(f'{folder}:{index}'.encode()).hexdigest()[:12]
        dump(notebook,{'cells':cells,'metadata':{'kernelspec':{'display_name':'Python 3 (SAIL environment)','language':'python','name':'python3'},
            'language_info':{'name':'python','version':'3.11'}},'nbformat':4,'nbformat_minor':5})
        notebook_paths.append(notebook)
    manifest={'version':'2026-10-31.1','language':'en','track_id':TRACK,'lesson_count':len(lessons),
        'modules':modules,'lessons':lessons,'projects':[{'id':pid,'file':f'lessons/06-project/{filename}',
            'description':description,'material_url':'https://www.sail-research.com/training/materials/sail-training-labs.zip'} for pid,filename,description in PROJECTS]}
    dump(COURSE/'manifest.json',manifest)
    urls={}
    for path in [*sorted((COURSE/'lessons').rglob('*.md')),COURSE/'SETUP.md']:
        for label,url in re.findall(r'\[([^\]]+)\]\((https://[^)]+)\)',read(path)):
            if 'www.sail-research.com/training/materials/' in url: continue
            entry=urls.setdefault(url,{'url':url,'label':label,'used_in':[]})
            entry['used_in'].append(path.relative_to(COURSE).as_posix())
    ref_path=COURSE/'references.json'
    old={r['url']:r for r in json.loads(read(ref_path)).get('references',[])} if ref_path.exists() else {}
    for url,entry in urls.items():
        for key in ['verified_at','http_status','resolved_url','page_title','verification_note']:
            if key in old.get(url,{}): entry[key]=old[url][key]
    dump(ref_path,{'editorial_note':'Primary documentation, original papers, institutional course material and official frameworks. All lesson prose/examples are original teaching synthesis; no third-party images or paper text are redistributed.',
        'references':list(urls.values())})
    destination=ROOT/'public/training/materials';destination.mkdir(parents=True,exist_ok=True)
    entries=[]
    entries.extend((p,p.name) for p in (COURSE/'labs').iterdir() if p.is_file() and p.suffix in ['.py','.txt','.md'])
    entries.extend((p,'notebooks/'+p.name) for p in notebook_paths)
    entries.extend((p,p.relative_to(COURSE).as_posix()) for p in (COURSE/'lessons').rglob('*.md'))
    entries.extend((p,'assignments/'+p.name) for p in (COURSE/'assignments').glob('*.md'))
    entries.extend([(COURSE/'README.md','COURSE-GUIDE.md'),(COURSE/'SETUP.md','SETUP.md'),(ref_path,'references.json')])
    with zipfile.ZipFile(destination/'sail-training-labs.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as bundle:
        for path,name in sorted(entries,key=lambda item:item[1]):
            info=zipfile.ZipInfo(name,date_time=(2026,10,31,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            bundle.writestr(info,path.read_bytes())
    (destination/'start-here.md').write_text(read(COURSE/'SETUP.md'),encoding='utf-8',newline='\n')
    words=sum(len(re.findall(r'\b[\w-]+\b',read(COURSE/l['file']))) for l in lessons)
    print(json.dumps({'lessons':len(lessons),'modules':len(modules),'lesson_words':words,
        'primary_urls':len(urls),'notebooks':len(notebook_paths),'bundle_bytes':(destination/'sail-training-labs.zip').stat().st_size}))


if __name__=='__main__': main()
