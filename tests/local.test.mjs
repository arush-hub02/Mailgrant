import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {ownsRun} from '../scripts/local-server.mjs';

test('stop launcher accepts only this checkout’s matching run identifier',()=>{
  const root=resolve(fileURLToPath(new URL('../',import.meta.url))),script=fileURLToPath(new URL('../scripts/local-server.mjs',import.meta.url));
  const run='12345678-1234-1234-1234-123456789abc',state={pid:123,root,run_id:run};
  assert.equal(ownsRun(state,`node "${script}" run ${run} 8787`),true);
  assert.equal(ownsRun(state,`node "${script}" run 12345678-1234-1234-1234-123456789def 8787`),false);
  assert.equal(ownsRun(state,'node unrelated-server.mjs'),false);
  assert.equal(ownsRun({...state,root:resolve(root,'other-project')},`node "${script}" run ${run} 8787`),false);
  assert.equal(ownsRun(state,null),false);
});
