// Este é o nosso backend. Ele será executado em um ambiente seguro (Node.js).
// Carrega variáveis de ambiente de .env.local em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}

export default async function handler(req, res) {
    // Usa Google Gemini (free tier) novamente
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da IA (GEMINI_API_KEY) não configurada no servidor.' });
    }

    const prompt = [
        'Crie UMA pergunta de múltipla escolha (apenas 1 pergunta) sobre Marketing, Design (UI/UX) ou Branding.',
        'Responda EXCLUSIVAMENTE em JSON puro, SEM markdown e sem texto extra, com a estrutura:',
        '{',
        '  "question": "...",',
        '  "answers": { "A": "...", "B": "...", "C": "...", "D": "..." },',
        '  "correctAnswer": "A"',
        '}',
        'Regras:',
        '- "question" deve ser clara e objetiva.',
        '- 4 alternativas A-D, apenas uma correta.',
        '- "correctAnswer" deve ser uma letra: A, B, C ou D.'
    ].join('\n');

    try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + encodeURIComponent(apiKey);
        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            if (process.env.NODE_ENV !== 'production') {
                return res.status(response.status).json({ error: 'Gemini API error', status: response.status, body: errorBody });
            }
            throw new Error(`Erro na API do Gemini: ${response.status} ${response.statusText}. Corpo: ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = text
            .trim()
            .replace(/^```(json)?/i, '')
            .replace(/```$/i, '')
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            throw new Error('Falha ao parsear JSON retornado pelo Gemini. Conteúdo: ' + cleaned);
        }

        if (!parsed || typeof parsed !== 'object' || !parsed.question || !parsed.answers || !parsed.correctAnswer) {
            throw new Error('JSON retornado não segue o formato esperado.');
        }

        return res.status(200).json(parsed);
    } catch (error) {
        console.error('Erro ao gerar pergunta:', error);
        return res.status(500).json({ error: 'Falha ao se comunicar com a IA.' });
    }
}

