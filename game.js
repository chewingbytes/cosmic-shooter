// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start'; // start, playing, gameOver
let score = 0;
let lives = 3;
let level = 1;
let animationId;

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 40,
    speed: 6,
    color: '#00ffff'
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        shoot();
    }
});
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Bullets
const bullets = [];
const bulletSpeed = 8;

function shoot() {
    if (bullets.length < 5) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 15,
            speed: bulletSpeed,
            color: '#ffff00'
        });
    }
}

// Enemies
const enemies = [];
const enemyRows = 3;
const enemyCols = 8;
let enemySpeed = 1;
let enemyDirection = 1;
let enemyDropDistance = 20;

function createEnemies() {
    enemies.length = 0;
    const startX = 50;
    const startY = 50;
    const spacing = 80;
    
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: startX + col * spacing,
                y: startY + row * 60,
                width: 40,
                height: 30,
                color: row === 0 ? '#ff0066' : row === 1 ? '#ff9900' : '#66ff00',
                points: (enemyRows - row) * 10
            });
        }
    }
}

// Particles for explosions
const particles = [];

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

// Stars background
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
    });
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

// Draw player
function drawPlayer() {
    // Draw spaceship body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw wings glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - 5, player.y + 25, 10, 10);
    ctx.fillRect(player.x + player.width - 5, player.y + 25, 10, 10);
    ctx.shadowBlur = 0;
}

// Update player
function updatePlayer() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x += player.speed;
    }
    
    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        
        // Remove bullets that are off screen
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
}

// Update enemies
function updateEnemies() {
    let hitEdge = false;
    
    enemies.forEach(enemy => {
        enemy.x += enemySpeed * enemyDirection;
        
        if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
            hitEdge = true;
        }
    });
    
    if (hitEdge) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            enemy.y += enemyDropDistance;
        });
    }
    
    // Check if enemies reached player
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height > player.y) {
            gameOver();
        }
    });
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        // Draw enemy body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x + 10, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + 24, enemy.y + 8, 6, 6);
        
        // Draw antenna
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x + 20, enemy.y);
        ctx.lineTo(enemy.x + 20, enemy.y - 8);
        ctx.stroke();
        
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x + 20, enemy.y - 8, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Check collisions
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i] &&
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y) {
                
                // Hit!
                createExplosion(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2, enemies[j].color);
                score += enemies[j].points;
                updateScore();
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // Check if all enemies are destroyed
    if (enemies.length === 0) {
        levelUp();
    }
}

// Update and draw particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.fillRect(particle.x, particle.y, 3, 3);
        ctx.globalAlpha = 1;
    });
}

// Update UI
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

// Level up
function levelUp() {
    level++;
    updateLevel();
    enemySpeed += 0.5;
    createEnemies();
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
    cancelAnimationFrame(animationId);
}

// Game loop
function gameLoop() {
    if (gameState !== 'playing') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw and update
    updateStars();
    drawStars();
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateParticles();
    checkCollisions();
    
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawParticles();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    enemySpeed = 1;
    bullets.length = 0;
    particles.length = 0;
    
    updateScore();
    updateLives();
    updateLevel();
    
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 80;
    
    createEnemies();
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    gameLoop();
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Draw initial screen
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawStars();