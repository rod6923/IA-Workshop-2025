document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        // --- VARIÁVEIS E CONSTANTES ---
        const track = carouselContainer.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carouselContainer.querySelector('.carousel-button.next');
        const prevButton = carouselContainer.querySelector('.carousel-button.prev');

        if (slides.length === 0) return;

        const slideCount = slides.length;
        let isMoving = false;

        // --- LÓGICA DE CLONAGEM PARA O LOOP INFINITO ---
        slides.slice().reverse().forEach(slide => {
            track.prepend(slide.cloneNode(true));
        });

        slides.slice().forEach(slide => {
            track.append(slide.cloneNode(true));
        });

        const allSlides = Array.from(track.children);
        let currentIndex = slideCount;

        // --- FUNÇÃO PRINCIPAL DE POSICIONAMENTO ---
        const setPosition = (withTransition = true) => {
            isMoving = true;
            const slideWidth = slides[0].offsetWidth;
            const containerWidth = carouselContainer.offsetWidth;
            
            const position = - (currentIndex * slideWidth) + (containerWidth / 2) - (slideWidth / 2);

            track.style.transition = withTransition ? 'transform 0.5s ease-out' : 'none';
            track.style.transform = `translateX(${position}px)`;

            allSlides.forEach((slide, index) => {
                slide.classList.toggle('active-slide', index === currentIndex);
            });

            if (!withTransition) {
                isMoving = false;
            }
        };

        // --- HANDLERS DE EVENTOS ---
        const moveNext = () => {
            if (isMoving) return;
            currentIndex++;
            setPosition();
        };

        const movePrev = () => {
            if (isMoving) return;
            currentIndex--;
            setPosition();
        };

        const handleLoop = () => {
            isMoving = false;
            if (currentIndex >= slideCount * 2) {
                currentIndex = slideCount;
                setPosition(false);
            }
            if (currentIndex < slideCount) {
                currentIndex = slideCount * 2 - 1;
                setPosition(false);
            }
        };
        
        allSlides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                if (isMoving || index === currentIndex) return;
                currentIndex = index;
                setPosition();
            });
        });

        // --- ADICIONAR LISTENERS ---
        nextButton.addEventListener('click', moveNext);
        prevButton.addEventListener('click', movePrev);
        track.addEventListener('transitionend', handleLoop);
        window.addEventListener('resize', () => setPosition(false));

        // --- INICIALIZAÇÃO ---
        setTimeout(() => {
            setPosition(false);
        }, 100);
    }


    // === LÓGICA DO LIGHTBOX (VISUALIZADOR DE IMAGEM) ===
    const pageWrapper = document.getElementById('page-wrapper');
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        // ... (código do lightbox permanece o mesmo)
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDesc = document.getElementById('lightbox-description');
        const closeBtn = document.querySelector('.close-lightbox');

        document.body.addEventListener('click', (e) => {
            if (e.target.matches('.project-item.active-slide')) {
                const item = e.target;
                const img = item.querySelector('img');
                
                const title = item.dataset.title || '';
                const description = item.dataset.description || 'Este projeto não possui uma descrição.';

                lightboxImg.src = img.src;
                lightboxTitle.textContent = title;
                lightboxDesc.textContent = description;
                
                lightbox.style.display = 'flex';
                pageWrapper.classList.add('blur-background');
            }
        });

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            pageWrapper.classList.remove('blur-background');
        };

        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // === LÓGICA DO CANVAS DE CONSTELAÇÃO (COM INTERAÇÃO SUAVE) ===
    const canvas = document.getElementById('constellation-bg');
    if (canvas) {
        const mouse = {
            x: null,
            y: null,
            radius: 40
        };

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let particlesArray;

        const FRICTION = 0.98;
        const FORCE_MULTIPLIER = 10;
        const EASE_FACTOR = 0.01;

        class Particle {
            constructor(x, y, dX, dY, size, color) {
                this.x = x;
                this.y = y;
                this.baseDirectionX = dX;
                this.baseDirectionY = dY;
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

            update() {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const force = 1 - (distance / mouse.radius);
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;

                    this.vx -= forceDirectionX * force * FORCE_MULTIPLIER;
                    this.vy -= forceDirectionY * force * FORCE_MULTIPLIER;
                }

                this.vx *= FRICTION;
                this.vy *= FRICTION;

                this.vx += (this.baseDirectionX - this.vx) * EASE_FACTOR;
                this.vy += (this.baseDirectionY - this.vy) * EASE_FACTOR;

                if (this.x + this.size > canvas.width || this.x - this.size < 0) {
                    this.vx = -this.vx;
                }
                if (this.y + this.size > canvas.height || this.y - this.size < 0) {
                    this.vy = -this.vy;
                }
                
                this.x += this.vx;
                this.y += this.vy;

                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            let numParticles = (canvas.height * canvas.width) / 11000;
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
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = Math.sqrt(Math.pow(particlesArray[a].x - particlesArray[b].x, 2) + Math.pow(particlesArray[a].y - particlesArray[b].y, 2));
                    if (distance < (canvas.width / 70) * (canvas.height / 70)) {
                        let opacity = 1 - (distance / 150);
                        ctx.strokeStyle = `rgba(57, 255, 20, ${opacity})`;
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
            particlesArray.forEach(p => p.update());
            connect();
        }

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

        init();
        animate();
    }
});