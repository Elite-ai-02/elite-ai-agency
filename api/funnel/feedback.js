import { supabase } from '../_utils/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const feedbackData = req.body;
  if (!feedbackData.id) feedbackData.id = 'fb_' + Date.now();

  if (supabase) {
    // Insert feedback
    await supabase.from('feedback').insert([feedbackData]);

    // Update analytics
    const { data } = await supabase.from('analytics').select('internalFeedback').eq('id', 1).single();
    if (data) {
      await supabase.from('analytics').update({
        internalFeedback: (data.internalFeedback || 0) + 1
      }).eq('id', 1);
    }
  }

  return res.status(200).json({ success: true });
}
