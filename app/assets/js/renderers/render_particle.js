var SCENE_WIDTH = SCENE_HEIGHT = 500;
var NUM_PARTICLES = 100;

// create a canvas and a renderer, then append to document
var canvas = document.getElementById("three_particle");
var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true}); // use webgl renderer (GPU!)
renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT); // Resizes the output canvas to (width, height), and also sets the viewport to fit that size, starting in (0, 0).
document.body.appendChild(renderer.domElement); // attach renderer to canvas

// scene - where we put our models
var scene = new THREE.Scene();

// camera - how we look at our scene
var camera = new THREE.PerspectiveCamera( 45, SCENE_WIDTH / SCENE_HEIGHT, 1, 10000 ); // (vertical FOV, aspect ratio, near, far)
camera.position.set( 0, 0, 1800 );

var parent = new THREE.Object3D();

function buildAxes( length ) {
    var axes = new THREE.Object3D();
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z
    return axes;

}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry();
    var mat;

    if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;

}

var axes = buildAxes( SCENE_WIDTH );
parent.add( axes );


// http://threejs.org/docs/#Reference/Extras.Helpers/BoundingBoxHelper
// can also be tied to scene but since our objects are in the parent we tie it here
var bounding_box = new THREE.BoundingBoxHelper(parent);
bounding_box.update(); // render
parent.add(bounding_box);


var Particle = MyParticle;

// Customizing our particles

Particle.prototype.create_geometry = function(){
    // http://threejs.org/docs/#Reference/Extras.Geometries/SphereGeometry
    this.geometry = new THREE.SphereGeometry(
        this.radius, // radius — sphere radius.
        25,          // widthSegments — number of horizontal segments.
        25           // heightSegments — number of vertical segments.
    );
};

Particle.prototype.create_material = function(){
    // http://threejs.org/docs/#Reference/Math/Color
    this.color = new THREE.Color();
    this.color.setHSL( Math.random(), .85, .5 );

    // http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
    this.material = new THREE.MeshPhongMaterial({
        color: this.color,
        specular: 0x333333,
        shininess: .9
    });
    this.material.transparent = true;
    this.material.opacity = .75;
};

Particle.prototype.create_mesh = function(){
    // http://threejs.org/docs/#Reference/Objects/Mesh
    this.mesh = new THREE.Mesh(
        this.geometry,
        this.material
    );
    this.mesh.position.set(this.x, this.y, this.z);
};

Particle.prototype.init_mesh_obj = function(){
    this.create_geometry();
    this.create_material();
    this.create_mesh();
};

Particle.prototype.update_mesh = function(){
    this.mesh.position.set(this.x, this.y, this.z);
};

var particles = [];
for (var i = 0; i < NUM_PARTICLES; ++i) {
    var p = new Particle(SCENE_WIDTH, SCENE_HEIGHT);
    p.init_mesh_obj();

    parent.add(p.mesh);
    particles.push(p);
}

scene.add(parent);

var ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);

var directionalLight2 = new THREE.DirectionalLight(0xffffff);
directionalLight2.position.set(-10, -10, -10).normalize();
scene.add(directionalLight2);

function draw() {

    for (var i = 0; i < particles.length; ++i) {
        particles[i].update();
        particles[i].update_mesh();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

function mouseClicked(event) {
    for (var i = 0; i < particles.length; i++) {
        particles[i].boost();
    }
}

renderer.domElement.addEventListener( 'mousedown', mouseClicked );