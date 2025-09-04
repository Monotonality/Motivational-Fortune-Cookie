// Particle system using pure JavaScript
class Particle {
    constructor(canvas, ctx, startSpread = false) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.startSpread = startSpread;
        this.reset();
    }
    
    reset() {
        if (this.startSpread) {
            // For initial particles: spread across the screen
            this.x = Math.random() * this.canvas.width;
            this.y = Math.random() * this.canvas.height;
        } else {
            // For new particles: start from bottom
            this.x = Math.random() * this.canvas.width;
            this.y = this.canvas.height + 10;
        }
        
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
        const cookieRadius = window.cookieRejectionRadius || 150; // Dynamic radius
        
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
            // When resetting, always start from bottom (not spread out)
            this.startSpread = false;
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

// Global cookie rejection radius
window.cookieRejectionRadius = 150;

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
        // New particles always start from bottom (startSpread = false)
        particles.push(new Particle(canvas, ctx, false));
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

// Cookie click functionality
function handleCookieClick() {
    // Add a fun bounce effect
    const cookie = document.getElementById('cookie');
    cookie.style.animation = 'none';
    cookie.offsetHeight; // Trigger reflow
    cookie.style.animation = 'float 3s ease-in-out infinite';
    
    // Add temporary scale effect
    cookie.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cookie.style.transform = '';
    }, 200);
    
    // Expand particle rejection radius temporarily
    window.cookieRejectionRadius = 300;
    
    // Create and show the card
    showFortuneCard();
    
    // Reset radius after 3 seconds
    setTimeout(() => {
        window.cookieRejectionRadius = 150;
    }, 3000);
    
    console.log('Cookie clicked! 🍪');
}

