// Serverless Leaderbo  ard endpoint using Firebase (Web SDK) with Anonymous Auth
// IMPORTANT: Set process.env.FIREBASE_CONFIG with the JSON string of your firebaseConfig
// Carrega variáveis de ambiente de .env.local em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
	getFirestore,
	collection,
	addDoc,
	serverTimestamp,
	query,
	orderBy,
	limit,
	getDocs
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

	if (req.method === 'POST') {
		const { name, score, time } = req.body || {};
		if (!name || typeof score !== 'number' || typeof time !== 'number') {
			return res.status(400).json({ error: 'Campos obrigatórios: name (string), score (number), time (number)' });
		}

		try {
			// Salva diretamente no Firestore (regras permitem escrita pública)
			await addDoc(collection(firestoreDb, 'leaderboard'), {
				name: String(name).slice(0, 32),
				score,
				time,
				createdAt: serverTimestamp()
			});
			return res.status(201).json({ ok: true });
		} catch (error) {
			console.error('Erro ao salvar no leaderboard:', error);
			// Em dev, retorna o erro específico para facilitar debug
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao salvar pontuação', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao salvar pontuação' });
		}
	}

	if (req.method === 'GET') {
		try {
			// Top 10 by score desc, tie-breaker by time asc
			const q = query(
				collection(firestoreDb, 'leaderboard'),
				orderBy('score', 'desc'),
				orderBy('time', 'asc'),
				limit(10)
			);
			const snapshot = await getDocs(q);
			const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
			return res.status(200).json(results);
		} catch (error) {
			console.error('Erro ao buscar leaderboard:', error);
			// Em dev, retorna o erro específico para facilitar debug
			if (process.env.NODE_ENV !== 'production') {
				return res.status(500).json({ 
					error: 'Falha ao buscar leaderboard', 
					details: error.message,
					code: error.code 
				});
			}
			return res.status(500).json({ error: 'Falha ao buscar leaderboard' });
		}
	}

	res.setHeader('Allow', 'GET, POST');
	return res.status(405).json({ error: 'Método não permitido' });
}