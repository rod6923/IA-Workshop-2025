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
    const recentOrdersBody = document.getElementById('recent-orders-body');
    const addSaleForm = document.getElementById('add-sale-form');

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

        // Atualiza a tabela de Pedidos Recentes
        recentOrdersBody.innerHTML = '';
        if (dashboardState.recentOrders.length === 0) {
            recentOrdersBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum pedido recente.</td></tr>';
        } else {
            dashboardState.recentOrders.forEach(order => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${order.id}</td>
                    <td>${order.name}</td>
                    <td>${formatCurrency(order.value)}</td>
                    <td><button class="remove-btn" data-order-id="${order.id}">&times;</button></td>
                `;
                recentOrdersBody.appendChild(tr);
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
    
    // Evento para o formulário de adicionar venda
    addSaleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productName = document.getElementById('product-name').value;
        const saleValue = parseFloat(document.getElementById('sale-value').value);
        const isNewCustomer = document.getElementById('new-customer').checked;

        if (productName && !isNaN(saleValue) && saleValue > 0) {
            addSale(productName, saleValue, isNewCustomer);
            addSaleForm.reset();
        } else {
            alert("Por favor, preencha os dados da venda corretamente.");
        }
    });

    // Evento para remover pedido (usando delegação de evento)
    recentOrdersBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const orderId = e.target.dataset.orderId;
            removeSale(orderId);
        }
    });

    // --- Início da Execução ---
    initializeChart(); // Cria o gráfico
    updateDashboard(); // Renderiza o estado inicial (tudo zerado)

});