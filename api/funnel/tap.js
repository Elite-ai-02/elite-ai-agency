import { supabase } from '../_utils/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (supabase) {
    // We increment totalTaps
    // Supabase RPC or just fetch and update. Since we only have 1 row in analytics (id=1)
    const { data } = await supabase.from('analytics').select('totalTaps').eq('id', 1).single();
    if (data) {
      await supabase.from('analytics').update({
        totalTaps: (data.totalTaps || 0) + 1,
        lastTap: Date.now()
      }).eq('id', 1);
    }
  }

  return res.status(200).json({ success: true });
}
