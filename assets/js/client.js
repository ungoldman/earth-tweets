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
        $filter  = $('#filter'),
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

        $filter.removeAttr('disabled')
        $stream.html('<i class="icon-play icon-white"></i> Start streaming live data')
      }

      else {
        if ($filter.val() != '') {
          socket.emit('start', { term: $filter.val() })
        }

        else {
          socket.emit('start')
        }

        $filter.attr('disabled','disabled')
        $stream.html('<i class="icon-stop icon-white"></i> Stop streaming live data')
      }

      running = !running
    })

    $panning.click(function(e){
      panning = !panning
    })
  }

  $(init)

})(window,jQuery)
