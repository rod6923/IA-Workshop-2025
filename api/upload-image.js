// API para upload de imagens usando Imgur (gratuito)
// Carrega variáveis de ambiente de .env.local em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Método não permitido' });
	}

	try {
		// Verifica se há arquivo no corpo da requisição
		if (!req.body || !req.body.file) {
			return res.status(400).json({ error: 'Nenhum arquivo enviado' });
		}

		const { file, fileName } = req.body;
		
		// Valida se é uma imagem
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return res.status(400).json({ 
				error: 'Tipo de arquivo não permitido. Use: JPG, PNG ou WEBP' 
			});
		}

		// Valida tamanho (máximo 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return res.status(400).json({ 
				error: 'Arquivo muito grande. Máximo 5MB' 
			});
		}

		// Upload para Imgur (gratuito)
		const formData = new FormData();
		formData.append('image', file.data);
		formData.append('type', 'base64');
		formData.append('title', fileName);

		const imgurResponse = await fetch('https://api.imgur.com/3/image', {
			method: 'POST',
			headers: {
				'Authorization': 'Client-ID 546c25a59c58ad7', // Client ID público do Imgur
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				image: file.data,
				type: 'base64',
				title: fileName
			})
		});

		if (!imgurResponse.ok) {
			throw new Error('Falha no upload para Imgur');
		}

		const imgurData = await imgurResponse.json();
		
		if (!imgurData.success) {
			throw new Error(imgurData.data?.error || 'Erro no Imgur');
		}

		return res.status(200).json({
			success: true,
			url: imgurData.data.link,
			fileName: fileName,
			imgurId: imgurData.data.id
		});

	} catch (error) {
		console.error('Erro no upload:', error);
		if (process.env.NODE_ENV !== 'production') {
			return res.status(500).json({ 
				error: 'Falha no upload', 
				details: error.message
			});
		}
		return res.status(500).json({ error: 'Falha no upload da imagem' });
	}
}
