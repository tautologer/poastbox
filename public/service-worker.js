// minimum viable service worker to be allowed to install
self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});
