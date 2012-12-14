//= require globe/globe

var socket = io.connect(window.location.hostname);
var globeReady = false;
var globeRunning = false;


/*
27/08/2011 Added node.js script to cache weather conditions
28/08/2011 Added full CORS support, snapshot option
29/08/2011 Added preload to tiles, option to toggle icons, option to toggle info
30/08/2001 Fixed mapping, latlng is now accurate (woo-hoo!)
*/

var mapZoom = 3;
var showInfo = true;
var fetchCapitals = true;
var mapCanvas = document.createElement( 'canvas' );
var mapCtx = mapCanvas.getContext( '2d' );
var capitals = ['kabul', 'tirane', 'algiers', 'andorra la vella', 'luanda', 'saint john\'s', 'buenos aires', 'yerevan', 'canberra', 'vienna', 'baku', 'nassau', 'manama', 'dhaka', 'bridgetown', 'minsk', 'brussels', 'belmopan', 'porto-novo', 'thimphu', 'la paz', 'sarajevo', 'gaborone', 'brasilia', 'bandar seri begawan', 'sofia', 'ougadougou', 'bujumbura', 'phnom penh', 'yaounde', 'ottawa', 'praia', 'bangui', 'n\'djamena', 'santiago', 'beijing', 'bogota', 'moroni', 'brazzaville', 'kinshasa', 'san jose', 'yamoussoukro', 'zagreb', 'havana', 'nicosia', 'prague', 'copenhagen', 'djibouti', 'roseau', 'santo domingo', 'dili', 'quito', 'cairo', 'san salvador', 'malabo', 'asmara', 'tallinn', 'addis ababa', 'suva', 'helsinki', 'paris', 'libreville', 'banjul', 'tbilisi', 'berlin', 'accra', 'athens', 'saint george\'s', 'guatemala city', 'conakry', 'bissau', 'georgetown', 'port-au-prince', 'tegucigalpa', 'budapest', 'reykjavik', 'new delhi', 'jakarta', 'tehran', 'baghdad', 'dublin', 'jerusalem', 'rome', 'kingston', 'tokyo', 'amman', 'astana', 'nairobi', 'tarawa atoll', 'pyonyang', 'seoul', 'pristina', 'kuwait city', 'bishkek', 'vientiane', 'riga', 'beirut', 'maseru', 'monrovia', 'tripoli', 'vaduz', 'vilnius', 'luxembourg', 'skopje', 'antananarivo', 'lilongwe', 'kuala lumpur', 'male', 'bamako', 'valletta', 'majuro', 'nouakchott', 'port louis', 'mexico city', 'palikir', 'chisinau', 'monaco', 'ulaanbaatar', 'podgorica', 'rabat', 'maputo', 'rangoon', 'windhoek', 'kathmandu', 'amsterdam', 'wellington', 'managua', 'niamey', 'abuja', 'oslo', 'muscat', 'islamabad', 'melekeok', 'panama city', 'port moresby', 'asuncion', 'lima', 'manila', 'warsaw', 'lisbon', 'doha', 'bucharest', 'moscow', 'kigali', 'basseterre', 'castries', 'kingstown', 'apia', 'san marino', 'sao tome', 'riyadh', 'dakar', 'belgrade', 'victoria', 'freetown', 'singapore', 'bratislava', 'ljubljana', 'honiara', 'mogadishu', 'cape town', 'juba', 'madrid', 'colombo', 'khartoum', 'paramaribo', 'mbabane', 'stockholm', 'bern', 'damascus', 'taipei', 'dushanbe', 'dar es salaam', 'bangkok', 'lome', 'nuku\'alofa', 'port-of-spain', 'tunis', 'ankara', 'ashgabat', 'vaiaku village', 'kampala', 'kyiv', 'abu dhabi', 'london', 'washington d.c.', 'montevideo', 'tashkent', 'port-vila', 'vatican city', 'caracas', 'hanoi', 'sanaa', 'lusaka', 'harare'  ];
var currentCapital = 0;

var geocoder;
geocoder = new google.maps.Geocoder();
var tilesToLoad, tilesLoaded = 0;

if(!Detector.webgl){
  Detector.addGetWebGLMessage();
} else {

  var links = document.querySelectorAll( 'a[rel=external]' );
  for( var j = 0; j < links.length; j++ ) {
    var a = links[ j ];
    a.addEventListener( 'click', function( e ) {
      window.open( this.href, '_blank' );
      e.preventDefault();
    }, false );
  }

  el = document.getElementById( 'searchButton' );
  el.addEventListener( 'click', function( event ) {
    event.preventDefault();
    findAddress( document.getElementById("address").value, true );
  }, false );

  el = document.getElementById( 'snapButton' );
  el.addEventListener( 'click', function( event ) {
    event.preventDefault();
    globe.takeSnapshot();
  }, false );

  el = document.getElementById( 'iconsButton' );
  el.addEventListener( 'click', function( event ) {
    event.preventDefault();
    fetchCapitals = !fetchCapitals;
    globe.toggleIcons();
    if( fetchCapitals ) fetchCapital();
  }, false );

  function lockPointer () {
    if( navigator.pointer ) {
      navigator.pointer.lock( container, function() {
        console.log( 'Pointer locked' );
      }, function() {
        console.log( 'No pointer lock' );
      } );
    }
  }

  var el = document.getElementById( 'fullscreenButton' );
  if( el ) {
    el.addEventListener( 'click', function( e ) {
      container.onwebkitfullscreenchange = function(e) {
        lockPointer();
        container.onwebkitfullscreenchange = function() {
        };
      };
      container.onmozfullscreenchange = function(e) {
        lockPointer();
        container.onmozfullscreenchange = function() {
        };
      };
      if( container.webkitRequestFullScreen ) container.webkitRequestFullScreen();
      if( container.mozRequestFullScreen ) container.mozRequestFullScreen();
      e.preventDefault();
    }, false );
  }

  el = document.getElementById( 'toggleInfoButton' );
  el.addEventListener( 'click', function( event ) {
    event.preventDefault();
    var title = document.getElementById( 'title' );
    var text = document.getElementById( 'text' );
    showInfo = !showInfo
    if( showInfo ) {
      title.style.opacity = 1;
      text.style.opacity = 1;
    } else {
      title.style.opacity = 0;
      text.style.opacity = 0;
    }
  }, false );

  var container = document.getElementById('container');
  var globe = new DAT.Globe(container);
  var i, tweens = [];

  TWEEN.start();

  var tilesX = Math.pow( 2, mapZoom );
  var tilesY = Math.pow( 2, mapZoom );
  mapCanvas.width = 256 * tilesX;
  mapCanvas.height = 256 * tilesY;
  mapCtx.fillStyle = '#000';
  mapCtx.fillRect( 0, 0, mapCanvas.width, mapCanvas.height );
  //document.body.appendChild( mapCanvas );

  tilesToLoad = tilesX * tilesY;

  for( var y = 0; y < tilesY; y++ ) {
    for( var x = 0; x < tilesX; x++ ) {
      fetchTile( x, y, mapZoom );
    }
  }


}

