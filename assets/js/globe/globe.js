/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, colorFn) {

  colorFn = colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSV( ( 0.6 - ( x * 0.5 ) ), 1.0, 1.0 );
    return c;
  };

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: 0, texture: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, sceneAtmosphere, renderer, w, h;
  var iconScene, showIcons = true;
  var vector, worldMesh, mesh, atmosphere, point;

  var overRenderer;

  var imgDir = '';

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 };
  var target = { x: Math.PI*3/2, y: Math.PI / 6.0 };
  var targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  var texture;

  function init() {

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera( 30, w / h, 1, 10000);
    camera.position.z = distance;
    camera.target = new THREE.Vector3( 0, 0, 0 );

    vector = new THREE.Vector3();

    scene = new THREE.Scene();
    sceneAtmosphere = new THREE.Scene();
    iconScene = new THREE.Scene();
    scene.add( camera );

    var geometry = new THREE.PatchSphereGeometry(200, 40, 30 );
    //, 0, 2 * Math.PI, -Math.PI / 2, Math.PI );

    for ( var i = 0, l = geometry.faceVertexUvs[ 0 ].length; i < l; i ++ ) {

      for ( var j = 0, jl = geometry.faceVertexUvs[ 0 ][ i ].length; j < jl; j ++ ) {

        var uv = geometry.faceVertexUvs[ 0 ][ i ][ j ];

        var a = uv.v * Math.PI - Math.PI / 2;
        a = Math.sin(a);
        uv.v = 0.5 - Math.log( ( 1 + a ) / ( 1 - a ) ) / ( 4 * Math.PI );
        uv.v = 1 - uv.v;

      }

    }

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    texture = new THREE.Texture( mapCanvas );
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearMipMapLinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;

    uniforms['texture'].texture = texture;

    material = new THREE.ShaderMaterial({

      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader

    });

    worldMesh = new THREE.Mesh(geometry, material);
    worldMesh.rotation.y += Math.PI / 2;
    worldMesh.matrixAutoUpdate = false;
    worldMesh.updateMatrix();
    scene.add(worldMesh);

    geometry = new THREE.SphereGeometry(200, 40, 30 );

    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({

      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader

    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
    mesh.flipSided = true;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    sceneAtmosphere.add(mesh);

    geometry = new THREE.CubeGeometry(0.75, 0.75, 1, 1, 1, 1, null, false, { px: true,
          nx: true, py: true, ny: true, pz: false, nz: true});

    for (var i = 0; i < geometry.vertices.length; i++) {

      var vertex = geometry.vertices[i];
      vertex.position.z += 0.5;

    }

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true });
    renderer.autoClear = false;
    renderer.setClearColorHex(0x000000, 0.0);
    renderer.setSize(w, h);
    renderer.sortObjects = true

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }

  function addData(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude'; // other option is 'legend'
    if (opts.format === 'magnitude') {
      step = 3;
      colorFnWrapper = function(data, i) { return colorFn(data[i+2]); }
    } else if (opts.format === 'legend') {
      step = 4;
      colorFnWrapper = function(data, i) { return colorFn(data[i+3]); }
    } else {
      throw('error: format not supported: '+opts.format);
    }

    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += step) {
          lat = data[i];
          lng = data[i + 1];
          // size = data[i + 2];
          color = colorFnWrapper(data,i);
          size = 0;
          addPoint(lat, lng, size, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget'+this._morphTargetId;
    }
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat = data[i];
      lng = data[i + 1];
      color = colorFnWrapper(data,i);
      size = data[i + 2];
      size = size*200;
      addPoint(lat, lng, size, color, subgeo);
    }
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }
  }

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          var padding = 8-this._baseGeometry.morphTargets.length;
          for(var i=0; i<=padding; i++) {
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true
            }));
      }
      scene.add(this.points);
    }
  }

  function addPoint(lat, lng, size, color, subgeo) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 200 * Math.cos(phi);
    point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

    point.lookAt(worldMesh.position);

    point.scale.z = -size;
    point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {
      point.geometry.faces[i].color = color;
    }

    GeometryUtils.merge(subgeo, point);
  }

  function onMouseDown(event) {

    var el = document.querySelectorAll( '.hide' );

    for( var j = 0; j < el.length; j++ ) {
      el[ j ].style.opacity = 0;
      el[ j ].style.pointerEvents = 'none';
    }
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    var el = document.querySelectorAll( '.hide' );
    for( var j = 0; j < el.length; j++ ) {
      el[ j ].style.opacity = 1;
      el[ j ].style.pointerEvents = 'auto';
    }
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1100 ? 1100 : distanceTarget;
    distanceTarget = distanceTarget < 300 ? 300 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
    camera.lookAt( camera.target );

    vector.copy(camera.position);

    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(sceneAtmosphere, camera);
    if (showIcons) renderer.render(iconScene, camera);
  }

  init();
  this.animate = animate;


  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
  return;
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  function moveToPoint( lat, lng ) {

    var phi = lat * Math.PI / 180;
    var theta = lng * Math.PI / 180;

    target.x = - Math.PI / 2 + theta;
    target.y = phi;
  }

  function addSprite( id, lat, lng, panTo ) {

    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    var r = 210;

    var x = r * Math.sin(phi) * Math.cos(theta);
    var y = r * Math.cos(phi);
    var z = r * Math.sin(phi) * Math.sin(theta);

    id = id.trim();
    if( id != '' ) {
      sprite = new THREE.Sprite( {
        map: THREE.ImageUtils.loadTexture('/img/' + id + '.png'),
        useScreenCoordinates: false,
        affectedByDistance: false
      } );
      sprite.opacity = 1;
      // sprite.scale.x = sprite.scale.y = sprite.scale.z = 0;
      /*var opacityTween = new TWEEN
        .Tween( sprite )
        .easing(TWEEN.Easing.Elastic.EaseInOut)
        .to( { opacity: 1 }, 500)
        .start();*/
      var sizeTween = new TWEEN
        .Tween( sprite.scale )
        .easing(TWEEN.Easing.Back.EaseOut)
        .to( { x: 1, y: 1, z: 1 }, 500)
        .start();
      sprite.position.set( x, y, z );
      //sprite.scale.x = sprite.scale.y = sprite.scale.z = .95;
      iconScene.add( sprite );
    }
  }

  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;
  this.texture = texture;
  this.moveTo = moveToPoint;
  this.addSprite = addSprite;
  this.takeSnapshot = takeSnapshot;
  this.toggleIcons = toggleIcons;

  function takeSnapshot(){
    var data = renderer.domElement.toDataURL();
    window.open( data, 'WebGL Weather' );
  }

  function toggleIcons() {
    showIcons = !showIcons;
  }

  return this;

};

