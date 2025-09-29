document.addEventListener('DOMContentLoaded', () => {

    // === LÓGICA DO CARROSSEL "CENTER STAGE" ===
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-button.next');
        const prevButton = document.querySelector('.carousel-button.prev');
        let currentIndex = 0;

        const updateCarousel = () => {
            const containerWidth = track.parentElement.getBoundingClientRect().width;
            const slideWidth = slides[0].getBoundingClientRect().width;
            const offset = (containerWidth / 2) - (slideWidth / 2) - (currentIndex * slideWidth);
            track.style.transform = `translateX(${offset}px)`;
            slides.forEach((slide, index) => {
                slide.classList.toggle('active-slide', index === currentIndex);
            });
        };

        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        });

        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        });
        
        slides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                if(index !== currentIndex) {
                    currentIndex = index;
                    updateCarousel();
                }
            });
        });

        window.addEventListener('resize', updateCarousel);
        setTimeout(updateCarousel, 100); // Pequeno timeout para garantir que as dimensões estejam corretas no carregamento
    }

    // === LÓGICA DO LIGHTBOX (VISUALIZADOR DE IMAGEM) ===
    const pageWrapper = document.getElementById('page-wrapper');
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDesc = document.getElementById('lightbox-description');
        const projectItems = document.querySelectorAll('.project-item');
        const closeBtn = document.querySelector('.close-lightbox');

        projectItems.forEach(item => {
            // Adiciona o evento de clique apenas na imagem dentro do item
            const img = item.querySelector('img');
            img.addEventListener('click', (e) => {
                e.stopPropagation(); // Impede que o clique na imagem também acione o clique no 'item' para navegação
                
                // Pega os dados do elemento pai '.project-item'
                const title = item.dataset.title || '';
                const description = item.dataset.description || 'Este projeto não possui uma descrição.';

                // Popula o lightbox
                lightboxImg.src = img.src;
                lightboxTitle.textContent = title;
                lightboxDesc.textContent = description;
                
                // Mostra o lightbox e aplica o blur
                lightbox.style.display = 'flex';
                pageWrapper.classList.add('blur-background');
            });
        });

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            pageWrapper.classList.remove('blur-background');
        }

        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

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
            let numParticles = (canvas.height * canvas.width) / 11000;
            for (let i = 0; i < numParticles; i++) {
                let size = (Math.random() * 1.5) + 1;
                let x = Math.random() * (innerWidth - size * 2) + size * 2;
                let y = Math.random() * (innerHeight - size * 2) + size * 2;
                let dX = (Math.random() * 0.4) - 0.2; let dY = (Math.random() * 0.4) - 0.2;
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
                        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            requestAnimationFrame(animate); ctx.clearRect(0, 0, innerWidth, innerHeight);
            particlesArray.forEach(p => p.update());
            connect();
        }

        init(); animate();
        window.addEventListener('resize', () => { canvas.width = innerWidth; canvas.height = innerHeight; init(); });
    }
});