function start() {
  globe.animate();
  fetchCapital();
}

function fetchCapital() {

  if( !fetchCapitals ) return;
  if( currentCapital < capitals.length ) {
    findAddress( capitals[ currentCapital ], false );
    currentCapital++;
    setTimeout( fetchCapital, 1000 );
  }

}

function fetchTile( x, y, z ) {

  var url = 'http://khm1.google.com/kh/v=' + currentGoogleMapsVersion + '&x=' + x + '&y=' + y + '&z=' + z + '&s=Gali&' + Date.now();
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function(){ composeBaseTile( x, y, z, img ); };
  img.src = url;

}

function composeBaseTile( x, y, z, img ) {
  mapCtx.drawImage( img, x * 256, y * 256, 256, 256 );

  /*var c = mapCtx;
  c.strokeStyle = 'rgb( 255, 0, 255 )';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo( x * 256, y * 256 );
  c.lineTo( x * 256 + 256, y * 256 );
  c.lineTo( x * 256 + 256, y * 256 + 256 );
  c.lineTo( x * 256, y * 256 + 256 );
  c.lineTo( x * 256, y * 256 );
  c.stroke();*/

  globe.texture.needsUpdate = true;

  //weather_1cloud = just the border lines
  var url = 'http://mt1.google.com/vt/lyrs=weather_nolabels,weather_0cloud&hl=en&x=' + x + '&y=' + y + '&z=' + z + '&s=G';
  //var url = 'http://mt1.google.com/vt?lyrs=traffic|seconds_into_week:-1&hl=en&x=' + x + '&y=' + y + '&z=' + z + '&style=15';
  var img = new Image();
  img.crossOrigin = '';
  img.onload = function(){ composeWeatherTile( x, y, z, img ); };
  img.src = url;

}

function composeTrafficTile( x, y, z, img ) {

}

function composeWeatherTile( x, y, z, img ) {
  mapCtx.globalCompositeOperation = 'source-over';
  mapCtx.drawImage( img, x * 256, y * 256, 256, 256 );
  mapCtx.globalCompositeOperation = 'source-over';
  globe.texture.needsUpdate = true;
  tilesLoaded++;
  if( tilesLoaded == tilesToLoad ) start();
  return;
  var url = 'http://mt1.google.com/mapslt?lyrs=weather_c_kph|invert:0&x=' + x + '&y=' + y + '&z=' + z + '&w=256&h=256&hl=en';
  var img = new Image();
  img.crossOrigin = '';
  img.onload = function(){ composeIconsTile( x, y, z, img ); };
  img.src = url;
}

function composeIconsTile( x, y, z, img ) {
  mapCtx.globalCompositeOperation = 'source-over';
  mapCtx.drawImage( img, x * 256, y * 256, 256, 256 );
  mapCtx.globalCompositeOperation = 'source-over';
  globe.texture.needsUpdate = true;
}

function findAddress( address, panTo ) {
  //console.log( 'searching address ' + address );
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if( panTo ) globe.moveTo( results[0].geometry.location.lat(), results[0].geometry.location.lng() );

      globe.addSprite( 'sunny', results[0].geometry.location.lat(), results[0].geometry.location.lng(), panTo );
      return;

      var url = 'http://www.clicktorelease.com:8080/' + results[ 0 ].address_components[ 0 ].long_name;
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function (aEvt) {
        if (request.readyState == 4) {
         if(request.status == 200){
          //console.log( address, request.responseText );
           globe.addSprite( request.responseText, results[0].geometry.location.lat(), results[0].geometry.location.lng(), panTo );
         }else{
           console.log( 'Error', request.statusText);
          }
        }
      };
      request.send(null);
      //var conditions = [ 'sunny', 'partly_cloudy', 'mostly_cloudy', 'cloudy', 'fog' ];
       //globe.addSprite( conditions[ Math.round( Math.random() * ( conditions.length - 1 ) ) ], results[0].geometry.location.lat(), results[0].geometry.location.lng(), panTo );
    } else {
      console.log("Geocode was not successful for the following reason: " + status);
    }
  });
}



socket.on('msg', function(msg){
  console.log(msg);
})

socket.on('tweet', function(tweet){
  console.log(tweet.geo.coordinates);
});
