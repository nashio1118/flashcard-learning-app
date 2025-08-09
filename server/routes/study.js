import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 学習統計取得
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 基本統計
    const totalStudied = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_records WHERE user_id = ?',
      [userId]
    );

    const correctAnswers = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_records WHERE user_id = ? AND is_correct = 1',
      [userId]
    );

    const incorrectAnswers = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_records WHERE user_id = ? AND is_correct = 0',
      [userId]
    );

    // 連続正解数を計算
    const recentRecords = await db.allAsync(`
      SELECT is_correct 
      FROM study_records 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 100
    `, [userId]);

    let currentStreak = 0;
    for (const record of recentRecords) {
      if (record.is_correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 最高連続正解数を計算
    let bestStreak = 0;
    let tempStreak = 0;
    
    const allRecords = await db.allAsync(`
      SELECT is_correct 
      FROM study_records 
      WHERE user_id = ? 
      ORDER BY timestamp ASC
    `, [userId]);

    for (const record of allRecords) {
      if (record.is_correct) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const stats = {
      totalStudied: totalStudied.count,
      correctAnswers: correctAnswers.count,
      incorrectAnswers: incorrectAnswers.count,
      streak: currentStreak,
      bestStreak: bestStreak
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching study stats:', error);
    res.status(500).json({ message: '学習統計の取得中にエラーが発生しました' });
  }
});

// 回答記録
router.post('/answer', authenticateToken, async (req, res) => {
  try {
    const { wordId, isCorrect, timestamp } = req.body;
    const userId = req.user.id;

    if (!wordId || typeof isCorrect !== 'boolean') {
      return res.status(400).json({ message: '必要なパラメータが不足しています' });
    }

    // 単語が存在するかチェック
    const word = await db.getAsync('SELECT id FROM words WHERE id = ?', [wordId]);
    if (!word) {
      return res.status(404).json({ message: '単語が見つかりません' });
    }

    // 学習記録を保存
    await db.runAsync(
      'INSERT INTO study_records (user_id, word_id, is_correct, timestamp) VALUES (?, ?, ?, ?)',
      [userId, wordId, isCorrect ? 1 : 0, timestamp || new Date().toISOString()]
    );

    res.json({ message: '回答を記録しました' });
  } catch (error) {
    console.error('Error recording answer:', error);
    res.status(500).json({ message: '回答の記録中にエラーが発生しました' });
  }
});

// 学習履歴取得
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const history = await db.allAsync(`
      SELECT 
        sr.*,
        w.english,
        w.japanese,
        w.level
      FROM study_records sr
      JOIN words w ON sr.word_id = w.id
      WHERE sr.user_id = ?
      ORDER BY sr.timestamp DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json(history);
  } catch (error) {
    console.error('Error fetching study history:', error);
    res.status(500).json({ message: '学習履歴の取得中にエラーが発生しました' });
  }
});

// 日別学習統計
router.get('/stats/daily', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const dailyStats = await db.allAsync(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_studied,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect_answers
      FROM study_records 
      WHERE user_id = ? 
        AND timestamp >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `, [userId, parseInt(days)]);

    res.json(dailyStats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ message: '日別統計の取得中にエラーが発生しました' });
  }
});

// 苦手単語取得
router.get('/difficult-words', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const difficultWords = await db.allAsync(`
      SELECT 
        w.*,
        COUNT(*) as attempt_count,
        SUM(CASE WHEN sr.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(
          (SUM(CASE WHEN sr.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
        ) as accuracy_rate
      FROM words w
      JOIN study_records sr ON w.id = sr.word_id
      WHERE sr.user_id = ?
      GROUP BY w.id
      HAVING attempt_count >= 3
      ORDER BY accuracy_rate ASC, attempt_count DESC
      LIMIT ?
    `, [userId, parseInt(limit)]);

    res.json(difficultWords);
  } catch (error) {
    console.error('Error fetching difficult words:', error);
    res.status(500).json({ message: '苦手単語の取得中にエラーが発生しました' });
  }
});

export default router;