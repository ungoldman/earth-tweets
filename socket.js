var stream,
    socketio = require('socket.io'),
    Twit = require('twit'),
    T = new Twit({
      consumer_key:         process.env.EARTH_TWEETS_CONSUMER_KEY,
      consumer_secret:      process.env.EARTH_TWEETS_CONSUMER_SECRET,
      access_token:         process.env.EARTH_TWEETS_ACCESS_TOKEN,
      access_token_secret:  process.env.EARTH_TWEETS_ACCESS_TOKEN_SECRET
    })

function configureSocket(io) {
  if (process.env.LONG_POLLING_REQUIRED) {
    io.configure(function(){
      io.set("transports", ["xhr-polling"])
      io.set("polling duration", 10)
    })
  }
}

function waitForConnection(io) {
  console.log('[√] socket.io server ready')

  io.on('connection', function(socket){
    readyStream(io, socket)

    socket.on('disconnect', function(){
      stopStream(socket)
    })
  })
}

function readyStream(io, socket) {
  socket.emit('msg', 'ready to stream')

  socket.on('start', function(data){
    startStream(socket, data)
  })

  socket.on('stop', function(){
    stopStream(socket)
  })
}

function startStream(socket, data) {
  if (data && data.term) {
    console.log('filtering by search term: "' + data.term + '"')
    stream = T.stream('statuses/filter', { track: data.term })
  }

  else {
    stream = T.stream('statuses/sample')
  }

  socket.emit('msg', 'starting stream')

  stream.on('tweet', function (tweet){
    if (tweet.geo) {
      socket.emit('tweet', {
        'text': tweet.text,
        name: tweet.user.screen_name,
        geo: tweet.geo.coordinates,
        type: 'geo'
      })
    }

    else if (tweet.coordinates && tweet.coordinates.type == 'Point') {
      socket.emit('tweet', {
        'text': tweet.text,
        name: tweet.user.screen_name,
        geo: tweet.coordinates.coordinates,
        type: 'point'
      })
    }

    else if (tweet.place && tweet.place.bounding_box.type == 'Polygon') {
      socket.emit('tweet', {
        'text': tweet.text,
        name: tweet.user.screen_name,
        geo: tweet.place.bounding_box.coordinates[0][0],
        type: 'polygon'
      })
    }
  })
}

function stopStream(socket) {
  if (stream && stream.stop) stream.stop()
  socket.emit('msg', 'stream stopped')
}

module.exports = {
  listen: function(server) {
    var io = socketio.listen(server, { 'log level': 1 })

    configureSocket(io)

    return waitForConnection(io)
  }
}
