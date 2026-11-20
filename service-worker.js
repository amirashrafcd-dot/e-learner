"use strict";
const VERSION = "e-learner-cache-v2";
const ROOT = new URL("./", self.registration.scope);
const OFFLINE_URL = new URL("offline.html", ROOT).href;
const PRECACHE = [
  ROOT.href, "index.html", "branch.html", "offline.html", "404.html", "data.json",
  "manifest.webmanifest", "favicon.svg", "icons/icon-192.svg", "icons/icon-512.svg",
  "assets/style.css", "assets/app.js", "assets/library.js", "assets/three-scene.js"
].map(path => new URL(path, ROOT).href);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("e-learner-cache-") && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const rootPath = new URL("./", self.registration.scope).pathname;
  if (!url.pathname.startsWith(rootPath)) return;
  const relativePath = url.pathname.slice(rootPath.length);
  if (relativePath === "api" || relativePath.startsWith("api/") || relativePath === "control" || relativePath.startsWith("control/")) return;
  if (relativePath === "data.json") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (request.mode === "navigate" || /\.(?:html|css|js|svg|webmanifest|json)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
  const network = fetch(request).then(response => {
    if (response && response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await network || new Response("تعذر تحميل بيانات المكتبة أثناء عدم الاتصال.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
}
async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch {
    if (request.mode === "navigate") {
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
    }
    return new Response("هذا الملف غير متاح دون اتصال.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  }
}
