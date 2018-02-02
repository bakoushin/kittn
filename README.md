Kittn — offline first kitten experience
=======================================

Kittn is a small offline first application intended to play around with [ServiceWorker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

The core idea is similar to [wittr](https://github.com/jakearchibald/wittr), but instead of nonsense text and images, it shows photos of cute cats — one cat in minute.

Photos are provided by the great [Unsplash](https://unsplash.com) API.

Under the hood
--------------

Once user opens the site kittn.glitch.me, the ServiceWorker is installed, if supported by the browser. It immediately takes over via `clients.claim()`, so all dynamic requests will be cached.

All static assets like styles, scripts, static images and fonts are cached during installation of service worker.

Unlike wittr, Kittn doesn't load with prefilled content. Instead, it behaves like native app: first loads the static skeleton, then all content is fetched dynamically.

After the service worker comes into active state, Kittn starts filling the feed with cat photos. New cat apperas every single minute. 

All data fetched by dynamic request is stored locally via Cache storage and IndexedDB, so if user goes offline or simly refreshes the page, last 30 cats still available in the feed.

If the browser is not supporting ServiceWorker, Kittn behaves like regular site: the cats still filling the feed, but offline or after page refresh they all are gone.

What is Glitch?
---------------

Glitch is a great place to play around with web development. You can create a full functioning app using Node.js as a backend. It will be instantly deployed and available on the web. An app can be created from scratch or via remixing one.

You are welcome to fork and remix Kittn as well as many other apps on Glitch.

Glitch supports node modules, https, and even GitHub repos.

Find out more [about Glitch](https://glitch.com/about).
