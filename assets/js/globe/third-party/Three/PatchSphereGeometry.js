/**
 * @author mr.doob / http://mrdoob.com/
 */

THREE.PatchSphereGeometry = function ( radius, segmentsWidth, segmentsHeight, thetaStart, thetaLength, phiStart, phiLength ) {

  THREE.Geometry.call( this );

  var radius = radius || 50;
  var segmentsX = segmentsWidth || 8;
  var segmentsY = segmentsHeight || 6;

  var thetaStart = thetaStart != undefined ? thetaStart : 0;
  var thetaLength = thetaLength != undefined ? thetaLength : Math.PI * 2;

  var phiStart = phiStart != undefined ? phiStart : - Math.PI / 2;
  var phiLength = phiLength != undefined ? phiLength : Math.PI;

  if ( phiStart < - Math.PI / 2 ) phiStart = - Math.PI / 2;
  if ( phiStart + phiLength > Math.PI / 2 ) phiLength = Math.PI / 2 - phiStart;

  var x, y, vertices = [], uvs = [];

  for ( y = 0; y <= segmentsY; y ++ ) {

    var verticesRow = [];
    var uvsRow = [];

    for ( x = 0; x <= segmentsX; x ++ ) {

      var u = x / segmentsX;
      var v = y / segmentsY;

      var xpos = radius * Math.sin( thetaStart + u * thetaLength ) * Math.cos( phiStart + v * phiLength );
      var ypos = - radius * Math.sin( phiStart + v * phiLength );
      var zpos = radius * Math.cos( thetaStart + u * thetaLength ) * Math.cos( phiStart + v * phiLength );

      this.vertices.push( new THREE.Vertex( new THREE.Vector3( xpos, ypos, zpos ) ) );

      verticesRow.push( this.vertices.length - 1 );
      uvsRow.push( new THREE.UV( u, v ) );

    }

    vertices.push( verticesRow );
    uvs.push( uvsRow );

  }

  for ( y = 0; y < segmentsY; y ++ ) {

    for ( x = 0; x < segmentsX; x ++ ) {

      var v1 = vertices[ y ][ x ];
      var v2 = vertices[ y + 1 ][ x ];
      var v3 = vertices[ y + 1 ][ x + 1 ];
      var v4 = vertices[ y ][ x + 1 ];

      var n1 = this.vertices[ v1 ].position.clone().normalize();
      var n2 = this.vertices[ v2 ].position.clone().normalize();
      var n3 = this.vertices[ v3 ].position.clone().normalize();
      var n4 = this.vertices[ v4 ].position.clone().normalize();

      var uv1 = uvs[ y ][ x ];
      var uv2 = uvs[ y + 1 ][ x ];
      var uv3 = uvs[ y + 1 ][ x + 1 ];
      var uv4 = uvs[ y ][ x + 1 ];

      this.faces.push( new THREE.Face4( v1, v2, v3, v4, [ n1, n2, n3, n4 ] ) );
      this.faceVertexUvs[ 0 ].push( [ uv1.clone(), uv2.clone(), uv3.clone(), uv4.clone() ] );

    }

  }

  this.computeCentroids();
  this.computeFaceNormals();

  this.boundingSphere = { radius: radius };

};

THREE.PatchSphereGeometry.prototype = new THREE.Geometry();
THREE.PatchSphereGeometry.prototype.constructor = THREE.PatchSphereGeometry;
