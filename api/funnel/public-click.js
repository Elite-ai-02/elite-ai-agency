import { supabase } from '../_utils/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (supabase) {
    const { data } = await supabase.from('analytics').select('googleRedirects').eq('id', 1).single();
    if (data) {
      await supabase.from('analytics').update({
        googleRedirects: (data.googleRedirects || 0) + 1
      }).eq('id', 1);
    }
  }

  return res.status(200).json({ success: true });
}
