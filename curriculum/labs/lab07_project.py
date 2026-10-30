"""Inventory a local research artifact folder; this is NOT scientific/security validation."""
import argparse
import hashlib
import json
from pathlib import Path


def inventory(root,output):
    root=root.resolve();output=output.resolve()
    if not root.is_dir(): raise ValueError('Artifact root must be an existing directory.')
    rows=[];invalid_json=[]
    excluded={'.git','.venv','node_modules','__pycache__'}
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.resolve()==output or path.is_symlink(): continue
        relative=path.relative_to(root)
        if any(part in excluded for part in relative.parts) or path.name.startswith('.env'): continue
        # Read only files within the explicitly chosen root; never follow a resolved escape.
        try: path.resolve().relative_to(root)
        except ValueError: continue
        digest=hashlib.sha256()
        with path.open('rb') as stream:
            for block in iter(lambda:stream.read(1024*1024),b''): digest.update(block)
        if path.suffix=='.json':
            try: json.loads(path.read_text(encoding='utf-8'))
            except (ValueError,UnicodeError) as error: invalid_json.append({'path':str(relative),'error':str(error)})
        rows.append({'path':relative.as_posix(),'bytes':path.stat().st_size,'sha256':digest.hexdigest()})
    report={'artifact_count':len(rows),'files':rows,'invalid_json':invalid_json,
        'scope':'Structural inventory and hashes only; not scientific correctness, secret scanning, privacy or license validation.',
        'excluded':'Git, virtual environments, node_modules, caches, .env files and symlinks'}
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    if invalid_json: raise ValueError('Invalid JSON found; inspect the inventory report.')
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=Path('artifact-inventory.json'))
    args=parser.parse_args();report=inventory(args.root,args.output)
    print(f"Inventoried {report['artifact_count']} files. Report: {args.output}")
