const CACHE_NAME = "world-oil-v4";

const APP_SHELL = [
    "./",
    "./index.html",
    "./tech_login.html",
    "./technician-signup.html",
    "./technician-dashboard.html",
    "./manifest.webmanifest"
];


self.addEventListener("install", event => {

    console.log(
        "World OIL service worker v4 installing..."
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
        "World OIL service worker v4 activated..."
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

    /*
     * Only handle GET requests.
     */

    if (
        event.request.method !== "GET"
    ) {
        return;
    }


    const url =
        new URL(
            event.request.url
        );


    /*
     * Do NOT interfere with Firebase,
     * Stripe, Cloud Functions, or other
     * backend requests.
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
     * Network first.
     *
     * This means the newest version
     * of your page is requested first.
     *
     * If the internet is unavailable,
     * the cached page is used.
     */

    if (

        event.request.mode ===
            "navigate" ||

        url.pathname.endsWith(
            ".html"
        )

    ) {

        event.respondWith(

            fetch(event.request)

                .then(networkResponse => {

                    if (

                        networkResponse &&

                        networkResponse.status ===
                            200

                    ) {

                        const responseClone =
                            networkResponse.clone();


                        caches.open(
                            CACHE_NAME
                        )
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
     * Cache first.
     *
     * Used for:
     * - icons
     * - images
     * - manifests
     * - CSS
     * - JavaScript
     */

    event.respondWith(

        caches.match(
            event.request
        )

        .then(cachedResponse => {

            if (
                cachedResponse
            ) {

                return cachedResponse;

            }


            return fetch(
                event.request
            )

            .then(networkResponse => {

                if (

                    !networkResponse ||

                    networkResponse.status !==
                        200 ||

                    networkResponse.type !==
                        "basic"

                ) {

                    return networkResponse;

                }


                const responseClone =
                    networkResponse.clone();


                caches.open(
                    CACHE_NAME
                )
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
