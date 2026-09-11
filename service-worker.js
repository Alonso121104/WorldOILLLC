const CACHE_NAME = "world-oil-v3";

const APP_SHELL = [
    "./",
    "./index.html",
    "./tech_login.html",
    "./technician-signup.html",
    "./technician-dashboard.html",
    "./manifest.json",
    "./manifest.webmanifest"
];

self.addEventListener("install", event => {

    console.log(
        "World OIL service worker installing..."
    );

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(
                    APP_SHELL
                );

            })
            .then(() => {

                return self.skipWaiting();

            })

    );

});


self.addEventListener("activate", event => {

    console.log(
        "World OIL service worker activated..."
    );

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(
                            name =>
                                name !== CACHE_NAME
                        )
                        .map(
                            name =>
                                caches.delete(name)
                        )

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


self.addEventListener("fetch", event => {

    // Only handle GET requests
    if (
        event.request.method !== "GET"
    ) {
        return;
    }


    const url =
        new URL(event.request.url);


    /*
     * Do NOT interfere with Firebase,
     * Stripe, or Cloud Functions.
     */

    if (

        url.hostname.includes(
            "googleapis.com"
        ) ||

        url.hostname.includes(
            "firebaseapp.com"
        ) ||

        url.hostname.includes(
            "gstatic.com"
        ) ||

        url.hostname.includes(
            "stripe.com"
        ) ||

        url.hostname.includes(
            "cloudfunctions.net"
        )

    ) {

        return;

    }


    /*
     * HTML PAGES
     *
     * Always try the network first.
     * This prevents users from being stuck
     * with an old version of the website.
     */

    if (
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html")
    ) {

        event.respondWith(

            fetch(event.request)

                .then(networkResponse => {

                    if (
                        networkResponse &&
                        networkResponse.status === 200
                    ) {

                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                    }

                    return networkResponse;

                })

                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

        return;

    }


    /*
     * OTHER FILES
     *
     * Use cache first for things like:
     * CSS, JavaScript, icons, images, etc.
     */

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }


                return fetch(event.request)

                    .then(networkResponse => {

                        if (

                            !networkResponse ||

                            networkResponse.status !== 200 ||

                            networkResponse.type !== "basic"

                        ) {

                            return networkResponse;

                        }


                        const responseClone =
                            networkResponse.clone();


                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });


                        return networkResponse;

                    });

            })

    );

});
