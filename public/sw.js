/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="WebWorker" />

/** @type {ServiceWorkerGlobalScope & typeof globalThis} */
const sw = self


sw.addEventListener("install", (e) => {
    e.waitUntil(sw.skipWaiting())
})

sw.addEventListener("activate", (e) => {
    e.waitUntil(sw.waitUntils())
})

// sw.addEventListener("")