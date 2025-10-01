document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    let cart = [];
    let allProducts = [];

    // --- ELEMENTOS DO DOM ---
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const cartContent = document.getElementById('cart-content');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCounter = document.getElementById('cart-counter');
    const itemsCount = document.getElementById('items-count');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    const updateCartBtn = document.getElementById('update-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    // --- FUNÇÕES PRINCIPAIS ---

    // 1. Inicializa a página do carrinho
    async function initCartPage() {
        try {
            // Carrega produtos do backend
            await loadAllProducts();
            
            // Carrega carrinho do localStorage
            loadCartFromStorage();
            
            // Renderiza o carrinho
            renderCart();
            
            // Atualiza contador do header
            updateCartCounter();
            
        } catch (error) {
            console.error('Erro ao inicializar carrinho:', error);
            showError();
        }
    }

    // 2. Carrega todos os produtos do backend
    async function loadAllProducts() {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        allProducts = await response.json();
    }

    // 3. Carrega carrinho do localStorage
    function loadCartFromStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    }

    // 4. Salva carrinho no localStorage
    function saveCartToStorage() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // 5. Renderiza o carrinho
    function renderCart() {
        loadingState.classList.add('hidden');
        
        if (cart.length === 0) {
            emptyState.classList.remove('hidden');
            cartContent.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        cartContent.classList.remove('hidden');
        
        renderCartItems();
        updateOrderSummary();
    }

    // 6. Renderiza os itens do carrinho
    function renderCartItems() {
        cartItemsList.innerHTML = '';
        
        cart.forEach((item, index) => {
            const product = allProducts.find(p => p.id === item.id);
            if (!product) return;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${product.image || '../img/products/default.png'}" 
                     alt="${product.name}" 
                     class="cart-item-image"
                     onerror="this.src='../img/products/default.png'">
                
                <div class="cart-item-info">
                    <h3 class="cart-item-name">${product.name}</h3>
                    <span class="cart-item-category">${product.category || 'Geral'}</span>
                </div>
                
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)" 
                            ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <input type="number" 
                           class="quantity-input" 
                           value="${item.quantity}" 
                           min="1" 
                           max="10"
                           onchange="setQuantity(${index}, this.value)">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)" 
                            ${item.quantity >= 10 ? 'disabled' : ''}>+</button>
                </div>
                
                <div class="cart-item-price">
                    R$ ${(product.price * item.quantity).toFixed(2).replace('.', ',')}
                </div>
                
                <button class="remove-item-btn" onclick="removeItem(${index})" title="Remover item">
                    ×
                </button>
            `;
            cartItemsList.appendChild(cartItem);
        });

        // Atualiza contagem de itens
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        itemsCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
    }

    // 7. Atualiza resumo do pedido
    function updateOrderSummary() {
        const subtotal = cart.reduce((sum, item) => {
            const product = allProducts.find(p => p.id === item.id);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);

        // Calcula frete (grátis acima de R$ 200)
        const shipping = subtotal >= 200 ? 0 : 15;
        
        // Calcula desconto (5% acima de R$ 500)
        const discount = subtotal >= 500 ? subtotal * 0.05 : 0;
        
        const total = subtotal + shipping - discount;

        subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        shippingElement.textContent = shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2).replace('.', ',')}`;
        discountElement.textContent = discount === 0 ? 'R$ 0,00' : `- R$ ${discount.toFixed(2).replace('.', ',')}`;
        totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        // Atualiza classes para frete grátis
        if (shipping === 0) {
            shippingElement.style.color = '#1DB954';
            shippingElement.style.fontWeight = '600';
        } else {
            shippingElement.style.color = '';
            shippingElement.style.fontWeight = '';
        }
    }

    // 8. Atualiza quantidade de um item
    function updateQuantity(index, change) {
        const newQuantity = cart[index].quantity + change;
        if (newQuantity >= 1 && newQuantity <= 10) {
            cart[index].quantity = newQuantity;
            saveCartToStorage();
            renderCart();
            updateCartCounter();
        }
    }

    // 9. Define quantidade específica de um item
    function setQuantity(index, value) {
        const quantity = parseInt(value);
        if (quantity >= 1 && quantity <= 10) {
            cart[index].quantity = quantity;
            saveCartToStorage();
            renderCart();
            updateCartCounter();
        } else {
            // Reverte para valor anterior se inválido
            renderCart();
        }
    }

    // 10. Remove item do carrinho
    function removeItem(index) {
        if (confirm('Tem certeza que deseja remover este item do carrinho?')) {
            cart.splice(index, 1);
            saveCartToStorage();
            renderCart();
            updateCartCounter();
        }
    }

    // 11. Atualiza contador do carrinho no header
    function updateCartCounter() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // 12. Mostra erro
    function showError() {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <div class="empty-cart-content">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h2>Erro ao carregar carrinho</h2>
                <p>Ocorreu um erro ao carregar seus itens. Tente novamente.</p>
                <button onclick="location.reload()" class="btn-primary">Tentar Novamente</button>
            </div>
        `;
    }

    // 13. Finaliza compra
    async function finalizePurchase() {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        try {
            // Registra todas as vendas no backend
            for (const item of cart) {
                for (let i = 0; i < item.quantity; i++) {
                    await registerSale(item.id);
                }
            }

            // Limpa o carrinho
            cart = [];
            saveCartToStorage();
            updateCartCounter();

            // Redireciona para página de obrigado
            window.location.href = 'obrigado.html';

        } catch (error) {
            console.error('Erro ao finalizar compra:', error);
            alert('Erro ao finalizar compra. Tente novamente.');
        }
    }

    // 14. Registra venda no backend
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

    // --- EVENT LISTENERS ---

    // Botão atualizar carrinho
    updateCartBtn.addEventListener('click', () => {
        renderCart();
        updateCartCounter();
    });

    // Botão finalizar compra
    checkoutBtn.addEventListener('click', finalizePurchase);

    // Torna funções globais para uso nos botões
    window.updateQuantity = updateQuantity;
    window.setQuantity = setQuantity;
    window.removeItem = removeItem;

    // --- INICIALIZAÇÃO ---
    initCartPage();
});
