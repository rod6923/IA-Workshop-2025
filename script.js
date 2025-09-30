document.addEventListener('DOMContentLoaded', () => {

    // === LÓGICA DO CANVAS DE CONSTELAÇÃO ===
    const canvas = document.getElementById('constellation-bg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let particlesArray;

        class Particle {
            constructor(x, y, dX, dY, size, color) { this.x = x; this.y = y; this.directionX = dX; this.directionY = dY; this.size = size; this.color = color; }
            draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); }
            update() { if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX; if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY; this.x += this.directionX; this.y += this.directionY; this.draw(); }
        }

        function init() {
            particlesArray = [];
            // Ajusta a quantidade de partículas com base no tamanho da tela
            let numParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numParticles; i++) {
                let size = (Math.random() * 1.5) + 1;
                let x = Math.random() * (innerWidth - size * 2) + size * 2;
                let y = Math.random() * (innerHeight - size * 2) + size * 2;
                let dX = (Math.random() * 0.4) - 0.2;
                let dY = (Math.random() * 0.4) - 0.2;
                particlesArray.push(new Particle(x, y, dX, dY, size, 'rgba(57, 255, 20, 0.5)'));
            }
        }

        function connect() {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                                 + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                    
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        ctx.strokeStyle = `rgba(57, 255, 20, ${opacityValue})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, innerWidth, innerHeight);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        // Garante que a animação reinicie se a janela for redimensionada
        window.addEventListener('resize', () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            init();
        });

        init();
        animate();
    }
});