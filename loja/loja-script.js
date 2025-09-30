document.addEventListener('DOMContentLoaded', () => {

    // --- BANCO DE DADOS DE PRODUTOS (FICTÍCIO) ---
    const products = [
        { id: 1, name: 'Placa de Vídeo RTX 4070', category: 'Hardware', price: 3899.90, image: '../img/products/rtx4070.png' },
        { id: 2, name: 'Headset Gamer HyperX Cloud III', category: 'Periféricos', price: 699.00, image: '../img/products/hyperx-cloud.png' },
        { id: 3, name: 'Mouse Logitech G Pro X Superlight', category: 'Periféricos', price: 780.50, image: '../img/products/mouse.png' },
        { id: 4, name: 'SSD NVMe 2TB Kingston Fury', category: 'Hardware', price: 1250.00, image: '../img/products/ssd-kingston.png' },
        { id: 5, name: 'Monitor Gamer 27" 165Hz', category: 'Periféricos', price: 1799.99, image: '../img/products/monitor-gamer.png' },
        { id: 6, name: 'Processador AMD Ryzen 7 7800X3D', category: 'Hardware', price: 2899.00, image: '../img/products/processador.jpg' },
        { id: 7, name: 'Teclado Mecânico Redragon Kumara', category: 'Periféricos', price: 249.90, image: '../img/products/teclado.jpg' },
        { id: 8, name: 'Placa Mãe B650M Aorus Elite', category: 'Hardware', price: 1450.00, image: '../img/products/b650m-aorus.jpg' },
    ];

    // --- VARIÁVEIS E ELEMENTOS DO DOM ---
    const productGrid = document.getElementById('product-grid');
    const pageWrapper = document.getElementById('page-wrapper');
    const cartModal = document.getElementById('cart-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cartWidget = document.querySelector('.cart-widget');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCounterElement = document.getElementById('cart-counter');

    let cart = []; // Array que armazena os itens do carrinho

    // --- FUNÇÕES PRINCIPAIS ---

    // 1. Renderiza os produtos na página
    function renderProducts() {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const productCard = `
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="product-info">
                        <span class="product-category">${product.category}</span>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-footer">
                            <span class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</span>
                            <button class="add-to-cart-btn" data-id="${product.id}">Adicionar</button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.innerHTML += productCard;
        });
    }

    // 2. Adiciona um item ao carrinho
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
    }
    
    // 3. Remove um item do carrinho
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCart();
    }
    
    // 4. Atualiza a UI do carrinho (modal e contador)
    function updateCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty-message">Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                const cartItemHTML = `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <h4 class="cart-item-title">${item.name}</h4>
                            <span class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')} (x${item.quantity})</span>
                        </div>
                        <button class="remove-item-btn" data-id="${item.id}">&times;</button>
                    </div>
                `;
                cartItemsContainer.innerHTML += cartItemHTML;
                total += item.price * item.quantity;
                totalItems += item.quantity;
            });
        }
        
        cartTotalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        cartCounterElement.textContent = totalItems;
        cartCounterElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // 5. Funções para abrir e fechar o modal
    function openCartModal() {
        cartModal.classList.add('visible');
        pageWrapper.classList.add('blur-background');
    }

    function closeCartModal() {
        cartModal.classList.remove('visible');
        pageWrapper.classList.remove('blur-background');
    }

    // --- EVENT LISTENERS ---

    // Adicionar ao carrinho (usando delegação de evento)
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.dataset.id);
            addToCart(productId);
            // Efeito visual no botão
            e.target.textContent = 'Adicionado!';
            e.target.classList.add('added');
            setTimeout(() => {
                e.target.textContent = 'Adicionar';
                e.target.classList.remove('added');
            }, 1500);
        }
    });

    // Remover do carrinho (usando delegação de evento)
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productId = parseInt(e.target.dataset.id);
            removeFromCart(productId);
        }
    });
    
    // Abrir e fechar o modal
    cartWidget.addEventListener('click', openCartModal);
    closeModalBtn.addEventListener('click', closeCartModal);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) { // Fecha apenas se clicar no fundo
            closeCartModal();
        }
    });


    // --- INICIALIZAÇÃO ---
    renderProducts();
    updateCart(); // Para garantir que o contador inicie zerado
});