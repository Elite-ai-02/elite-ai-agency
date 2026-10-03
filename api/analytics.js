import { supabase } from './_utils/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (supabase) {
    const { data, error } = await supabase.from('analytics').select('*').single();
    if (!error && data) {
      return res.status(200).json(data);
    }
  }

  // Fallback 
  return res.status(200).json({
    totalTaps: 0,
    googleRedirects: 0,
    internalFeedback: 0,
    positiveRatio: 0,
    lastTap: Date.now()
  });
}
