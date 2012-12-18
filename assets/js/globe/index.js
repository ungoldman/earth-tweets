//= require third-party/Three/Three
//= require third-party/Three/RequestAnimationFrame
//= require third-party/Three/Detector
//= require third-party/Three/PatchSphereGeometry
//= require third-party/Tween
//= require globe

/* Code below borrowed from http://www.clicktorelease.com/code/weather/ */
/* original author: Jaume Sánchez (@thespite) */
/* modifications by: Nate Goldman (@n8ji) */

var currentGoogleMapsVersion=122;
var mapZoom = 4;
// var showInfo = true;
// var fetchCapitals = true;
var mapCanvas = document.createElement( 'canvas' );
var mapCtx = mapCanvas.getContext( '2d' );

var tilesToLoad, tilesLoaded = 0;

if(!Detector.webgl){
  Detector.addGetWebGLMessage();
} else {

  // el = document.getElementById( 'searchButton' );
  // el.addEventListener( 'click', function( event ) {
  //   event.preventDefault();
  //   findAddress( document.getElementById("address").value, true );
  // }, false );

  // el = document.getElementById( 'snapButton' );
  // el.addEventListener( 'click', function( event ) {
  //   event.preventDefault();
  //   globe.takeSnapshot();
  // }, false );

  // el = document.getElementById( 'iconsButton' );
  // el.addEventListener( 'click', function( event ) {
  //   event.preventDefault();
  //   fetchCapitals = !fetchCapitals;
  //   globe.toggleIcons();
  //   if( fetchCapitals ) fetchCapital();
  // }, false );

  // function lockPointer () {
  //   if( navigator.pointer ) {
  //     navigator.pointer.lock( container, function() {
  //       console.log( 'Pointer locked' );
  //     }, function() {
  //       console.log( 'No pointer lock' );
  //     } );
  //   }
  // }

  // var el = document.getElementById( 'fullscreenButton' );
  // if( el ) {
  //   el.addEventListener( 'click', function( e ) {
  //     container.onwebkitfullscreenchange = function(e) {
  //       lockPointer();
  //       container.onwebkitfullscreenchange = function() {
  //       };
  //     };
  //     container.onmozfullscreenchange = function(e) {
  //       lockPointer();
  //       container.onmozfullscreenchange = function() {
  //       };
  //     };
  //     if( container.webkitRequestFullScreen ) container.webkitRequestFullScreen();
  //     if( container.mozRequestFullScreen ) container.mozRequestFullScreen();
  //     e.preventDefault();
  //   }, false );
  // }

  // el = document.getElementById( 'toggleInfoButton' );
  // el.addEventListener( 'click', function( event ) {
  //   event.preventDefault();
  //   var title = document.getElementById( 'title' );
  //   var text = document.getElementById( 'text' );
  //   showInfo = !showInfo
  //   if( showInfo ) {
  //     title.style.opacity = 1;
  //     text.style.opacity = 1;
  //   } else {
  //     title.style.opacity = 0;
  //     text.style.opacity = 0;
  //   }
  // }, false );

  var container = document.getElementById('container');
  var globe = new DAT.Globe(container);

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

  globe.texture.needsUpdate = true;

  var url = 'http://mt1.google.com/vt/lyrs=weather_nolabels,weather_0cloud&hl=en&x=' + x + '&y=' + y + '&z=' + z + '&s=G';

  var img = new Image();
  img.crossOrigin = '';
  img.onload = function(){ composeWeatherTile( x, y, z, img ); };
  img.src = url;

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

function addTweet(tweet, panTo) {
  if(panTo) globe.moveTo(tweet.geo[0], tweet.geo[1]);
  globe.addSprite('twitter-icon', tweet.geo[0], tweet.geo[1], panTo);
}
