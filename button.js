document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('button');
    
    // ========== BUTTON BORDER ANIMATION ==========
    const wrapper = document.createElement('div');
    wrapper.className = 'button-wrapper';
    wrapper.style.cssText = `
        position: relative;
        display: inline-block;
        padding: 4px;
    `;
    
    button.parentNode.insertBefore(wrapper, button);
    wrapper.appendChild(button);
    
    const canvas = document.createElement('canvas');
    canvas.className = 'border-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: calc(0.5rem + 4px);
    `;
    wrapper.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let animationId = null;
    let offset = 0;
    
    function resizeCanvas() {
        const rect = wrapper.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }
    
    function drawBorder() {
        const w = canvas.width;
        const h = canvas.height;
        const dashLen = 15;
        const gapLen = 10;
        
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.setLineDash([dashLen, gapLen]);
        ctx.lineDashOffset = -offset;
        
        const radius = 8;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(1.5, 1.5, w - 3, h - 3, radius);
        } else {
            // Safari fallback
            ctx.moveTo(1.5 + radius, 1.5);
            ctx.lineTo(1.5 + w - 3 - radius, 1.5);
            ctx.quadraticCurveTo(1.5 + w - 3, 1.5, 1.5 + w - 3, 1.5 + radius);
            ctx.lineTo(1.5 + w - 3, 1.5 + h - 3 - radius);
            ctx.quadraticCurveTo(1.5 + w - 3, 1.5 + h - 3, 1.5 + w - 3 - radius, 1.5 + h - 3);
            ctx.lineTo(1.5 + radius, 1.5 + h - 3);
            ctx.quadraticCurveTo(1.5, 1.5 + h - 3, 1.5, 1.5 + h - 3 - radius);
            ctx.lineTo(1.5, 1.5 + radius);
            ctx.quadraticCurveTo(1.5, 1.5, 1.5 + radius, 1.5);
        }
        ctx.stroke();
    }
    
    function animate() {
        offset += 0.5;
        drawBorder();
        animationId = requestAnimationFrame(animate);
    }
    
    resizeCanvas();
    
    wrapper.addEventListener('mouseenter', () => {
        canvas.style.opacity = '1';
        if (!animationId) animate();
    });
    
    wrapper.addEventListener('mouseleave', () => {
        canvas.style.opacity = '0';
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    });
    
    window.addEventListener('resize', resizeCanvas);
    
    // ========== AMBIENT DUST PARTICLES ==========
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    });
    
    const dustCanvas = document.createElement('canvas');
    dustCanvas.id = 'dust-canvas';
    dustCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    document.body.appendChild(dustCanvas);
    
    const dustCtx = dustCanvas.getContext('2d');
    let particles = [];
    
    function resizeDustCanvas() {
        dustCanvas.width = window.innerWidth;
        dustCanvas.height = window.innerHeight;
    }
    resizeDustCanvas();
    window.addEventListener('resize', resizeDustCanvas);
    
    class Particle {
        constructor() {
            this.x = Math.random() * dustCanvas.width;
            this.y = Math.random() * dustCanvas.height;
            this.size = Math.random() * 1.5 + 0.2;
            this.speedX = (Math.random() - 0.5) * 0.15;
            this.speedY = (Math.random() - 0.5) * 0.15;
            this.life = Math.random() * 0.3 + 0.1;
            this.decay = Math.random() * 0.0005 + 0.0002;
            this.maxLife = this.life;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= this.decay;
            
            // Wrap around screen
            if (this.x < 0) this.x = dustCanvas.width;
            if (this.x > dustCanvas.width) this.x = 0;
            if (this.y < 0) this.y = dustCanvas.height;
            if (this.y > dustCanvas.height) this.y = 0;
        }
        
        draw(ctx, parallaxX = 0, parallaxY = 0) {
            const alpha = (this.life / this.maxLife) * 0.5;
            ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x + parallaxX, this.y + parallaxY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Initialize with many particles
    for (let i = 0; i < 150; i++) {
        particles.push(new Particle());
    }
    
    function animateDust() {
        // Smooth mouse tracking
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const parallaxX = (mouseX - centerX) * 0.02;
        const parallaxY = (mouseY - centerY) * 0.02;
        
        dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
        
        // Occasionally spawn new particles
        if (particles.length < 200 && Math.random() < 0.3) {
            particles.push(new Particle());
        }
        
        // Reset dead particles instead of removing them
        particles.forEach(p => {
            if (p.life <= 0) {
                p.x = Math.random() * dustCanvas.width;
                p.y = Math.random() * dustCanvas.height;
                p.life = p.maxLife;
            }
            p.update();
            p.draw(dustCtx, parallaxX, parallaxY);
        });
        
        requestAnimationFrame(animateDust);
    }
    
    // ========== SUBTLE SMOKE EFFECT ==========
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.id = 'smoke-canvas';
    smokeCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -2;
        opacity: 0.4;
    `;
    document.body.insertBefore(smokeCanvas, dustCanvas);
    
    const smokeCtx = smokeCanvas.getContext('2d');
    let smokeParticles = [];
    
    function resizeSmokeCanvas() {
        smokeCanvas.width = window.innerWidth;
        smokeCanvas.height = window.innerHeight;
    }
    resizeSmokeCanvas();
    window.addEventListener('resize', resizeSmokeCanvas);
    
    class SmokeParticle {
        constructor() {
            this.x = Math.random() * smokeCanvas.width;
            this.y = Math.random() * smokeCanvas.height;
            this.size = Math.random() * 80 + 40;
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.speedY = (Math.random() - 0.5) * 0.1 - 0.05;
            this.life = Math.random() * 0.15 + 0.05;
            this.decay = Math.random() * 0.0002 + 0.0001;
            this.maxLife = this.life;
            this.angle = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.002;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.angle += this.spin;
            this.life -= this.decay;
            this.size *= 0.9998;
            
            if (this.x < -100) this.x = smokeCanvas.width + 100;
            if (this.x > smokeCanvas.width + 100) this.x = -100;
            if (this.y < -100) this.y = smokeCanvas.height + 100;
            if (this.y > smokeCanvas.height + 100) this.y = -100;
        }
        
        draw(ctx, parallaxX = 0, parallaxY = 0) {
            const alpha = (this.life / this.maxLife) * 0.25;
            ctx.save();
            ctx.translate(this.x + parallaxX, this.y + parallaxY);
            ctx.rotate(this.angle);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            gradient.addColorStop(0, `rgba(40, 70, 110, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(30, 50, 80, ${alpha * 0.6})`);
            gradient.addColorStop(1, 'rgba(10, 20, 30, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Initialize smoke particles
    for (let i = 0; i < 25; i++) {
        smokeParticles.push(new SmokeParticle());
    }
    
    function animateSmoke() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const parallaxX = (mouseX - centerX) * 0.05;
        const parallaxY = (mouseY - centerY) * 0.05;
        
        smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
        
        if (smokeParticles.length < 30 && Math.random() < 0.05) {
            smokeParticles.push(new SmokeParticle());
        }
        
        smokeParticles.forEach(p => {
            if (p.life <= 0) {
                p.x = Math.random() * smokeCanvas.width;
                p.y = smokeCanvas.height + 50;
                p.life = p.maxLife;
                p.size = Math.random() * 80 + 40;
            }
            p.update();
            p.draw(smokeCtx, parallaxX, parallaxY);
        });
        
        requestAnimationFrame(animateSmoke);
    }
    
    animateSmoke();
    
    // ========== MODAL FUNCTIONALITY ==========
    const helpBtn = document.querySelector('.help-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.querySelector('.modal-close');
    
    if (helpBtn && modalOverlay) {
        helpBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
        
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }
    
    // Create button navigation
    const createBtn = document.querySelector('button:not(.help-btn):not(.modal-close)');
    if (createBtn && createBtn.textContent === 'Create') {
        createBtn.addEventListener('click', () => {
            window.location.href = 'editor.html';
        });
    }
});
