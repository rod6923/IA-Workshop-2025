// API de Produtos - CRUD completo com Firestore
// Carrega variáveis de ambiente de .env.local em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}

import { initializeApp, getApps } from 'firebase/app';
import {
	getFirestore,
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	getDocs,
	doc,
	query,
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
	const { id } = req.query;

	// GET /api/products - Listar todos os produtos
	if (method === 'GET') {
		try {
			const q = query(collection(firestoreDb, 'products'), orderBy('createdAt', 'desc'));
			const snapshot = await getDocs(q);
			const products = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
				// Converte timestamps para strings legíveis
				createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
			}));
			return res.status(200).json(products);
		} catch (error) {
			console.error('Erro ao buscar produtos:', error);
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao buscar produtos', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao buscar produtos' });
		}
	}

	// POST /api/products - Criar novo produto
	if (method === 'POST') {
		try {
			console.log('Dados recebidos:', req.body);
			const { name, price, stock, image, description, category } = req.body;
			
			// Validação mais flexível
			if (!name || name.trim() === '') {
				return res.status(400).json({ error: 'Nome do produto é obrigatório' });
			}
			if (!price || isNaN(price) || price <= 0) {
				return res.status(400).json({ error: 'Preço deve ser um número maior que zero' });
			}
			if (stock === undefined || stock === null || isNaN(stock) || stock < 0) {
				return res.status(400).json({ error: 'Estoque deve ser um número maior ou igual a zero' });
			}

			const productData = {
				name: String(name).slice(0, 100),
				price: parseFloat(price),
				stock: parseInt(stock),
				sold: 0,
				image: String(image || ''),
				description: String(description || '').slice(0, 500),
				category: String(category || 'Geral'),
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			};

			const docRef = await addDoc(collection(firestoreDb, 'products'), productData);
			return res.status(201).json({ id: docRef.id, ...productData });
		} catch (error) {
			console.error('Erro ao criar produto:', error);
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao criar produto', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao criar produto' });
		}
	}

	// PUT /api/products/:id - Atualizar produto
	if (method === 'PUT' && id) {
		try {
			const { name, price, stock, image, description, category } = req.body;
			
			const updateData = {
				updatedAt: serverTimestamp()
			};

			if (name !== undefined) updateData.name = String(name).slice(0, 100);
			if (price !== undefined) updateData.price = parseFloat(price);
			if (stock !== undefined) updateData.stock = parseInt(stock);
			if (image !== undefined) updateData.image = String(image);
			if (description !== undefined) updateData.description = String(description).slice(0, 500);
			if (category !== undefined) updateData.category = String(category);

			await updateDoc(doc(firestoreDb, 'products', id), updateData);
			return res.status(200).json({ id, ...updateData });
		} catch (error) {
			console.error('Erro ao atualizar produto:', error);
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao atualizar produto', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao atualizar produto' });
		}
	}

	// DELETE /api/products/:id - Deletar produto
	if (method === 'DELETE' && id) {
		try {
			await deleteDoc(doc(firestoreDb, 'products', id));
			return res.status(200).json({ id, deleted: true });
		} catch (error) {
			console.error('Erro ao deletar produto:', error);
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao deletar produto', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao deletar produto' });
		}
	}

	res.setHeader('Allow', 'GET, POST, PUT, DELETE');
	return res.status(405).json({ error: 'Método não permitido' });
}
