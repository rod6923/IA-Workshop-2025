document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const cartCounter = document.getElementById('cart-counter');
    let cartCount = 0;

    // --- BANCO DE DADOS DE PRODUTOS ---
    const products = [
        { id: 1, title: 'Teclado Mecânico Gamer RGB', category: 'Periféricos', price: 349.90, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=Teclado' },
        { id: 2, title: 'Mouse Gamer Sem Fio 16000 DPI', category: 'Periféricos', price: 499.99, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=Mouse' },
        { id: 3, title: 'Monitor Curvo Ultrawide 34" 144Hz', category: 'Monitores', price: 2899.00, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=Monitor' },
        { id: 4, title: 'Headset Gamer 7.1 Surround Sound', category: 'Áudio', price: 599.50, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=Headset' },
        { id: 5, title: 'Placa de Vídeo RTX 5080 16GB', category: 'Hardware', price: 7999.90, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=GPU' },
        { id: 6, title: 'Gabinete ATX com Vidro Temperado', category: 'Hardware', price: 650.00, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=Gabinete' },
        { id: 7, title: 'SSD NVMe 2TB Gen 4', category: 'Armazenamento', price: 1200.00, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=SSD' },
        { id: 8, title: 'Cadeira Gamer Ergonômica', category: 'Móveis', price: 1599.90, image: 'https://via.placeholder.com/400x300/0D0D0D/FF073A?text=Cadeira' }
    ];

    // --- LÓGICA DO BANNER ROTATIVO ---
    const bannerSlides = document.querySelectorAll('.banner-slide');
    let currentSlide = 0;
    function showNextSlide() {
        bannerSlides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % bannerSlides.length;
        bannerSlides[currentSlide].classList.add('active');
    }
    setInterval(showNextSlide, 5000); // Muda o banner a cada 5 segundos

    // --- LÓGICA DA GRADE DE PRODUTOS ---
    const displayProducts = () => {
        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.title}" class="product-image">
                </div>
                <div class="product-info">
                    <p class="product-category">${product.category}</p>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-footer">
                        <p class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                        <button class="add-to-cart-btn" data-id="${product.id}">Adicionar</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    // --- LÓGICA DO CARRINHO ---
    productGrid.addEventListener('click', (e) => {
        if (e.target.matches('.add-to-cart-btn')) {
            const button = e.target;
            if (button.disabled) return;
            cartCount++;
            cartCounter.innerText = cartCount;
            button.innerText = 'Adicionado!';
            button.classList.add('added');
            button.disabled = true;
            const cartWidget = document.querySelector('.cart-widget');
            cartWidget.style.transform = 'scale(1.2)';
            setTimeout(() => { cartWidget.style.transform = 'scale(1)'; }, 200);
        }
    });

    // Inicia a loja
    displayProducts();
});