import { supabase } from './_utils/supabase.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Try Supabase first
  if (supabase) {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json(data);
    } 
    
    if (req.method === 'POST') {
      // Create new client
      const newClient = req.body;
      const { data, error } = await supabase.from('clients').insert([newClient]).select();
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(201).json({ success: true, client: data[0] });
    }
  }

  // Fallback to static JSON file if Supabase is not configured or fails
  if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'data', 'clients.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      return res.status(200).json(JSON.parse(fileContents));
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  return res.status(405).json({ error: 'Method not allowed or Database not configured.' });
}
