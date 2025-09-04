// Particle system using pure JavaScript
class Particle {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = this.canvas.height + 10;
        this.size = 2 + Math.random() * 4;
        this.speedY = 0.8 + Math.random() * 1.2;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.opacity = 1;
        this.life = 1;
        this.decay = 0.995; // Much slower decay
        this.maxY = -50; // Particles go further up
    }
    
    update(mouseX, mouseY) {
        // Update position
        this.y -= this.speedY;
        this.x += this.speedX;
        
        // Cookie avoidance - invisible ring around cookie
        const cookieCenterX = this.canvas.width / 2;
        const cookieCenterY = this.canvas.height / 2;
        const cookieRadius = 150; // Invisible ring radius around cookie
        
        const dxToCookie = this.x - cookieCenterX;
        const dyToCookie = this.y - cookieCenterY;
        const distanceToCookie = Math.sqrt(dxToCookie * dxToCookie + dyToCookie * dyToCookie);
        
        if (distanceToCookie < cookieRadius) {
            const force = (cookieRadius - distanceToCookie) / cookieRadius;
            const avoidanceStrength = 8;
            this.x += (dxToCookie / distanceToCookie) * force * avoidanceStrength;
            this.y += (dyToCookie / distanceToCookie) * force * avoidanceStrength;
        }
        
        // Mouse avoidance - much stronger now
        if (mouseX !== null && mouseY !== null) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) { // Increased avoidance radius
                const force = (150 - distance) / 150;
                const avoidanceStrength = 6; // Much stronger avoidance
                this.x += (dx / distance) * force * avoidanceStrength;
                this.y += (dy / distance) * force * avoidanceStrength;
            }
        }
        
        // Life decay - only start decaying when near the top
        if (this.y < this.canvas.height * 0.3) {
            this.life *= this.decay;
        }
        this.opacity = this.life;
        
        // Reset if particle is off screen or dead
        if (this.y < this.maxY || this.life < 0.1) {
            this.reset();
        }
    }
    
    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.opacity;
        this.ctx.fillStyle = `hsl(${30 + Math.random() * 20}, 100%, 70%)`; // Brighter colors
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 8; // Increased glow
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
}

// Canvas setup
let canvas, ctx, particles = [];
let mouseX = null, mouseY = null;
const maxParticles = 120; // Slightly more particles to prevent gaps
let lastParticleTime = 0;
const particleSpawnInterval = 80; // Faster spawning (every 80ms = 12.5 particles/second)

function initCanvas() {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Style canvas
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    document.body.appendChild(canvas);
}

function spawnParticle() {
    if (particles.length < maxParticles) {
        particles.push(new Particle(canvas, ctx));
    }
}

function updateParticles() {
    const currentTime = Date.now();
    
    // Spawn new particles continuously with better timing
    if (currentTime - lastParticleTime > particleSpawnInterval) {
        spawnParticle();
        lastParticleTime = currentTime;
    }
    
    // Ensure minimum particle count to prevent gaps
    if (particles.length < 40) {
        spawnParticle();
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update(mouseX, mouseY);
        particle.draw();
        
        // Remove dead particles (reverse loop to avoid index issues)
        if (particle.life < 0.1) {
            particles.splice(i, 1);
        }
    }
    
    // Continue animation
    requestAnimationFrame(updateParticles);
}

// Mouse tracking
function updateMousePosition(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

function clearMousePosition() {
    mouseX = null;
    mouseY = null;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initCanvas();
    
    // Start with more particles to prevent initial gaps
    for (let i = 0; i < 50; i++) {
        spawnParticle();
    }
    
    // Add mouse tracking
    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', clearMousePosition);
    
    // Start animation loop
    updateParticles();
    
    console.log('Floating Fortune Cookie with cookie avoidance ring and improved particle generation loaded!');
});
