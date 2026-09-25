const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('the original 62 Mum/Dad clips remain byte-for-byte intact',()=>{
 const buf=fs.readFileSync(path.join(root,'hana-voice.json'));
 assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),'b30d7073806a183c04553078be47b44e315daf0e4777e03b4367aa862785a994');
 const pack=JSON.parse(buf);assert.equal(Object.keys(pack.clips).length,62);assert.deepEqual(pack.voices,['dad','mum']);
});
test('HTML scripts parse, element IDs are unique, release versions match',()=>{
 const html=read('index.html'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 for(const [,source]of scripts)new vm.Script(source);
 const ids=[...html.split('<script>')[0].matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.match(html,/APP_VERSION = 'h12'/);assert.match(read('sw.js'),/pokequest-hana-h12/);
 for(const file of ['studio.js','studio.css','learning.js','curriculum.js'])assert.ok(read('sw.js').includes(file+'?v=h12'));
});
test('service-worker activation only deletes Hana caches',async()=>{
 const callbacks={},deleted=[];const ctx={self:{addEventListener:(name,fn)=>callbacks[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>['pokequest-hana-h11','pokequest-hana-h12','mochi-v5','pokemath-v64'],delete:async k=>deleted.push(k)}};
 vm.runInNewContext(read('sw.js'),ctx);let promise;callbacks.activate({waitUntil:p=>promise=p});await promise;
 assert.deepEqual(deleted,['pokequest-hana-h11']);
});
test('service-worker core contains local modules, family audio and starter artwork',()=>{
 const sw=read('sw.js');assert.match(sw,/\.\/hana-voice.json/);assert.match(sw,/\.\/digit-net.json/);assert.match(sw,/\.\/art\/25.png/);
 assert.match(sw,/if\(request.method!=='GET'\)return/);
});
