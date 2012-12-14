var socketio = require('socket.io')
  , Twit = require('twit')
  , T = new Twit({
    consumer_key:         'gQhZN5SsdN5ixIjqgNu9A'
  , consumer_secret:      'VnVRrrBZPUKCGTMcSSPqmD9Q4kvdrLj735bvxi3n0'
  , access_token:         '20834739-igfIloARwwoA1RcJFOGwRdhtB6KlDJYSCUHrQ1voB'
  , access_token_secret:  'uVS5iK2bhyIfnvpiC50yDyGYgVpNO5VRqDvh3RH9Ws'
});

var stream;

function readyStream(io, socket){
  socket.emit('msg','ready to stream');
  socket.on('start', function(){
    startStream(socket);
  });
  socket.on('stop', function(){
    stopStream(socket);
  });
}

function startStream(socket){
  stream = T.stream('statuses/sample');
  socket.emit('msg','starting stream');

  stream.on('tweet', function (tweet) {
    if (tweet.geo) socket.emit('tweet', tweet);
  });
}

function stopStream(socket){
  if (stream && stream.stop) stream.stop();
  socket.emit('msg','stream stopped');
}

function connect(io) {
  io.on('connection', function(socket) {
    readyStream(io, socket);
    socket.on('disconnect', function() {
      stopStream(socket);
    });
  });
}

module.exports = {
  listen: function(server) {
    var io = socketio.listen(server, { "log level": 1 });

    if(process.env.LONG_POLLING_REQUIRED){
      io.configure(function () {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
      });
    }

    return connect(io);
  }
};
