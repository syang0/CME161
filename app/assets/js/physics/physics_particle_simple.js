var Particle_Simple = function(width_in, height_in) {

    this.type = "particle_simple";

    this.radius = Math.random() * 40;

    // Set boundaries
    this.x_max = width_in - (this.radius / 2);
    this.y_max = height_in - (this.radius / 2);
    this.z_max = width_in - (this.radius / 2);

    // Start off in a random position...
    this.x = -1*this.x_max + Math.random() * this.x_max;
    this.y = -1*this.y_max + Math.random() * this.y_max;
    this.z = -1*this.z_max + Math.random() * this.z_max;

    // ...with a random velocity vector
    this.x_v = Math.random() * 20;
    this.y_v = Math.random() * 20;
    this.z_v = Math.random() * 20;


    this.update = function () {
        // lazy Euler integration

        // y direction
        if ((Math.abs(this.y_v) > 0)) {
            this.y += this.y_v;
        }

        // x direction
        if ((Math.abs(this.x_v) > 0)) {
            this.x += this.x_v;
        }

        // z direction
        if ((Math.abs(this.z_v) > 0)) {
            this.z += this.z_v;
        }
    }
};