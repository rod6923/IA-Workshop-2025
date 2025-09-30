document.addEventListener('DOMContentLoaded', () => {

      // --- LÓGICA DO PLAYER DE MÚSICA POP-UP ---
    const openPlayerBtn = document.getElementById('open-player-btn');
    if (openPlayerBtn) {
        openPlayerBtn.addEventListener('click', () => {
            const playerWidth = 300;
            const playerHeight = 380; // Altura padrão do player compacto do Spotify
            const url = 'player.html';
            const windowName = 'spotifyPlayer';
            
            // Opções para a nova janela (sem barras, etc.)
            const windowFeatures = `width=${playerWidth},height=${playerHeight},menubar=no,toolbar=no,location=no,status=no`;

            // Abre a nova janela
            window.open(url, windowName, windowFeatures);
        });
    }

    // === LÓGICA DO CANVAS DE CONSTELAÇÃO COM INTERAÇÃO DO MOUSE ===
    const canvas = document.getElementById('constellation-bg');
    if (canvas) {

        const mouse = {
            x: null,
            y: null,
            radius: 20
        };

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let particlesArray;

        // --- PARÂMETROS PARA AJUSTAR A FÍSICA ---
        const FRICTION = 0.98; // Quão rápido as partículas perdem velocidade (perto de 1 = menos atrito)
        const FORCE_MULTIPLIER = 10; // Força máxima da repulsão do mouse
        const EASE_FACTOR = 0.01; // Quão rápido as partículas voltam ao seu movimento original

        // Classe que define cada partícula
        class Particle {
            constructor(x, y, dX, dY, size, color) {
                this.x = x;
                this.y = y;
                // Posição e velocidade originais
                this.baseX = this.x;
                this.baseY = this.y;
                this.baseDirectionX = dX;
                this.baseDirectionY = dY;
                // Velocidade atual da partícula
                this.vx = dX;
                this.vy = dY;
                this.size = size;
                this.color = color;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }

            // MÉTODO 'update' TOTALMENTE REESCRITO COM FÍSICA SUAVE
            update() {
                // Calcula a distância do mouse
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                // Se a partícula estiver dentro do raio de influência do mouse
                if (distance < mouse.radius) {
                    // Calcula a força baseada na proximidade (mais perto = mais forte)
                    const force = 1 - (distance / mouse.radius);
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;

                    // Aplica a força de repulsão na velocidade (empurrando para longe)
                    this.vx -= forceDirectionX * force * FORCE_MULTIPLIER;
                    this.vy -= forceDirectionY * force * FORCE_MULTIPLIER;
                }

                // Aplica atrito para desacelerar a partícula com o tempo
                this.vx *= FRICTION;
                this.vy *= FRICTION;

                // Faz a partícula voltar suavemente ao seu movimento original
                this.vx += (this.baseDirectionX - this.vx) * EASE_FACTOR;
                this.vy += (this.baseDirectionY - this.vy) * EASE_FACTOR;

                // Lógica de colisão com as bordas da tela
                if (this.x + this.size > canvas.width || this.x - this.size < 0) {
                    this.vx = -this.vx;
                }
                if (this.y + this.size > canvas.height || this.y - this.size < 0) {
                    this.vy = -this.vy;
                }
                
                // Atualiza a posição da partícula com base na sua velocidade
                this.x += this.vx;
                this.y += this.vy;

                // Desenha a partícula
                this.draw();
            }
        }

        // Função para criar o array de partículas
        function init() {
            particlesArray = [];
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

        // Função para desenhar as linhas de conexão
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

        // Função principal de animação
        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, innerWidth, innerHeight);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        // --- LISTENERS DE EVENTOS ---
        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });
        
        window.addEventListener('resize', () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            init();
        });

        // --- INICIALIZAÇÃO ---
        init();
        animate();
    }
});