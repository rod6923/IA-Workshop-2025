if (process.env.NODE_ENV !== 'production') {
    try { (await import('dotenv')).config({ path: '.env.local' }); } catch {}
}
export default function handler(req, res) {
    const hasDeepseek = Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 0);
    const hasFirebase = Boolean(process.env.FIREBASE_CONFIG && process.env.FIREBASE_CONFIG.length > 0);
    res.status(200).json({ hasDeepseek, hasFirebase, nodeEnv: process.env.NODE_ENV || 'undefined' });
}


