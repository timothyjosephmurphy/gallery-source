# splice deploy/_worker.js into deploy/execute.js (const w = <json string>;)
import json,re
s=open('deploy/execute.js').read(); i=s.index('const w = ')+len('const w = '); j=s.index('; const b=', i)
open('deploy/execute.js','w').write(s[:i]+json.dumps(open('deploy/_worker.js').read())+s[j:])
print('spliced', len(open('deploy/execute.js').read()))
