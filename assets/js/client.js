//= require globe/index
//= require lib/jquery
//= require lib/bootstrap
//= require lib/ui

var socket = io.connect(window.location.hostname);

(function(window,$){

  function init(){
    var panning = true;
    var running = false;

    socket.on('msg', function(msg){
      console.log(msg);
    })

    socket.on('tweet', function(tweet){
      console.log(tweet);
      addTweet(tweet, panning);
      ui.notify(tweet.user.screen_name, tweet.text)
        .hide(8000)
        .effect('slide');
    });

    $('#toggle-stream').click(function(e){
      e.preventDefault();
      console.log('toggling stream');

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
      console.log('toggling panning');

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
