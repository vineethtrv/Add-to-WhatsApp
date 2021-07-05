
// Install service worker
self.addEventListener('install' , e => {
    e.waitUntil(
        caches.open('static').then(cache => {
            return cache.addAll([
                './' , 
                './styles.css' , 
                './app.js' , 
                './images/android-chrome-192x192.png' 
            ])
        })
    )
});

// fetch
self.addEventListener('fetch', e => {
    console.log('Intercepting fetch request ', e.request.url)
})


