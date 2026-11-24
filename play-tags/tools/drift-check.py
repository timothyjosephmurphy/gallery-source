#!/usr/bin/env python3
# #474: run apply-overrides.py in a scratch copy and print hang-geometry diff vs committed src/catalog.json. Never writes the repo.
import json, os, shutil, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); T = tempfile.mkdtemp(prefix='drift-')
for d in ('src', 'tools'): shutil.copytree(os.path.join(R, d), os.path.join(T, d))
os.symlink(os.path.join(R, 'public'), os.path.join(T, 'public'))
r = subprocess.run([sys.executable, 'tools/apply-overrides.py'], cwd=T, capture_output=True, text=True)
if r.returncode: print(r.stderr[-2000:]); sys.exit(2)
a = json.load(open(os.path.join(R, 'src/catalog.json'))); b = json.load(open(os.path.join(T, 'src/catalog.json')))
A = {p['id']: p for p in a['paintings']}; B = {p['id']: p for p in b['paintings']}; n = 0
for i in sorted(set(A) ^ set(B)): n += 1; print('added/dropped', i)
for i in sorted(set(A) & set(B)):
    for k in ('room', 'wall', 'x', 'y', 'z', 'w', 'h', 'trueW', 'trueH', 'plaqueAt'):
        if A[i].get(k) != B[i].get(k): n += 1; print(i, k, A[i].get(k), '->', B[i].get(k))
shutil.rmtree(T); print('drift fields:', n); sys.exit(1 if n else 0)
