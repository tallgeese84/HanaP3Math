// Atomic app-shell cache. Family audio is core; artwork is cached on demand.
const CACHE = 'pokequest-hana-h12';
const PREFIX = 'pokequest-hana-';
const CORE = ['./','./index.html','./manifest.json','./hana-voice.json','./hana-avatar.png','./digit-net.json','./icon-192.png','./icon-512.png','./studio.css?v=h12','./curriculum.js?v=h12','./learning.js?v=h12','./studio.js?v=h12','./art/1.png','./art/4.png','./art/7.png','./art/25.png','./art/133.png'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await self.skipWaiting();})());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  // Sibling family apps on the same GitHub Pages origin own their own caches.
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),same=url.origin===self.location.origin;
 if(request.method!=='GET')return;
 const artwork=url.origin==='https://raw.githubusercontent.com'&&url.pathname.startsWith('/PokeAPI/sprites/');
 if(!same&&!artwork)return; // Firebase progress and other apps are never cached here.
 if(same&&!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const page=request.mode==='navigate'||url.pathname.endsWith('/index.html'),voice=url.pathname.endsWith('/hana-voice.json');
  const hit=await cache.match(request);
  if(page||voice){
   try{const response=await fetch(request);if(response.ok){await cache.put(request,response.clone());return response;}if(hit)return hit;return response;}
   catch{if(hit)return hit;if(page)return (await cache.match('./index.html'))||Response.error();return Response.error();}
  }
  if(hit)return hit;
  try{const response=await fetch(request);if(response.ok||response.type==='opaque')await cache.put(request,response.clone());return response;}
  catch{return Response.error();}
 })());
});
