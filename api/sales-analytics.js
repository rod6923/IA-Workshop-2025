// API de Analytics de Vendas - Dados para gráficos
// Carrega variáveis de ambiente de .env.local em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}

import { initializeApp, getApps } from 'firebase/app';
import {
	getFirestore,
	collection,
	getDocs,
	query,
	where,
	orderBy,
	serverTimestamp
} from 'firebase/firestore';

let firebaseApp = null;
let firestoreDb = null;

function ensureFirebaseInitialized() {
	if (firebaseApp && firestoreDb) return;
	const rawConfig = process.env.FIREBASE_CONFIG;
	if (!rawConfig) {
		throw new Error('FIREBASE_CONFIG não configurado nas variáveis de ambiente');
	}
	let firebaseConfig;
	try {
		firebaseConfig = JSON.parse(rawConfig);
	} catch (e) {
		throw new Error('FIREBASE_CONFIG inválido. Esperado JSON string.');
	}
	if (!getApps().length) {
		firebaseApp = initializeApp(firebaseConfig);
	} else {
		firebaseApp = getApps()[0];
	}
	firestoreDb = getFirestore(firebaseApp);
}

export default async function handler(req, res) {
	try {
		ensureFirebaseInitialized();
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}

	const { method } = req;

	if (method === 'GET') {
		try {
			// Busca todos os produtos para calcular vendas
			const productsSnapshot = await getDocs(collection(firestoreDb, 'products'));
			const products = productsSnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));

			// Calcula receita mensal baseada nas vendas dos produtos
			const monthlyRevenue = calculateMonthlyRevenue(products);
			
			// Calcula métricas gerais
			const totalRevenue = products.reduce((sum, product) => sum + (product.price * product.sold), 0);
			const totalSales = products.reduce((sum, product) => sum + product.sold, 0);
			const totalProducts = products.length;
			const lowStockProducts = products.filter(p => p.stock <= 5).length;

			// Top produtos mais vendidos
			const topProducts = products
				.filter(p => p.sold > 0)
				.sort((a, b) => b.sold - a.sold)
				.slice(0, 5)
				.map(p => ({
					name: p.name,
					sold: p.sold,
					revenue: p.price * p.sold
				}));

			return res.status(200).json({
				monthlyRevenue,
				totalRevenue,
				totalSales,
				totalProducts,
				lowStockProducts,
				topProducts
			});
		} catch (error) {
			console.error('Erro ao buscar analytics:', error);
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao buscar analytics', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao buscar analytics' });
		}
	}

	res.setHeader('Allow', 'GET');
	return res.status(405).json({ error: 'Método não permitido' });
}

// Calcula receita mensal baseada nas vendas dos produtos
function calculateMonthlyRevenue(products) {
	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();
	
	// Array com os últimos 6 meses
	const monthlyData = [];
	
	for (let i = 5; i >= 0; i--) {
		const targetDate = new Date(currentYear, currentMonth - i, 1);
		const monthName = targetDate.toLocaleDateString('pt-BR', { month: 'long' });
		
		// Simula distribuição das vendas pelos meses
		// Como não temos timestamps das vendas individuais, distribuímos proporcionalmente
		const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
		const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.sold), 0);
		
		// Distribui as vendas pelos últimos 6 meses com mais vendas nos meses recentes
		let monthRevenue = 0;
		if (totalSold > 0) {
			// Distribuição: 40% no mês atual, 25% no anterior, 15% no anterior, etc.
			const distribution = [0.4, 0.25, 0.15, 0.1, 0.05, 0.05];
			const monthIndex = 5 - i;
			monthRevenue = totalRevenue * distribution[monthIndex];
		}
		
		monthlyData.push({
			month: monthName,
			revenue: Math.round(monthRevenue)
		});
	}
	
	return monthlyData;
}
