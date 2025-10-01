document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ESTADO CENTRAL DA APLICAÇÃO ---
    // Nossa "única fonte da verdade". Todas as mudanças acontecem aqui primeiro.
    const dashboardState = {
        revenue: 0,
        salesCount: 0,
        newCustomers: 0,
        recentOrders: [], // Array de objetos {id, name, value}
        productSales: {}, // Objeto para contar vendas por produto
        monthlySalesData: [25000, 28000, 35000, 32000, 41000, 0] // O último mês começa zerado
    };

    // --- 2. VARIÁVEIS E ELEMENTOS DO DOM ---
    let salesChart; // Variável para guardar a instância do gráfico
    const kpiRevenue = document.getElementById('kpi-revenue');
    const kpiSales = document.getElementById('kpi-sales');
    const kpiCustomers = document.getElementById('kpi-customers');
    const kpiTicket = document.getElementById('kpi-ticket');
    const topProductsList = document.getElementById('top-products-list');
    const lowStockBody = document.getElementById('low-stock-body');
    
    // Elementos da seção de produtos
    const addProductBtn = document.getElementById('add-product-btn');
    const productFormContainer = document.getElementById('product-form-container');
    const productForm = document.getElementById('product-form');
    const cancelProductBtn = document.getElementById('cancel-product-btn');
    const productsTableBody = document.getElementById('products-table-body');
    
    // Estado dos produtos
    let products = [];
    let editingProductId = null;
    let currentImageUrl = null;

    // --- 3. FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---
    // Lê o 'dashboardState' e atualiza toda a interface.
    function updateDashboard() {
        // Formata valores para moeda brasileira
        const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Atualiza os KPIs
        kpiRevenue.textContent = formatCurrency(dashboardState.revenue);
        kpiSales.textContent = dashboardState.salesCount;
        kpiCustomers.textContent = dashboardState.newCustomers;
        const ticketAverage = dashboardState.salesCount > 0 ? dashboardState.revenue / dashboardState.salesCount : 0;
        kpiTicket.textContent = formatCurrency(ticketAverage);

        // Atualiza a lista de Top 5 Produtos
        topProductsList.innerHTML = '';
        const sortedProducts = Object.entries(dashboardState.productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        if (sortedProducts.length === 0) {
            topProductsList.innerHTML = '<li>Nenhuma venda registrada.</li>';
        } else {
            sortedProducts.forEach(([name, count]) => {
                const li = document.createElement('li');
                li.innerHTML = `${name} <span>(${count} un.)</span>`;
                topProductsList.appendChild(li);
            });
        }

        // Atualiza a tabela de Produtos com Estoque Baixo
        lowStockBody.innerHTML = '';
        const lowStockProducts = products.filter(product => product.stock <= 5);
        
        if (lowStockProducts.length === 0) {
            lowStockBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Todos os produtos com estoque adequado.</td></tr>';
        } else {
            lowStockProducts.forEach(product => {
                const tr = document.createElement('tr');
                const status = product.stock === 0 ? 'Esgotado' : product.stock <= 2 ? 'Crítico' : 'Baixo';
                const statusClass = product.stock === 0 ? 'status-critical' : product.stock <= 2 ? 'status-warning' : 'status-low';
                
                tr.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.stock}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                `;
                lowStockBody.appendChild(tr);
            });
        }
        
        // Atualiza os dados do gráfico
        salesChart.data.datasets[0].data = dashboardState.monthlySalesData;
        salesChart.update();
    }

    // --- 4. FUNÇÕES DE LÓGICA (adicionar/remover vendas) ---

    function addSale(name, value, isNewCustomer) {
        const orderId = Date.now(); // ID único baseado no tempo

        // Atualiza o estado
        dashboardState.revenue += value;
        dashboardState.salesCount++;
        if (isNewCustomer) {
            dashboardState.newCustomers++;
        }
        
        // Adiciona à lista de pedidos (sempre no topo)
        dashboardState.recentOrders.unshift({ id: orderId, name, value });

        // Atualiza a contagem de produtos
        dashboardState.productSales[name] = (dashboardState.productSales[name] || 0) + 1;
        
        // Adiciona ao valor do mês atual no gráfico (último item do array)
        dashboardState.monthlySalesData[dashboardState.monthlySalesData.length - 1] += value;

        // Re-renderiza a UI
        updateDashboard();
    }

    function removeSale(orderIdToRemove) {
        // Encontra o pedido a ser removido
        const orderIndex = dashboardState.recentOrders.findIndex(order => order.id == orderIdToRemove);
        if (orderIndex === -1) return; // Se não achar, sai da função

        const orderToRemove = dashboardState.recentOrders[orderIndex];

        // Reverte as mudanças no estado
        dashboardState.revenue -= orderToRemove.value;
        dashboardState.salesCount--;
        
        // Decrementa a contagem do produto
        dashboardState.productSales[orderToRemove.name]--;
        if (dashboardState.productSales[orderToRemove.name] === 0) {
            delete dashboardState.productSales[orderToRemove.name];
        }

        // Remove do valor do mês atual no gráfico
        dashboardState.monthlySalesData[dashboardState.monthlySalesData.length - 1] -= orderToRemove.value;

        // Remove o pedido da lista
        dashboardState.recentOrders.splice(orderIndex, 1);

        // Re-renderiza a UI
        updateDashboard();
    }

    // --- 5. INICIALIZAÇÃO E EVENT LISTENERS ---

    function initializeChart() {
        const ctx = document.getElementById('salesChart').getContext('2d');
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        const glowColor = getComputedStyle(document.documentElement).getPropertyValue('--glow-color').trim();
        const secondaryTextColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-text').trim();

        const config = {
            type: 'line',
            data: {
                labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'],
                datasets: [{
                    label: 'Receita Mensal',
                    data: dashboardState.monthlySalesData,
                    fill: true,
                    backgroundColor: glowColor,
                    borderColor: accentColor,
                    pointBackgroundColor: accentColor,
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: secondaryTextColor }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: { ticks: { color: secondaryTextColor }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, beginAtZero: true }
                }
            }
        };
        salesChart = new Chart(ctx, config);
    }
    

    // --- FUNÇÕES DE PRODUTOS ---
    
    // Carrega produtos do banco de dados
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || `Erro HTTP ${response.status}: ${response.statusText}`);
            }
            products = await response.json();
            renderProductsTable();
            
            // Atualiza métricas baseadas nos produtos
            updateMetricsFromProducts();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            // Só mostra alert se for um erro crítico, não para erros de rede temporários
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.warn('Erro de rede ao carregar produtos. Tentando novamente...');
                // Tenta recarregar após 2 segundos
                setTimeout(() => loadProducts(), 2000);
            } else {
                alert(`Erro ao carregar produtos: ${error.message}`);
            }
        }
    }
    
    // Atualiza métricas baseadas nos produtos do banco
    function updateMetricsFromProducts() {
        let totalRevenue = 0;
        let totalSales = 0;
        
        products.forEach(product => {
            totalRevenue += product.price * product.sold;
            totalSales += product.sold;
        });
        
        dashboardState.revenue = totalRevenue;
        dashboardState.salesCount = totalSales;
        dashboardState.newCustomers = Math.floor(totalSales * 0.3); // Simulação: 30% são novos clientes
        
        // Atualiza contagem de vendas por produto
        dashboardState.productSales = {};
        products.forEach(product => {
            if (product.sold > 0) {
                dashboardState.productSales[product.name] = product.sold;
            }
        });
        
        // Carrega dados de analytics para o gráfico
        loadAnalyticsData();
    }

    // Carrega dados de analytics para gráficos e métricas
    async function loadAnalyticsData() {
        try {
            const response = await fetch('/api/sales-analytics');
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            
            const analytics = await response.json();
            
            // Atualiza dados do gráfico com receita mensal real
            dashboardState.monthlySalesData = analytics.monthlyRevenue.map(month => month.revenue);
            
            // Atualiza labels do gráfico com nomes dos meses reais
            if (salesChart && analytics.monthlyRevenue.length > 0) {
                salesChart.data.labels = analytics.monthlyRevenue.map(month => 
                    month.month.charAt(0).toUpperCase() + month.month.slice(1)
                );
            }
            
            // Atualiza métricas com dados mais precisos
            dashboardState.revenue = analytics.totalRevenue;
            dashboardState.salesCount = analytics.totalSales;
            
            // Atualiza top produtos com dados da API
            dashboardState.productSales = {};
            analytics.topProducts.forEach(product => {
                dashboardState.productSales[product.name] = product.sold;
            });
            
            updateDashboard();
        } catch (error) {
            console.error('Erro ao carregar analytics:', error);
            // Continua com dados dos produtos se a API falhar
            updateDashboard();
        }
    }
    
    // Renderiza a tabela de produtos
    function renderProductsTable() {
        productsTableBody.innerHTML = '';
        
        if (products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--secondary-text);">Nenhum produto cadastrado</td></tr>';
            return;
        }
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">` : 
                        '<div class="product-image" style="background: #333; display: flex; align-items: center; justify-content: center; color: #666;">N/A</div>'
                    }
                </td>
                <td>${product.name}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.sold}</td>
                <td>${product.category}</td>
                <td>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="editProduct('${product.id}')">Editar</button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')">Excluir</button>
                    </div>
                </td>
            `;
            productsTableBody.appendChild(row);
        });
    }
    
    // Upload de imagem
    async function uploadImage(file) {
        try {
            // Converte arquivo para base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: {
                        data: base64,
                        type: file.type,
                        size: file.size
                    },
                    fileName: file.name
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Falha no upload');
            }

            const result = await response.json();
            return result.url;
        } catch (error) {
            console.error('Erro no upload:', error);
            throw error;
        }
    }

    // Adiciona/edita produto
    async function saveProduct(productData) {
        try {
            // Se há arquivo de imagem, faz upload primeiro
            const imageFile = document.getElementById('product-image').files[0];
            if (imageFile) {
                productData.image = await uploadImage(imageFile);
            } else if (currentImageUrl) {
                productData.image = currentImageUrl;
            } else {
                productData.image = ''; // Campo obrigatório
            }

            const url = editingProductId ? `/api/products` : '/api/products';
            const method = editingProductId ? 'PUT' : 'POST';
            const body = editingProductId ? { ...productData, id: editingProductId } : productData;
            
            console.log('Enviando dados:', body); // Debug
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const error = await response.json();
                console.error('Erro do servidor:', error); // Debug
                throw new Error(error.details || error.error || 'Falha ao salvar produto');
            }
            
            await loadProducts();
            hideProductForm();
            alert(editingProductId ? 'Produto atualizado!' : 'Produto criado!');
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert(`Erro: ${error.message}`);
        }
    }
    
    // Preview da imagem
    function showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('preview-img');
            const imagePreview = document.getElementById('image-preview');
            const imageUrlDisplay = document.getElementById('image-url-display');
            const imageUrlText = document.getElementById('image-url-text');
            
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
            imageUrlDisplay.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    // Remove preview da imagem
    function removeImagePreview() {
        const imagePreview = document.getElementById('image-preview');
        const imageUrlDisplay = document.getElementById('image-url-display');
        const fileInput = document.getElementById('product-image');
        
        imagePreview.classList.add('hidden');
        imageUrlDisplay.classList.add('hidden');
        fileInput.value = '';
        currentImageUrl = null;
    }

    // Mostra URL da imagem existente
    function showImageUrl(url) {
        const imagePreview = document.getElementById('image-preview');
        const imageUrlDisplay = document.getElementById('image-url-display');
        const imageUrlText = document.getElementById('image-url-text');
        
        imagePreview.classList.add('hidden');
        imageUrlDisplay.classList.remove('hidden');
        imageUrlText.textContent = url;
        currentImageUrl = url;
    }

    // Edita produto
    function editProduct(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        editingProductId = productId;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description || '';
        
        // Limpa input de arquivo e mostra URL existente
        document.getElementById('product-image').value = '';
        if (product.image) {
            showImageUrl(product.image);
        } else {
            removeImagePreview();
        }
        
        showProductForm();
    }
    
    // Deleta produto
    async function deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        
        try {
            const response = await fetch(`/api/products?id=${productId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Falha ao excluir produto');
            }
            
            await loadProducts();
            alert('Produto excluído!');
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert(`Erro: ${error.message}`);
        }
    }
    
    // Mostra/esconde formulário de produto
    function showProductForm() {
        productFormContainer.classList.remove('hidden');
        addProductBtn.textContent = 'Cancelar';
    }
    
    function hideProductForm() {
        productFormContainer.classList.add('hidden');
        addProductBtn.textContent = '+ Adicionar Produto';
        productForm.reset();
        removeImagePreview();
        editingProductId = null;
        currentImageUrl = null;
    }
    
    // Event listeners para produtos
    addProductBtn.addEventListener('click', () => {
        if (productFormContainer.classList.contains('hidden')) {
            showProductForm();
        } else {
            hideProductForm();
        }
    });
    
    cancelProductBtn.addEventListener('click', hideProductForm);
    
    // Event listener para upload de imagem
    document.getElementById('product-image').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showImagePreview(file);
        }
    });
    
    // Event listener para remover imagem
    document.getElementById('remove-image').addEventListener('click', removeImagePreview);
    
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Captura os valores dos inputs
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('product-price');
        const stockInput = document.getElementById('product-stock');
        const categoryInput = document.getElementById('product-category');
        const descriptionInput = document.getElementById('product-description');
        
        // Validação básica no frontend
        if (!nameInput.value.trim()) {
            alert('Nome do produto é obrigatório');
            nameInput.focus();
            return;
        }
        
        if (!priceInput.value || isNaN(priceInput.value) || parseFloat(priceInput.value) <= 0) {
            alert('Preço deve ser um número maior que zero');
            priceInput.focus();
            return;
        }
        
        if (!stockInput.value || isNaN(stockInput.value) || parseInt(stockInput.value) < 0) {
            alert('Estoque deve ser um número maior ou igual a zero');
            stockInput.focus();
            return;
        }
        
        const productData = {
            name: nameInput.value.trim(),
            price: parseFloat(priceInput.value),
            stock: parseInt(stockInput.value),
            category: categoryInput.value,
            description: descriptionInput.value.trim()
        };
        
        console.log('Dados capturados:', productData); // Debug
        saveProduct(productData);
    });
    
    // Torna funções globais para uso nos botões da tabela
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;

    // --- Início da Execução ---
    initializeChart(); // Cria o gráfico
    updateDashboard(); // Renderiza o estado inicial (tudo zerado)
    loadProducts(); // Carrega produtos do banco

});