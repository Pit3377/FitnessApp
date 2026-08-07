// ======================================================
// Fitness App Service Worker
// Version 1.0
// ======================================================

const CACHE_NAME = "fitness-app-v3";

const FILES_TO_CACHE = [

    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./images/placeholder.png"
    "./icons/icon-192.png",
    "./icons/icon-512.png",
];

// ------------------------------------------------------
// Installation
// ------------------------------------------------------

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => cache.addAll(FILES_TO_CACHE))

    );

    self.skipWaiting();

});

// ------------------------------------------------------
// Aktivierung
// ------------------------------------------------------

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys =>

            Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

                        return caches.delete(key);

                    }

                })

            )

        )

    );

    self.clients.claim();

});

// ------------------------------------------------------
// Dateien aus Cache laden
// ------------------------------------------------------

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)

            .then(response => {

                return response || fetch(event.request);

            })

    );

});