THREE.MercatorSphere = function ( radius, segmentsWidth, segmentsHeight ) {

  THREE.Geometry.call( this );

  var radius = radius || 50,
  gridX = segmentsWidth || 8,
  gridY = segmentsHeight || 6;

  var i, j, pi = Math.PI;
  var iHor = Math.max( 3, gridX );
  var iVer = Math.max( 2, gridY );
  var aVtc = [];

  for ( j = 0; j < ( iVer + 1 ) ; j++ ) {

    var fRad1 = j / iVer;
    var fZ = radius * Math.cos( fRad1 * pi );
    var fRds = radius * Math.sin( fRad1 * pi );
    var aRow = [];
    var oVtx = 0;

    for ( i = 0; i < iHor; i++ ) {

      var fRad2 = 2 * i / iHor;
      var fX = fRds * Math.sin( fRad2 * pi );
      var fY = fRds * Math.cos( fRad2 * pi );

      if ( !( ( j == 0 || j == iVer ) && i > 0 ) ) {

        oVtx = this.vertices.push( new THREE.Vertex( new THREE.Vector3( fY, fZ, fX ) ) ) - 1;

      }

      aRow.push( oVtx );

    }

    aVtc.push( aRow );

  }

  var n1, n2, n3, iVerNum = aVtc.length;

  for ( j = 0; j < iVerNum; j++ ) {

    var iHorNum = aVtc[ j ].length;

    if ( j > 0 ) {

      for ( i = 0; i < iHorNum; i++ ) {

        var bEnd = i == ( iHorNum - 1 );
        var aP1 = aVtc[ j ][ bEnd ? 0 : i + 1 ];
        var aP2 = aVtc[ j ][ ( bEnd ? iHorNum - 1 : i ) ];
        var aP3 = aVtc[ j - 1 ][ ( bEnd ? iHorNum - 1 : i ) ];
        var aP4 = aVtc[ j - 1 ][ bEnd ? 0 : i + 1 ];

        var fJ0 = j / ( iVerNum - 1 );
        var fJ1 = ( j - 1 ) / ( iVerNum - 1 );
        var fI0 = ( i + 1 ) / iHorNum;
        var fI1 = i / iHorNum;

        var theta;
        var max = 45.501 * Math.PI / 180;

        theta = ( ( j / iVerNum ) * Math.PI - Math.PI / 2 );
        theta = theta.clamp( -max, max );
        fJ0 = 1 - lat2v( theta );
        theta = ( ( ( j - 1 ) / iVerNum ) * Math.PI - Math.PI / 2 );
        theta = theta.clamp( -max, max );
        fJ1 = 1 - lat2v( theta );

        var aP1uv = new THREE.UV( 1 - fI0, fJ0 );
        var aP2uv = new THREE.UV( 1 - fI1, fJ0 );
        var aP3uv = new THREE.UV( 1 - fI1, fJ1 );
        var aP4uv = new THREE.UV( 1 - fI0, fJ1 );

        if ( j < ( aVtc.length - 1 ) ) {

          n1 = this.vertices[ aP1 ].position.clone();
          n2 = this.vertices[ aP2 ].position.clone();
          n3 = this.vertices[ aP3 ].position.clone();
          n1.normalize();
          n2.normalize();
          n3.normalize();

          this.faces.push( new THREE.Face3( aP1, aP2, aP3, [ new THREE.Vector3( n1.x, n1.y, n1.z ), new THREE.Vector3( n2.x, n2.y, n2.z ), new THREE.Vector3( n3.x, n3.y, n3.z ) ] ) );

          this.faceVertexUvs[ 0 ].push( [ aP1uv, aP2uv, aP3uv ] );

        }

        if ( j > 1 ) {

          n1 = this.vertices[aP1].position.clone();
          n2 = this.vertices[aP3].position.clone();
          n3 = this.vertices[aP4].position.clone();
          n1.normalize();
          n2.normalize();
          n3.normalize();

          this.faces.push( new THREE.Face3( aP1, aP3, aP4, [ new THREE.Vector3( n1.x, n1.y, n1.z ), new THREE.Vector3( n2.x, n2.y, n2.z ), new THREE.Vector3( n3.x, n3.y, n3.z ) ] ) );

          this.faceVertexUvs[ 0 ].push( [ aP1uv, aP3uv, aP4uv ] );

        }

      }
    }
  }

  this.computeCentroids();
  this.computeFaceNormals();
  this.computeVertexNormals();

  this.boundingSphere = { radius: radius };

};

THREE.MercatorSphere.prototype = new THREE.Geometry();
THREE.MercatorSphere.prototype.constructor = THREE.MercatorSphere;

Math.sec = function(){
  return 1 / Math.cos(this);
};

function y2lat(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2); }
function lat2y(a) { return 180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2)); }

function lat2v(a){
  a=Math.sin(a);
  return 0.5-Math.log((1+a)/(1-a))/(4*Math.PI)
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

String.prototype.trim = function() {
  var str = this.replace(/^\s*([\S\s]*)\b\s*$/, '$1');
  return str.replace(/(\r\n|\n|\r)/gm,"");
}
