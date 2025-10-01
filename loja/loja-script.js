document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    let products = []; // Array que será preenchido com dados do backend

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

    // 1. Carrega produtos do backend
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            products = await response.json();
            renderProducts();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showErrorMessage('Erro ao carregar produtos. Verifique sua conexão.');
        }
    }

    // 2. Renderiza os produtos na página
    function renderProducts() {
        productGrid.innerHTML = '';
        
        if (products.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--secondary-text); padding: 2rem;">Nenhum produto disponível no momento.</p>';
            return;
        }

        products.forEach(product => {
            // Calcular preço com desconto PIX (15%)
            const pixDiscount = 0.15;
            const pixPrice = product.price * (1 - pixDiscount);
            const installmentPrice = product.price / 12;
            
            const productCard = `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-image-container">
                        <img src="${product.image || '../img/products/default.png'}" alt="${product.name}" class="product-image" onerror="this.src='../img/products/default.png'">
                    </div>
                    <div class="product-info">
                        <span class="product-category">${product.category || 'Geral'}</span>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-stock">
                            <span class="stock-info ${product.stock <= 5 ? 'low-stock' : ''}">
                                ${product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                            </span>
                        </div>
                        <div class="product-price">
                            R$ ${product.price.toFixed(2).replace('.', ',')}
                        </div>
                        <div class="payment-info">
                            <div class="payment-method">À vista</div>
                            <div class="payment-method">15% de desconto no PIX</div>
                            <div class="payment-installments">
                                Em até 12x de <span class="payment-installments-price">R$ ${installmentPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div class="payment-free">Sem juros no cartão</div>
                        </div>
                        <div class="product-footer">
                            <a href="produto.html?id=${product.id}" class="view-product-btn">
                                Ver Produto
                            </a>
                        </div>
                    </div>
                </div>
            `;
            productGrid.innerHTML += productCard;
        });
    }

    // 3. Mostra mensagem de erro
    function showErrorMessage(message) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--accent-color); padding: 2rem;">
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">Tentar Novamente</button>
            </div>
        `;
    }

    // 4. Adiciona um item ao carrinho
    async function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;

        // Carrega carrinho do localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        // Salva no localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Atualiza contador do header
        updateCartCounter();
    }

    // 4.1. Atualiza contador do carrinho
    function updateCartCounter() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounterElement.textContent = totalItems;
        cartCounterElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // 5. Registra venda no backend
    async function registerSale(productId) {
        const response = await fetch('/api/products-sell', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Falha ao registrar venda');
        }

        return await response.json();
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

    // Adicionar ao carrinho e navegar para produto (usando delegação de evento)
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            e.stopPropagation(); // Evita que o clique no botão abra a página do produto
            const productId = e.target.dataset.id;
            addToCart(productId);
            // Efeito visual no botão
            e.target.textContent = 'Adicionado!';
            e.target.classList.add('added');
            setTimeout(() => {
                e.target.textContent = e.target.disabled ? 'Esgotado' : 'Adicionar';
                e.target.classList.remove('added');
            }, 1500);
        } else if (e.target.closest('.product-card')) {
            // Clica no card do produto para ir para a página individual
            const productCard = e.target.closest('.product-card');
            const productId = productCard.dataset.productId;
            window.location.href = `produto.html?id=${productId}`;
        }
    });

    // Remover do carrinho (usando delegação de evento)
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const productId = parseInt(e.target.dataset.id);
            removeFromCart(productId);
        }
    });
    
    // Abrir página do carrinho
    cartWidget.addEventListener('click', () => {
        window.location.href = 'carrinho.html';
    });
    
    // Fechar modal (se ainda existir)
    closeModalBtn.addEventListener('click', closeCartModal);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) { // Fecha apenas se clicar no fundo
            closeCartModal();
        }
    });


    // --- MENU MOBILE ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');

    function openMobileMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Previne scroll do body
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaura scroll do body
    }

    // Event listeners para o menu mobile
    mobileMenuToggle.addEventListener('click', openMobileMenu);
    mobileMenuClose.addEventListener('click', closeMobileMenu);
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);

    // Fechar menu ao clicar em um link
    const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Fechar menu com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // --- SEARCH MOBILE (Dentro do menu) ---
    const mobileSearchInput = document.querySelector('.mobile-search-input');

    // Funcionalidade de busca no menu mobile
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            // Aqui você pode implementar a lógica de busca
            console.log('Buscando por:', searchTerm);
        });

        // Focar no input quando o menu abrir
        mobileMenuToggle.addEventListener('click', () => {
            setTimeout(() => {
                if (mobileMenu.classList.contains('active')) {
                    mobileSearchInput.focus();
                }
            }, 300);
        });
    }

    // --- INICIALIZAÇÃO ---
    loadProducts(); // Carrega produtos do backend
    updateCartCounter(); // Atualiza contador do carrinho
});