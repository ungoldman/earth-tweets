//= require globe/index
//= require lib/jquery
//= require lib/bootstrap
//= require lib/ui

window.log = function(){
  log.history = log.history || []
  log.history.push(arguments)
  if (this.console) console.log(Array.prototype.slice.call(arguments))
}

;(function(window,$){

  var socket = io.connect(window.location.hostname)

  function init(){
    var panning  = true,
        running  = false,
        $panning = $('#toggle-panning'),
        $stream  = $('#toggle-stream')

    socket.on('msg', function(msg){ log(msg) })

    socket.on('tweet', function(tweet){
      addTweet(tweet, panning)

      ui.notify(tweet.name, tweet.text)
        .closable()
        .hide(6000)
        .effect('slide')
    })

    $stream.click(function(e){
      e.preventDefault()

      if (running) {
        socket.emit('stop')

        $stream.html('<i class="icon-play icon-white"></i> Start streaming live data')
        $panning.attr('disabled', 'disabled')
      }

      else {
        socket.emit('start')

        $stream.html('<i class="icon-stop icon-white"></i> Stop streaming live data')
        $panning.removeAttr('disabled')
      }

      running = !running
    })

    $panning.click(function(e){
      e.preventDefault()

      if (panning) {
        $panning.html('<i class="icon-map-marker icon-white"></i> Pan to tweets')
      }

      else {
        $panning.html('<i class="icon-map-marker icon-white"></i> Stop panning to tweets')
      }

      panning = !panning
    })
  }

  $(init)

})(window,jQuery)
