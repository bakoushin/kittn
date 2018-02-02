let express = require('express'); 
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let fetch = require('node-fetch');

const KEY = process.env.KEY;

io.on('connection', function(socket){
  getKitten()
    .then(data => io.emit('new kitten', data))
    .catch(err => console.log(err));
  let emitInterval = setInterval(() => {
    getKitten()
      .then(data => io.emit('new kitten', data))
      .catch(err => console.log(err));
  }, 60 * 1000);
  socket.on('disconnect', function(){
    clearInterval(emitInterval);
  });
});

function getKitten() {
  let url = 'https://api.unsplash.com/photos/random?orientation=landscape&query=kitten';
  return fetch(url, {
    headers: {
      'Authorization': `Client-ID ${KEY}`
    }
  }).then(res => res.json())
  .then(data => {
    let unsplashUTM = '?utm_source=kittn&utm_medium=referral&utm_campaign=api-credit';
    let imageData = {
      id: getRandomId(),
      time: new Date,
      url: data.urls.small + unsplashUTM,
      author: {
        name: data.user.name,
        url: data.user.links.html + unsplashUTM
      }
    };
    return imageData;
  });
}

app.use(express.static('public'));

// app.get("/", function (request, response) {
//   response.sendFile(__dirname + '/views/index.html');
// });

let listener = http.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

function getRandomId() {
  return Math.floor((Math.random() * 10e6)).toString(16);
}
