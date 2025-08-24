// Optional runtime helper to listen for service worker updates
export function listenForSWUpdates(callback) {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    if (!reg || !reg.update) return;
    // Periodically check for updates
    setInterval(() => reg.update(), 60 * 60 * 1000);
    // Listen for new worker
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            callback && callback();
          }
        });
      }
    });
  });
}
