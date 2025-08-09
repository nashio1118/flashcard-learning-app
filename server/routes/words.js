import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 単語一覧取得
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { level, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM words';
    let params = [];

    if (level) {
      query += ' WHERE level = ?';
      params.push(level);
    }

    query += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const words = await db.allAsync(query, params);

    res.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ message: '単語の取得中にエラーが発生しました' });
  }
});

// 特定の単語取得
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const word = await db.getAsync(
      'SELECT * FROM words WHERE id = ?',
      [id]
    );

    if (!word) {
      return res.status(404).json({ message: '単語が見つかりません' });
    }

    res.json(word);
  } catch (error) {
    console.error('Error fetching word:', error);
    res.status(500).json({ message: '単語の取得中にエラーが発生しました' });
  }
});

// レベル別統計取得
router.get('/stats/levels', authenticateToken, async (req, res) => {
  try {
    const stats = await db.allAsync(`
      SELECT 
        level,
        COUNT(*) as count
      FROM words 
      GROUP BY level
      ORDER BY 
        CASE level 
          WHEN 'basic' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
        END
    `);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching word stats:', error);
    res.status(500).json({ message: '統計の取得中にエラーが発生しました' });
  }
});

export default router;