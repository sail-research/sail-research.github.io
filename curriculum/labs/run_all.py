"""Run all six CPU laboratories and inventory outputs. No runtime data downloads."""
import argparse
from pathlib import Path
import subprocess
import sys

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed',type=int,default=7)
    parser.add_argument('--split-seed',type=int,default=7)
    parser.add_argument('--output',type=Path,default=Path('outputs'))
    args=parser.parse_args();base=Path(__file__).resolve().parent
    output=args.output.resolve()
    for script,name in [('lab01_math.py','math'),('lab02_baselines.py','baselines'),
        ('lab03_neural.py','neural'),('lab04_trust.py','trust'),
        ('lab05_federated.py','federated'),('lab06_efficiency.py','efficiency')]:
        subprocess.run([sys.executable,str(base/script),'--seed',str(args.seed),
          '--split-seed',str(args.split_seed),'--output',str(output/name)],check=True)
    subprocess.run([sys.executable,str(base/'lab07_project.py'),'--root',str(output),
      '--output',str(output/'artifact-inventory.json')],check=True)
    print('All laboratories finished successfully. Inspect the artifacts and their scope statements.')