// Fortune card functionality
function showFortuneCard() {
    // Remove existing card if any
    const existingCard = document.querySelector('.fortune-card');
    if (existingCard) {
        existingCard.remove();
    }
    
    // Create card container
    const card = document.createElement('div');
    card.className = 'fortune-card';
    
    // Check if we have any fortunes left
    if (window.availableFortunes.length === 0) {
        // All fortunes used up - show special message and fade cookie
        card.innerHTML = `
            <div class="card-content">
                <h3>Final Fortune</h3>
                <p>You have dried up my well of knowledge, go seek help elsewhere</p>
                <button class="close-btn">×</button>
            </div>
        `;
        
        // Fade the cookie away
        const cookie = document.getElementById('cookie');
        cookie.style.transition = 'all 3s ease';
        cookie.style.opacity = '0';
        cookie.style.transform = 'scale(0.1)';
        
        // Remove cookie after fade
        setTimeout(() => {
            cookie.remove();
        }, 3000);
        
    } else {
        // Get random fortune from remaining ones
        const randomIndex = Math.floor(Math.random() * window.availableFortunes.length);
        const randomFortune = window.availableFortunes[randomIndex];
        
        // Remove the used fortune from the list
        window.availableFortunes.splice(randomIndex, 1);
        
        // Card content
        card.innerHTML = `
            <div class="card-content">
                <h3>Your Fortune</h3>
                <p>${randomFortune}</p>
                <button class="close-btn">×</button>
            </div>
        `;
    }
    
    // Add close functionality
    const closeBtn = card.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        card.remove();
    });
    
    // Auto-close after 8 seconds with smooth fade-out
    setTimeout(() => {
        if (card.parentNode) {
            card.classList.add('fade-out');
            // Remove from DOM after fade-out animation completes
            setTimeout(() => {
                if (card.parentNode) {
                    card.remove();
                }
            }, 500); // Match the CSS transition duration
        }
    }, 8000);
    
    // Add to page
    document.body.appendChild(card);
    
    // Trigger entrance animation
    setTimeout(() => {
        card.classList.add('show');
    }, 10);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initCanvas();
    
    // Initialize available fortunes array
    window.availableFortunes = [
        "I cannot help you, for I am just a cookie",
        "You will marry a professional athlete, if competitive hotdog eating can be considered a sport",
        "About time I got out of that cookie",
        "Run.",
        "A snowflake has no guilt for being in an avalanche",
        "Ask not what your fortune cookie can do for you, but what you can do for your fortune cookie",
        "Enjoy yourself while you can.",
        "You are not illiterate.",
        "You will die sometime in the next 90 years.",
        "You have clicked a cookie in your past.",
        "18,000 children starve to death every day, many of them without a fortune cookie",
        "Three can keep a secret, if you get rid of the other two.",
        "help",
        "Avoid gambling. Lucky numbers are 12, 15, 85, 19",
        "This cookie is never gonna give you up, let you down",
        "I cannot help you, for I am just a cookie",  
        "You will soon realize this cookie knows too much",  
        "Beware of ducks. They want what’s yours",  
        "This cookie was written by your future ex",  
        "You are the chosen one.",  
        "Your Wi-Fi password is weak",  
        "Happiness comes from within the fridge",    
        "Your lucky number is already taken",    
        "Fortune favors the bold… but also the well-armed",  
        "You have mistaken this cookie for free therapy",  
        "Beware of people who clap when the plane lands",  
        "The stars say: stop Googling your symptoms",    
        "You will step on a Lego when you least expect it",  
        "Your aura resembles yellow snow.",  
        "You will soon remember something embarrassing from 10 years ago",  
        "A bird will ruin your day in the near future",  
        "You should not own a pet",  
        "You will make a mistake so small you’ll obsess over it for weeks",  
        "Your fortune is trapped in another cookie",  
        "You will soon eat something you regret",  
        "Life is short, and often cut shorter",  
        "You are not the protagonist of this story",  
        "Beware of smiling baristas. They know your secrets",  
        "Your future is... something.",  
        "You will soon receive mail you do not want",  
        "The cookie sees all. The cookie judges all",  
        "You will forget why you walked into the kitchen",  
        "The road ahead is long, and full of potholes",  
        "Someone will text you 'k' and ruin your day",  
        "Tomorrow you will misplace something important",  
        "You are not paranoid. They are watching",  
        "You will regret trusting the fart",  
        "You will sneeze at the worst possible time",  
        "Your shadow is disappointed in you",  
        "One day you’ll understand. But not today",  
        "You will remember this cookie at 3 AM for no reason",  
        "You will stub your toe on destiny",  
        "A fortune is just a spoiler for life",  
        "Tomorrow you will procrastinate again",  
        "You will laugh alone at your phone today",  
        "The cookie knows when you’re lying",  
        "You will soon step in something unpleasant",  
        "Your enemies are not impressed by your playlist",  
        "You will binge-watch instead of sleeping",  
        "A mysterious package will arrive. It will be socks",  
        "Your password will expire at the worst time",  
        "You are doing great, but no one noticed",  
        "You will soon encounter mild inconvenience",  
        "This fortune tastes better than your future",  
        "Beware of chairs that squeak too loudly",  
        "A pigeon will test your patience",  
        "You will soon forget someone’s name mid-conversation",  
        "You are secretly someone’s least favorite coworker",  
        "You will get caught talking to yourself",  
        "Your fortune has been delayed due to technical issues",  
        "You will soon become an unskippable ad",  
        "You are reading this instead of being productive",  
        "A sneeze will change the course of your day",  
        "You will soon misplace your phone while holding it",  
        "Your silence is louder than your words",  
        "You will soon trip over nothing",  
        "I know.",  
        "You are 87% predictable",  
        "A strange noise in the night is just your imagination… probably",  
        "You will soon forget your umbrella on a rainy day",  
        "I don't want to read your fortune.",  
        "You will soon say 'you too' at the wrong time",  
        "Your laugh will embarrass you in public soon",  
        "Beware of squirrels plotting against you",  
        "You will soon drop something fragile",  
        "You are not special. But this cookie is",  
        "You will get stuck in a revolving door of bad decisions",  
        "You are destined to be fashionably late",  
        "Tomorrow you will eat leftovers you swore you wouldn’t",  
        "You will soon receive bad advice from a good friend",  
        "You will forget to charge your future",  
        "Your fortune will be reposted as a meme",  
        "You will find wisdom at the bottom of a snack bag",  
        "Someone is already laughing at your future mistakes",  
        "Your destiny is on hold, please stay on the line",  
        "You will wake up at 3 AM craving something ridiculous",  
        "This cookie has nothing left to give",  
        "Your fortune is in another castle",  
        "You will soon sneeze in an awkward silence",  
        "Your socks will go missing mysteriously",  
        "You will ignore good advice and regret it later",  
        "This cookie believes in you, even if no one else does"  

    ];
    
    // Start with particles already spread out across the screen
    for (let i = 0; i < 80; i++) {
        particles.push(new Particle(canvas, ctx, true)); // true = start spread out
    }
    
    // Add mouse tracking
    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', clearMousePosition);
    
    // Add cookie click event
    document.getElementById('cookie').addEventListener('click', handleCookieClick);
    
    // Start animation loop
    updateParticles();
    
    console.log('Floating Fortune Cookie with non-repeating fortunes loaded!');
});
