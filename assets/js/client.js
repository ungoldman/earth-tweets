//= require globe/index
//= require lib/jquery
//= require lib/bootstrap
//= require lib/ui

window.log = function(){
  log.history = log.history || [];
  log.history.push(arguments);
  if(this.console) console.log(Array.prototype.slice.call(arguments));
};

var socket = io.connect(window.location.hostname);

(function(window,$){

  function init(){
    var panning = true;
    var running = false;

    socket.on('msg', function(msg){
      log(msg);
    })

    socket.on('tweet', function(tweet){
      addTweet(tweet, panning);
      ui.notify(tweet.name, tweet.text)
        .hide(8000)
        .effect('slide');
    });

    $('#toggle-stream').click(function(e){
      e.preventDefault();

      if (running) {
        $(this).html('<i class="icon-play icon-white"></i> Start streaming live data');
        socket.emit('stop');
      }
      else {
        $(this).html('<i class="icon-stop icon-white"></i> Stop streaming live data');
        socket.emit('start');
      }

      running = !running;
    });

    $('#toggle-panning').click(function(e){
      e.preventDefault();

      if (panning) {
        $(this).html('<i class="icon-map-marker icon-white"></i> Pan to tweets');
      }
      else {
        $(this).html('<i class="icon-map-marker icon-white"></i> Stop panning to tweets');
      }

      panning = !panning;
    });
  }

  $(init);

})(window,jQuery);
