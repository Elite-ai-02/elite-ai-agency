import { supabase } from './_utils/supabase.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (supabase) {
    const { data, error } = await supabase.from('feedback').select('*').order('timestamp', { ascending: false });
    if (!error && data) {
      return res.status(200).json(data);
    }
  }

  // Fallback to static JSON file if Supabase fails
  try {
    const filePath = path.join(process.cwd(), 'data', 'feedback.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return res.status(200).json(JSON.parse(fileContents));
  } catch (e) {
    return res.status(200).json([]);
  }
}
