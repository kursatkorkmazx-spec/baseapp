// Farcaster SDK
import { sdk } from 'https://esm.sh/@farcaster/frame-sdk';

// Initialize Farcaster
try {
    await sdk.actions.ready();
} catch (e) {
    console.log('Running outside Farcaster context');
}

// Game Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreDisplay = document.getElementById('score-display');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');

// Game State
let gameRunning = false;
let score = 0;
let bestScore = parseInt(localStorage.getItem('blueskyBest')) || 0;

// Bird
let bird = {
    x: 80,
    y: 300,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.3,
    jump: -7,
    rotation: 0
};

// Countdown
let countdown = 0;

// Obstacles
let obstacles = [];
let powerUps = [];
let clouds = [];
let particles = [];

// Resize canvas
function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    bird.y = canvas.height / 2;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Draw gradient sky background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#FFF5E6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sun
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 70, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 70, 35, 0, Math.PI * 2);
    ctx.fill();
}

// Draw bird
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    
    // Body
    ctx.fillStyle = '#1DA1F2';
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing
    ctx.fillStyle = '#0D8BD9';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10, -5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(12, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#FFB347';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(28, 3);
    ctx.lineTo(18, 6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Create obstacle (cloud or storm)
function createObstacle() {
    const gap = 180;
    const minHeight = 80;
    const maxHeight = canvas.height - gap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    const isStorm = Math.random() < 0.3;
    
    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        width: 70,
        passed: false,
        isStorm: isStorm
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obs => {
        if (obs.isStorm) {
            // Storm cloud - dark
            ctx.fillStyle = '#4A4A4A';
            drawCloud(obs.x, obs.topHeight - 50, obs.width, 60);
            drawCloud(obs.x, obs.bottomY + 10, obs.width, 60);
            
            // Lightning
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(obs.x + 35, obs.topHeight - 10);
            ctx.lineTo(obs.x + 25, obs.topHeight + 20);
            ctx.lineTo(obs.x + 40, obs.topHeight + 15);
            ctx.lineTo(obs.x + 30, obs.topHeight + 45);
            ctx.stroke();
        } else {
            // Normal cloud - white
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            drawCloud(obs.x, obs.topHeight - 50, obs.width, 60);
            drawCloud(obs.x, obs.bottomY + 10, obs.width, 60);
        }
    });
}

// Draw cloud shape
function drawCloud(x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.6, h * 0.4, 0, Math.PI * 2);
    ctx.arc(x + w * 0.5, y + h * 0.4, h * 0.5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.7, y + h * 0.6, h * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Create power-up
function createPowerUp() {
    if (Math.random() < 0.02 && powerUps.length < 2) {
        powerUps.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 100) + 50,
            size: 25,
            rotation: 0
        });
    }
}

// Draw power-ups (stars)
function drawPowerUps() {
    powerUps.forEach(pu => {
        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.rotate(pu.rotation);
        
        // Star glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        drawStar(0, 0, pu.size + 10);
        
        // Star
        ctx.fillStyle = '#FFD700';
        drawStar(0, 0, pu.size);
        
        ctx.restore();
        pu.rotation += 0.05;
    });
}

// Draw star shape
function drawStar(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

// Create background clouds
function createBackgroundCloud() {
    if (Math.random() < 0.01 && clouds.length < 5) {
        clouds.push({
            x: canvas.width,
            y: Math.random() * canvas.height * 0.6,
            size: Math.random() * 40 + 30,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

// Draw background clouds
function drawBackgroundClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
    });
}

// Particles
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color,
            size: Math.random() * 6 + 2
        });
    }
}

function drawParticles() {
    particles.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) particles.splice(i, 1);
    });
}

// Collision detection
function checkCollision() {
    // Ground and ceiling
    if (bird.y < 0 || bird.y + bird.height > canvas.height) {
        return true;
    }
    
    // Obstacles
    for (let obs of obstacles) {
        if (bird.x + bird.width > obs.x && bird.x < obs.x + obs.width) {
            if (bird.y < obs.topHeight || bird.y + bird.height > obs.bottomY) {
                return true;
            }
        }
    }
    
    return false;
}

// Check power-up collection
function checkPowerUp() {
    powerUps.forEach((pu, i) => {
        const dx = bird.x + bird.width / 2 - pu.x;
        const dy = bird.y + bird.height / 2 - pu.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < pu.size + 15) {
            score += 5;
            createParticles(pu.x, pu.y, '#FFD700');
            powerUps.splice(i, 1);
        }
    });
}

// Jump
function jump() {
    if (!gameRunning || countdown > 0) return;
    bird.velocity = bird.jump;
    createParticles(bird.x, bird.y + bird.height / 2, '#1DA1F2');
}

// Update game
function update() {
    if (!gameRunning || countdown > 0) return;
    
    // Bird physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 0.04, -0.5), 0.5);
    
    // Move obstacles
    obstacles.forEach((obs, i) => {
        obs.x -= 3;
        
        if (obs.x + obs.width < bird.x && !obs.passed) {
            obs.passed = true;
            score++;
        }
        
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    });
    
    // Move power-ups
    powerUps.forEach((pu, i) => {
        pu.x -= 2;
        if (pu.x + pu.size < 0) {
            powerUps.splice(i, 1);
        }
    });
    
    // Move background clouds
    clouds.forEach((cloud, i) => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size < 0) {
            clouds.splice(i, 1);
        }
    });
    
    // Spawn
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 250) {
        createObstacle();
    }
    createPowerUp();
    createBackgroundCloud();
    
    // Check collisions
    checkPowerUp();
    if (checkCollision()) {
        gameOver();
    }
    
    scoreDisplay.textContent = score;
}

// Draw game
function draw() {
    drawBackground();
    drawBackgroundClouds();
    drawObstacles();
    drawPowerUps();
    drawBird();
    drawParticles();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    obstacles = [];
    powerUps = [];
    particles = [];
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Countdown
    countdown = 3;
    scoreDisplay.textContent = countdown;
    scoreDisplay.classList.remove('hidden');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            scoreDisplay.textContent = countdown;
        } else {
            clearInterval(countdownInterval);
            scoreDisplay.textContent = '0';
            gameRunning = true;
        }
    }, 1000);
}

// Game over
function gameOver() {
    gameRunning = false;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('blueskyBest', bestScore);
    }
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Touch/click to jump
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    jump();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning && startScreen.classList.contains('hidden') === false) {
            startGame();
        } else {
            jump();
        }
    }
});

// Initialize
bestScoreEl.textContent = bestScore;
gameLoop();
