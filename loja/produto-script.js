document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    let currentProduct = null;
    let allProducts = [];
    let cart = [];

    // --- ELEMENTOS DO DOM ---
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const productDetails = document.getElementById('product-details');
    const recommendationsSection = document.getElementById('recommendations-section');
    const recommendationsGrid = document.getElementById('recommendations-grid');
    
    // Elementos do produto
    const pageTitle = document.getElementById('page-title');
    const productMainImage = document.getElementById('product-main-image');
    const productCategory = document.getElementById('product-category');
    const productNameBreadcrumb = document.getElementById('product-name-breadcrumb');
    const productName = document.getElementById('product-name');
    const productStock = document.getElementById('product-stock');
    const productPrice = document.getElementById('product-price');
    const productInstallment = document.getElementById('product-installment');
    const productDescriptionText = document.getElementById('product-description-text');
    
    // Controles de quantidade
    const quantityInput = document.getElementById('quantity');
    const quantityMinus = document.getElementById('quantity-minus');
    const quantityPlus = document.getElementById('quantity-plus');
    
    // Botões de ação
    const addToCartMain = document.getElementById('add-to-cart-main');
    const buyNowBtn = document.getElementById('buy-now-btn');

    // --- FUNÇÕES PRINCIPAIS ---

    // 1. Carrega produto específico
    async function loadProduct() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            showError();
            return;
        }

        try {
            // Carrega todos os produtos primeiro
            await loadAllProducts();
            
            // Encontra o produto específico
            currentProduct = allProducts.find(p => p.id === productId);
            
            if (!currentProduct) {
                showError();
                return;
            }

            // Renderiza o produto
            renderProduct();
            await loadRecommendations();
            
            // Mostra a seção de detalhes
            loadingState.classList.add('hidden');
            productDetails.classList.remove('hidden');
            recommendationsSection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            showError();
        }
    }

    // 2. Carrega todos os produtos
    async function loadAllProducts() {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        allProducts = await response.json();
    }

    // 3. Renderiza o produto na página
    function renderProduct() {
        // Atualiza título da página
        pageTitle.textContent = `${currentProduct.name} | Ronaldo Tech`;
        
        // Imagem principal
        productMainImage.src = currentProduct.image || '../img/products/default.png';
        productMainImage.alt = currentProduct.name;
        productMainImage.onerror = () => {
            productMainImage.src = '../img/products/default.png';
        };
        
        // Informações básicas
        productCategory.textContent = currentProduct.category || 'Geral';
        productNameBreadcrumb.textContent = currentProduct.name;
        productName.textContent = currentProduct.name;
        
        // Preço
        const price = currentProduct.price;
        productPrice.textContent = `R$ ${price.toFixed(2).replace('.', ',')}`;
        productInstallment.textContent = `R$ ${(price / 12).toFixed(2).replace('.', ',')}`;
        
        // Estoque
        updateStockDisplay();
        
        // Descrição
        productDescriptionText.textContent = currentProduct.description || 'Descrição não disponível para este produto.';
        
        // Atualiza botões baseado no estoque
        updateActionButtons();
    }

    // 4. Atualiza display do estoque
    function updateStockDisplay() {
        const stock = currentProduct.stock;
        productStock.textContent = '';
        productStock.className = 'stock-badge';
        
        if (stock > 5) {
            productStock.textContent = `${stock} em estoque`;
            productStock.classList.add('in-stock');
        } else if (stock > 0) {
            productStock.textContent = `Apenas ${stock} em estoque`;
            productStock.classList.add('low-stock');
        } else {
            productStock.textContent = 'Esgotado';
            productStock.classList.add('out-of-stock');
        }
    }

    // 5. Atualiza botões de ação
    function updateActionButtons() {
        const stock = currentProduct.stock;
        const isOutOfStock = stock <= 0;
        
        addToCartMain.disabled = isOutOfStock;
        buyNowBtn.disabled = isOutOfStock;
        
        if (isOutOfStock) {
            addToCartMain.textContent = 'Produto Esgotado';
            buyNowBtn.textContent = 'Produto Esgotado';
        } else {
            addToCartMain.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.44a1.125 1.125 0 00-1.087-1.47H5.25l-.383-1.437a1.125 1.125 0 00-1.088-.835H2.25v1.5zM6 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm12 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                Adicionar ao Carrinho
            `;
            buyNowBtn.textContent = 'Comprar Agora';
        }
    }

    // 6. Carrega recomendações
    async function loadRecommendations() {
        if (!currentProduct) return;
        
        // Filtra produtos da mesma categoria, excluindo o atual
        const recommendations = allProducts
            .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
            .slice(0, 4); // Máximo 4 recomendações
        
        if (recommendations.length === 0) {
            recommendationsSection.classList.add('hidden');
            return;
        }
        
        renderRecommendations(recommendations);
    }

    // 7. Renderiza recomendações
    function renderRecommendations(recommendations) {
        recommendationsGrid.innerHTML = '';
        
        recommendations.forEach(product => {
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
                        <div class="product-footer">
                            <span class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</span>
                            <button class="add-to-cart-btn" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                                ${product.stock <= 0 ? 'Esgotado' : 'Ver Produto'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            recommendationsGrid.innerHTML += productCard;
        });
    }

    // 8. Mostra erro
    function showError() {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }

    // 9. Adiciona ao carrinho
    async function addToCart(productId, quantity = 1) {
        const product = allProducts.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;

        // Carrega carrinho do localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        // Salva no localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Atualiza contador do header
        updateCartCounter();
    }

    // 9.1. Atualiza contador do carrinho
    function updateCartCounter() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCounter = document.getElementById('cart-counter');
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // 10. Registra venda no backend
    async function registerSale(productId, quantity = 1) {
        for (let i = 0; i < quantity; i++) {
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
        }
    }

    // 11. Atualiza carrinho
    function updateCart() {
        const cartCounter = document.getElementById('cart-counter');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // --- EVENT LISTENERS ---

    // Controles de quantidade
    quantityMinus.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    quantityPlus.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        const maxValue = Math.min(currentProduct?.stock || 10, 10);
        if (currentValue < maxValue) {
            quantityInput.value = currentValue + 1;
        }
    });

    quantityInput.addEventListener('change', () => {
        const value = parseInt(quantityInput.value);
        const maxValue = Math.min(currentProduct?.stock || 10, 10);
        
        if (value < 1) quantityInput.value = 1;
        if (value > maxValue) quantityInput.value = maxValue;
    });

    // Botão adicionar ao carrinho
    addToCartMain.addEventListener('click', async () => {
        if (!currentProduct || currentProduct.stock <= 0) return;
        
        const quantity = parseInt(quantityInput.value);
        await addToCart(currentProduct.id, quantity);
        
        // Efeito visual
        addToCartMain.textContent = 'Adicionado!';
        addToCartMain.disabled = true;
        setTimeout(() => {
            addToCartMain.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.44a1.125 1.125 0 00-1.087-1.47H5.25l-.383-1.437a1.125 1.125 0 00-1.088-.835H2.25v1.5zM6 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm12 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                Adicionar ao Carrinho
            `;
            addToCartMain.disabled = false;
        }, 2000);
    });

    // Botão comprar agora
    buyNowBtn.addEventListener('click', async () => {
        if (!currentProduct || currentProduct.stock <= 0) return;
        
        const quantity = parseInt(quantityInput.value);
        await addToCart(currentProduct.id, quantity);
        
        // Redireciona para o carrinho
        window.location.href = 'carrinho.html';
    });

    // Clique nas recomendações
    recommendationsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            e.stopPropagation();
            const productId = e.target.dataset.id;
            const product = allProducts.find(p => p.id === productId);
            if (product && product.stock > 0) {
                addToCart(productId);
            }
        } else if (e.target.closest('.product-card')) {
            const productCard = e.target.closest('.product-card');
            const productId = productCard.dataset.productId;
            window.location.href = `produto.html?id=${productId}`;
        }
    });

    // --- INICIALIZAÇÃO ---
    loadProduct();
    updateCartCounter(); // Atualiza contador do carrinho
});
