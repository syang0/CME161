// ---------------------------------------------------------
// Particle (Replaced with Boid) Render Prototype Methods

Boid.prototype.set_parameters = function() {
    /**
        * Action Required: add a radius and hue parameter such that:
            * the radius is randomly initialized between 0 and 40
        * These are parameters required to implant properties into the boids
    **/

    this.radius = Math.random() * 40;
    this.hue = Math.random();

    if(this.radius == 0) console.log("Action Required: You need to set a boid radius.") // delete this line

    /**
        * No Action Required
        * these parameters are used in calulating the color as a function of momentum
    **/

    this.max_momentum = 0;
    this.min_momentum = 4; 
    this.range_momentum = 0;
};

Boid.prototype.create_geometry = function() {
    /** 
        * Action Required: fill this in using a box geometry
        * see http://threejs.org/docs/#Reference/Extras.Geometries/BoxGeometry
    **/

    this.geometry = new THREE.BoxGeometry(this.radius, this.radius, this.radius);
    
    if(typeof(this.geometry) == "undefined") console.log("Action Required: You need to set a boid geometry.") // delete this line
};

Boid.prototype.create_material = function() {
    // assign a random color from HSL space
    this.color = new THREE.Color(); // http://threejs.org/docs/#Reference/Math/Color
    this.color.setHSL(this.hue, .85, .5);

    /**
        * Action Required: fill this in using some material with specular + diffuse lighting
        * make it transparent
        * see http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
        * hint: the following properties may be useful when instantiating your material
            {
                "color": this.color,
                "specular": 0x333333,
                "shininess": .9,
                "transparent": true,
                "opacity": 0.75
            }
    **/

    this.material = new THREE.MeshPhongMaterial({
        "color": this.color,
        "specular": 0x333333,
        "shininess": .9,
        "transparent": true,
        "opacity": 0.75
    });

    if(typeof(this.material) == "undefined") console.log("Action Required: You need to set a boid material.") // delete this line
}

Boid.prototype.create_mesh = function() {
    /**
        * Action Required: create your mesh
        * think of a mesh as a backpacker's tent, where you bind geometry (tent poles) and material (tent canvas)
        * see http://threejs.org/docs/#Reference/Objects/Mesh
    **/

    this.mesh = new THREE.Mesh(
        this.geometry,
        this.material
    );

    if(typeof(this.mesh) == "undefined") console.log("Action Required: You need to set a boid mesh.") // delete this line

    /**
        * Action Required: set the position of the mesh to the position of the boid in xyz space
        * hint: this.position.x is the current x location of the boid
    **/

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    if(typeof(this.mesh) != "undefined" && this.mesh.position.x == 0 && this.mesh.position.y == 0 && this.mesh.position.z == 0) console.log("Action Required: You need to set the mesh position.") // delete this line
};

Boid.prototype.init_mesh_obj = function() {
    /**
        * No Action Required
        * This is a convenience procedure for making a mesh, so we only need to call this one function instead of all 3
    **/

    this.create_geometry();
    this.create_material();
    this.create_mesh();
}

Boid.prototype.update_mesh = function(saturation_momentum, level_momentum) {
    /**
        * Action Required: update the new position of the mesh to the current position of the boid in xyz space
        * this is the data --> visual binding step
        * hence you bind the position of the boids (data) to the position of the mesh (visual)
        * hint: this.position.x is the current x location of the boid
    **/

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    if(typeof(this.mesh) != "undefined" && this.mesh.position.x == 0 && this.mesh.position.y == 0 && this.mesh.position.z == 0) console.log("Action Required: You need to update the mesh position.") // delete this line

    /** bonus points:
        * No Action Required
        * calculate momentum and map it to color in HSL space
        * try adjusting the 1.1 and 0.4 scaling to see how that affects the color as a function of momentum
        * hook these two parameters into a dat.gui slider
    **/

    var momentum = this.velocity.length() * this.radius;
    if( momentum > this.max_momentum){ this.max_momentum = momentum; this.range_momentum = this.max_momentum - this.min_momentum; }
    if( momentum < this.min_momentum){ this.min_momentum = momentum; this.range_momentum = this.max_momentum - this.min_momentum; }
    this.mesh.material.color.setHSL( this.hue, momentum/this.range_momentum * saturation_momentum, momentum/this.range_momentum * level_momentum);
};