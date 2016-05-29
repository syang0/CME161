var MyParticle = function(width_in, height_in) {

    this.type = "particle_simple";
    this.gravity = 0.5;
    this.drag = 0.995;

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

        // The original code checked for a non-zero velocity before updating,
        // but it's way simplier (and even faster) to do the operations without
        // taking a Math.abs() and checking.

        // y direction
        this.y_v *= this.drag;
        this.y_v -= this.gravity;
        this.y += this.y_v;

        //x z direction
        this.x_v *= this.drag;
        this.x += this.x_v;

        this.z_v *= this.drag;
        this.z += this.z_v;

        this.constrain();
    };

    this.constrain = function () {

        // y
        if (this.y >= this.y_max) {
            this.y = this.y_max;
            this.y_v *= -1;
        }

        if (this.y <= -this.y_max) {
            this.y = -this.y_max;
            this.y_v *= -1;
        }

        // x
        if (this.x >= this.x_max) {
            this.x = this.x_max;
            this.x_v *= -1;
        }

        if (this.x <= -this.x_max) {
            this.x = -this.x_max;
            this.x_v *= -1;
        }

        // z
        if (this.z >= this.z_max) {
            this.z = this.z_max;
            this.z_v *= -1;
        }

        if (this.z <= -this.z_max) {
            this.z = -this.z_max;
            this.z_v *= -1;
        }
    };

    this.boost = function() {
        var y_sign = this.y_v > 0 ? 1 : -1;
        var x_sign = this.x_v > 0 ? 1 : -1;
        var z_sign = this.z_v > 0 ? 1 : -1;
        var ky = Math.random() * 10;
        var kx = Math.random() * 10;
        var kz = Math.random() * 10;

        this.y_v += ky * y_sign;
        this.y -= this.y_v;
        this.x_v += kx * x_sign;
        this.x += this.x_v;
        this.z_v += kz * z_sign;
        this.z += this.z_v;
    };
};