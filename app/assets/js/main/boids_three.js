/**
    * Actions Required:
    * viz_container_id is the id of the *div* in the html into which we will add the gui and stats elements
    * viz_canvas_id is the id of the *canvas* in the html into which the visualization is rendered
    * change these when you port to your heroku portfolio, but leave it as is for now
    * example: in your portfolio, you might have a container called "boids_container"
**/
var viz_container_id = "threejs";
var viz_canvas_id = "three_boid"; 

// ------------------------------------------------------------------------------------------------
// renderer, camera, scene 

// constants
var SCENE_WIDTH = SCENE_HEIGHT = 500;

// bind renderer (THREE.WebGLRenderer ==> GPU!) to canvas, set size, and enable antialiasing
var canvas = document.getElementById(viz_canvas_id);
var renderer = new THREE.WebGLRenderer({ 
    "canvas": canvas, 
    "antialias": true 
});
renderer.setSize(SCENE_WIDTH, SCENE_HEIGHT);

// set up a camera and move it to a good viewing place (orbitcontrols overwrites this)
var camera = new THREE.PerspectiveCamera(45, SCENE_WIDTH / SCENE_HEIGHT, 1, 10000);
camera.position.set(SCENE_WIDTH, SCENE_HEIGHT / 2, 2000);

// scene - where we put our meshes
var scene = new THREE.Scene();

// container object (like a sub-scene) which we use to store meshes
var container = new THREE.Object3D();
scene.add(container);

// ------------------------------------------------------------------------------------------------
// helpers

// orbit controls binds mouse events (over the canvas only) to the camera
var controls = new THREE.OrbitControls(camera, canvas); // it is super important to add the second arg, it scopes the events to those fired over the canvas and not the entire doc
controls.addEventListener('change', function(){
    renderer.render(scene, camera);
});

// axes
var axes = new THREE.AxisHelper2(SCENE_WIDTH);
axes.update();
container.add(axes.mesh);

// bounding box
var bounding_box = new THREE.BoundingBoxHelper(container); // can also be tied to scene but since our objects are in the container we tie it here
bounding_box.update(); // render
container.add(bounding_box);

// stats (fps graph)
var stats = new Stats();
document.getElementById(viz_container_id).appendChild(stats.domElement); // add stats to the container

// ------------------------------------------------------------------------------------------------
// lights

var ambient_light = new THREE.AmbientLight(0xffffff);
ambient_light.name = "ambient_light";
scene.add(ambient_light);

var directional_light = new THREE.DirectionalLight(0xffffff)
directional_light.position.set(1,1,1);
directional_light.name = "directional_light";
scene.add(directional_light);

// ------------------------------------------------------------------------------------------------
// user interface

// dat.gui
var gui = new dat.GUI();
document.getElementById(viz_container_id).appendChild( gui.domElement );

// this is an object that stores the state of the controls
// when you click on the controls, it changes the values therein
// you can reference this later in the program, for example while rendering
var controls_state = {
    "ambient_light": true,
    "directional_light": true,
    "ambient_light_intensity": 1,
    "directional_light_intensity": 1,
    "show_axis": true,
    "show_bounding_box": true,
    "neighborhood_radius":100,
    "max_steer_force":0.1,
    "max_speed":4,
    "saturation":1.1,
    "level":0.4,
    "avoidWalls":true

};

gui.add(controls_state, 'ambient_light')
    .onChange(function(on) {
        scene.getObjectByName('ambient_light').intensity = 1 * on;
    });

gui.add(controls_state, 'directional_light')
    .onChange(function(on) {
        scene.getObjectByName('directional_light').intensity = 1 * on;
    });

gui.add(controls_state, 'ambient_light_intensity', 0, 1)
    .onChange(function(value) {
        scene.getObjectByName('ambient_light').intensity = value;
    });

gui.add(controls_state, 'directional_light_intensity', 0, 1)
    .onChange(function(value) {
        scene.getObjectByName('directional_light').intensity = value;
    });

gui.add(controls_state, 'show_axis')
    .onChange(function(on) {
        if (on) { container.add(axes.mesh);    } 
        else    { container.remove(axes.mesh); }
    });

gui.add(controls_state, 'show_bounding_box')
    .onChange(function(on) {
        if (on) { container.add(bounding_box);    }
        else    { container.remove(bounding_box); }
    });


gui.add(controls_state, 'show_bounding_box')
    .onChange(function(on) {
        if (on) { container.add(bounding_box);    }
        else    { container.remove(bounding_box); }
    });


gui.add(controls_state, 'show_bounding_box')
    .onChange(function(on) {
        if (on) { container.add(bounding_box);    }
        else    { container.remove(bounding_box); }
    });

gui.add(controls_state, 'neighborhood_radius', 10, 500)
    .onChange(function(value) {
        boids.forEach(function(b) {b.setNeighborhoodRadius(value)});
    });

gui.add(controls_state, 'max_steer_force', 0, 1)
    .onChange(function(value) {
        boids.forEach(function(b) {b.setMaxSteerForce(value)});
    });

gui.add(controls_state, 'max_speed', 1, 5)
    .onChange(function(value) {
        boids.forEach(function(b) {b.setMaxSpeed(value)});
    });

gui.add(controls_state, 'saturation', 0.4, 1.1);

gui.add(controls_state, 'level', 0.4, 1.1);

gui.add(controls_state, 'avoidWalls')
    .onChange(function(value) {
        boids.forEach(function(b) {b.setAvoidWalls(value)});
    });

/**
    * Actions Required:
    *  add sliders for the _neighborhoodRadius, _maxSteerForce, and _maxSpeed
        * see the tutorial for a description of how the boids object works
    * hint: all of these involve changing properties of each boid b
        * b._neighborhoodRadius = value
    * hint: look at the loop in the animate() function, run a similar loop when the slider is changed
    * hint: do this requirement last
**/
if(gui.__controllers.length == 6) console.log("Action Required: add required dat.gui sliders"); // delete this line

// --------------------------------------------------------- 
// add boids

var n = 200,
    boids = [];

for (var i = 0; i < n; i++) {
    var b = new Boid(SCENE_WIDTH, SCENE_HEIGHT);
    b.set_parameters();
    b.init_mesh_obj();
    container.add(b.mesh);
    boids.push(b);
    /**
        * Actions Required:
        * build boid objects 
        * use the methods defined in boids_prototypes_for_three.js
        * freebie: copy and paste the lines below in order, and it should work assuming all other required actions are complete
            * var b = new Boid(SCENE_WIDTH, SCENE_HEIGHT);
            * b.set_parameters();
            * b.init_mesh_obj(); 
            * container.add(b.mesh);
            * boids.push(b);
    **/
}

// ------------------------------------------------------------------------------------------------
// animation loop


function animate() {
    // start stats recording
    stats.begin();

    // render boids
    for (var i = 0; i < n; i++) {

        /**
            * Actions Required:
            *  update the position of each boid b
                * see the tutorial for a description of how the boids object works
            * update the position of the mesh
                * see the methods you defined in boids_prototypes_for_three.js
            * hint: both of these involve invoking methods of b
                * b.some_method() or b.some_method(boids)
            * hint: the first line is
                * b = boids[i];
            * when you're done, delete the update_boids_warning var above
        **/
        var b = boids[i];
        b.run(boids);
        b.update_mesh(controls_state.saturation, controls_state.level);

    }

    // render scene
    renderer.render(scene, camera);

    // end stats recording
    stats.end();

    // run again
    requestAnimationFrame(animate);
}

// start visualization
requestAnimationFrame(animate);
