// API para registrar vendas de produtos
// Carrega variáveis de ambiente de .env.local em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}

import { initializeApp, getApps } from 'firebase/app';
import {
	getFirestore,
	doc,
	updateDoc,
	increment,
	serverTimestamp,
	getDoc
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

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Método não permitido' });
	}

	const { productId, quantity = 1 } = req.body;

	if (!productId) {
		return res.status(400).json({ error: 'productId é obrigatório' });
	}

	try {
		// Verifica se o produto existe e tem estoque
		const productRef = doc(firestoreDb, 'products', productId);
		const productSnap = await getDoc(productRef);
		
		if (!productSnap.exists()) {
			return res.status(404).json({ error: 'Produto não encontrado' });
		}

		const productData = productSnap.data();
		
		if (productData.stock < quantity) {
			return res.status(400).json({ 
				error: 'Estoque insuficiente', 
				available: productData.stock,
				requested: quantity 
			});
		}

		// Atualiza estoque e vendas
		await updateDoc(productRef, {
			stock: increment(-quantity),
			sold: increment(quantity),
			updatedAt: serverTimestamp()
		});

		// Retorna dados atualizados
		const updatedSnap = await getDoc(productRef);
		const updatedData = updatedSnap.data();

		return res.status(200).json({
			success: true,
			product: {
				id: productId,
				name: updatedData.name,
				price: updatedData.price,
				stock: updatedData.stock,
				sold: updatedData.sold
			},
			quantity
		});

	} catch (error) {
		console.error('Erro ao registrar venda:', error);
		if (process.env.NODE_ENV !== 'production') {
			return res.status(500).json({ 
				error: 'Falha ao registrar venda', 
				details: error.message,
				code: error.code 
			});
		}
		return res.status(500).json({ error: 'Falha ao registrar venda' });
	}
}
