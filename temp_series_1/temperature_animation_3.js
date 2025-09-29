/** 
 * Temperature and particle collisions demo by Ruth Murray-Clay
 *
 * The collision animation component is adapted from code by Chris Courses: 
 * https://chriscourses.com/courses/canvas-physics/advanced-detection
 */

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 500; //window.innerWidth;
canvas.height = 400; //window.innerHeight;

// Find color themes on Kuler
var colors = [
    '#004F6E',
    '#42A6C6',
    '#F0B949',
    '#F56E47'
];

// Utility Functions
function randomIntFromRange(min,max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
}

/*
 * Rotates coordinate system for velocities
 */
function rotate(velocity, angle) {
    const rotatedVelocities = {
	x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
	y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };

    return rotatedVelocities;
}

/*
 * Swaps out two colliding particles' x and y velocities after an elastic collision
 */
function resolveCollision(particle, otherParticle) {
    const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
    const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

    const xDist = otherParticle.x - particle.x;
    const yDist = otherParticle.y - particle.y;

    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {     // Prevent accidental overlap of particles

	// angle between the two colliding particles
	const angle = -Math.atan2(otherParticle.y-particle.y, otherParticle.x-particle.x);

	// Store mass in var for better readability in collision equation
	const m1 = particle.mass;
	const m2 = otherParticle.mass;

	// Velocity before collision in the frame rotated so the relative velocity is in the x-direction
	const u1 = rotate(particle.velocity, angle);
	const u2 = rotate(otherParticle.velocity, angle);

	// Velocity after 1d collision equation
	/* In 1d, referring to the center-of-mass (COM): m1*(x1-xCOM) = -m2*(x2-xCOM), so m1*(u1-uCOM) = -m2*(u2-uCOM).
	 * Thus, uCOM*(m1+m2) = m1*u1 + m2*u2, and the COM velocity is uCOM = u1 * m1/(m1+m2) + u2 * m2/(m1+m2).
	 * After an elastic collision, particle velocities in the COM fram are reversed, so
	 * v1-uCOM = -(u1-uCOM), meaning v1 = -u1 + 2*uCOM for particle 1 and likewise for particle 2.
	 * Plugging in, v1 = -u1*(m1+m2)/(m1+m2) + 2*u1*m1/(m1+m2) + 2*u2*m2/(m1+m2) = u1*(m1-m2)/(m1+m2) + 2*u2*m2/(m1+m2).
	 */
	const v1 = { x: u1.x * (m1-m2)/(m1+m2) + u2.x * 2 * m2/(m1+m2), y: u1.y };
	const v2 = { x: u2.x * (m1-m2)/(m1+m2) + u1.x * 2 * m2/(m1+m2), y: u2.y };

	// Final velocity after rotating axes back to original location
	const vFinal1 = rotate(v1, -angle);
	const vFinal2 = rotate(v2, -angle);

	// Swap particle velocities for realistic bounce effect
	particle.velocity.x = vFinal1.x;
	particle.velocity.y = vFinal1.y;

	otherParticle.velocity.x = vFinal2.x;
	otherParticle.velocity.y = vFinal2.y;
    }
}

function histogram(data, nbins, min=0.0, max=1.0) {
    var width = (max-min)/nbins;

    var bins = Array(nbins).fill(0);

    for(var i = 0; i < data.length; i++) {
	indx = Math.floor(data[i]/width);
	//console.log(data[i], width, indx, bins.length);
	if (indx < bins.length) {
	    bins[indx] = bins[indx] + 1;
	}
    }
    
    return bins;
}


// Objects
function Particle(x, y, radius, color, strokecolor=color, vel_amp = 8/10., explode=0) {
    this.x = x;
    this.y = y;

    const randtheta = Math.random()*2.0*3.14159
   
    this.velocity = {
	x: vel_amp*Math.cos(randtheta),
	y: vel_amp*Math.sin(randtheta)
    };
    this.radius = radius;
    this.color = color;
    this.strokecolor = strokecolor;
    this.mass = 1;
    this.opacity = 0.5;

    const xnorm = (this.x-canvas.width/2.0)/(canvas.width);
    const ynorm = (this.y-canvas.height/2.0)/canvas.height;
    const hypot = Math.sqrt(xnorm*xnorm + ynorm*ynorm);
 
    if (explode == 1) {
	this.velocity = {
	    x: vel_amp*xnorm/hypot,
	    y: vel_amp*ynorm/hypot
	};
    }

    this.update = particles => {
	this.draw();

	for (let i = 0; i < particles.length; i++) {
	    if (this === particles[i]) continue;

	    if (distance(this.x, this.y, particles[i].x, particles[i].y) - radius*2 < 0) {
		resolveCollision(this, particles[i]);
	    }
	}

	if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
	    this.velocity.x = -this.velocity.x;
	}

	if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
	    this.velocity.y = -this.velocity.y;
	}

	this.x += this.velocity.x;
	this.y += this.velocity.y; 
	
    };

    this.draw = () => {
	c.beginPath();
	c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);

	c.save();
	c.fillStyle = this.color;
	c.fill();
	c.restore();

	c.save();
	c.strokeStyle = this.strokecolor;
	c.lineWidth = 2.0;
	c.stroke();
	c.restore();
	

	c.closePath();
    };
}


// Implementation
let particles;
let nparticles = 400;
let axes;
let wave;
let vels;
let vel_amp = 0.8;
let vrange = 4;
let x0;
let y0;
let xmax;
let ymax;
let v;
let v0;
let norm;
let explode = 0;
let drawwidth;
let binmax;
let nbins;
let bins;
let radius = 4;

function init() {
    particles = [];


    for (let i = 0; i < nparticles; i++) {
	let x = randomIntFromRange(radius, canvas.width - radius);
	let y = randomIntFromRange(radius, canvas.height - radius);
	const color = colors[3];
	const strokecolor = colors[2];

	if (i !== 0) {
	    for (let j = 0; j < particles.length; j++) {
		if (distance(x, y, particles[j].x, particles[j].y) - radius*2 < 0) {
		    x = randomIntFromRange(radius, canvas.width - radius);
		    y = randomIntFromRange(radius, canvas.height - radius);

		    j = -1;
		}
	    }
	}
    
	particles.push(new Particle(x, y, radius, color, strokecolor, vel_amp, explode));
    }
    if (explode == 1) {
	explode = 0;
    }
        
}

var myButton = document.getElementById("exp_button_1");
myButton.onclick = function() {
    explode = 1;
    init();
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
  
    // update the particles
    particles.forEach(particle => {
	particle.update(particles);
    });
}

init();
animate();
