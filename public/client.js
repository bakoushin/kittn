'use strict';

const ONE_HOUR = 60 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;

const DB_NAME = 'kittens';

let socket = window.io();
let db = openDatabase();

registerServiceWorker();

document.addEventListener('DOMContentLoaded', event => {

  // clear cached photos
  clearPhotosCache(db);
  setInterval(() => {
      clearPhotosCache(db);
  }, FIVE_MIN);
  
  // restore kittens from cache
  let addStoredKittens = db.then(db => {
    if (!db) return;
    db.transaction(DB_NAME)
      .objectStore(DB_NAME)
      .index('by-date')
      .getAll().then(data => {
        return data.forEach(kitten => {
          addKitten(kitten);
        });
      });  
  });
  
  // listen to new kittens
  addStoredKittens.then(() => {
    startListening();
  });

});

function startListening() {
  socket.on('new kitten', data => {
    db.then(db => {
      if (!db) return;
      let store = db.transaction(DB_NAME, 'readwrite').objectStore(DB_NAME);
      // save kitten
      store.put(data);
      // limit store to 30 kittens
      store.index('by-date').openCursor(null, "prev").then(cursor => {
        return cursor.advance(30);
      }).then(function deleteRest(cursor) {
        if (!cursor) return;
        cursor.delete();
        return cursor.continue().then(deleteRest);
      });
    });
    
    if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
      // if browser supports ServiceWorker and it is not yet installed, wait for install
      navigator.serviceWorker.addEventListener('controllerchange', event => {
        addKitten(data, { animation: true });
      });
    }
    else {
      addKitten(data, { animation: true });
    }
    
  });      
}

function addKitten(data, options = {}) {
  
  let img = document.createElement('img');
  img.src = data.url;
  img.onload = event => {
    // add kitten only when photo is fully loaded
    let author = document.createElement('span');
    author.innerHTML = `Photo by <a href="${data.author.url}">${data.author.name}</a>`;

    let item = document.createElement('li');
    item.style.backgroundImage = `url(${data.url})`;
    item.appendChild(author);

    let list = document.querySelector('ul');
    list.insertAdjacentElement('afterbegin', item);

    if (options.animation) {
      list.classList.add('slide-down');  
      list.addEventListener('animationend', event => {
        if (event.target == list && event.animationName == 'slideDown') {
          list.classList.remove('slide-down');
        }
      });
    }
    
    event.target.remove();
  };
}

/*
INDEXED DB
*/

function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return window.idb.open(DB_NAME, 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore(DB_NAME, {
      keyPath: 'id'
    });
    store.createIndex('by-date', 'time');
  });
}

function clearPhotosCache() {

  return db.then(db => {
    if (!db) return;

    var imagesNeeded = [];

    return db.transaction(DB_NAME).objectStore(DB_NAME).getAll().then(data => {
      data.forEach(kitten => {
        imagesNeeded.push(new URL(kitten.url).pathname);
      });
      return caches.open('kittn-content-imgs');
    }).then(cache => {
      return cache.keys().then(requests => {
        requests.forEach(request => {
          let pathname = new URL(request.url).pathname;
          if (!imagesNeeded.includes(pathname)) cache.delete(request);
        });
      });
    });
  });
  
}

/*
SERVICE WORKER
*/

function registerServiceWorker() {

  if (!navigator.serviceWorker) {
    return;
  }

  window.addEventListener('load', function() {
    
    navigator.serviceWorker.register('/sw.js').then(reg => {

      setInterval(() => {
        reg.update();
      }, ONE_HOUR);

      if (!navigator.serviceWorker.controller) {
        return;
      }

      if (reg.waiting) {
        serviceWorkerUpdateReady(reg.waiting);
        return;
      }

      if (reg.installing) {
        trackServiceWorkerInstalling(reg.installing);
        return;
      }

      reg.addEventListener('updatefound', () => {
        trackServiceWorkerInstalling(reg.installing);
        return;
      });

    }).catch(err => {
      console.log(err);
    });

  });
  
}

function trackServiceWorkerInstalling(serviceWorker) {
  serviceWorker.addEventListener('statechange', () => {
    if (serviceWorker.state == 'installed') {
      serviceWorkerUpdateReady(serviceWorker);
    }
  });
}

function serviceWorkerUpdateReady(serviceWorker) {
  let notification = document.querySelector('.notification');
  let updateButton = notification.querySelector('.notification__update-button');
  let postponeButton = notification.querySelector('.notification__postpone-button');
  notification.classList.add('notification--visible');
  updateButton.addEventListener('click', event => {
    serviceWorker.postMessage({ action: 'skipWaiting' });
  });
  postponeButton.addEventListener('click', event => {
    notification.classList.remove('notification--visible');
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
