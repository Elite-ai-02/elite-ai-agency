export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pin } = req.body;
  const adminPin = process.env.ADMIN_PIN || 'khushi.2007';

  if (pin === adminPin) {
    // In a real Vercel production app, we would use iron-session or issue a JWT.
    // For this migration, we issue a token that the frontend expects.
    const token = 'token_' + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ success: false, error: 'Access Denied: Invalid Master Passkey.' });
}
