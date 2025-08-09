import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { db } from '../database/init.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// multerの設定（CSVアップロード用）
const upload = multer({ dest: 'uploads/' });

// 全てのルートで認証と管理者権限をチェック
router.use(authenticateToken, requireAdmin);

// ユーザー一覧取得
router.get('/users', async (req, res) => {
  try {
    const users = await db.allAsync(`
      SELECT 
        id, email, name, role, created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'ユーザー一覧の取得中にエラーが発生しました' });
  }
});

// ユーザー作成
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role = 'student' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'メールアドレスとパスワードが必要です' });
    }

    // メールアドレスの重複チェック
    const existingUser = await db.getAsync(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ message: 'このメールアドレスは既に使用されています' });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const result = await db.runAsync(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name || null, role]
    );

    res.status(201).json({ 
      message: 'ユーザーを作成しました',
      userId: result.lastID
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'ユーザー作成中にエラーが発生しました' });
  }
});

// ユーザー削除
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 自分自身は削除できない
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: '自分自身を削除することはできません' });
    }

    const result = await db.runAsync(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    res.json({ message: 'ユーザーを削除しました' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'ユーザー削除中にエラーが発生しました' });
  }
});

// 単語一覧取得
router.get('/words', async (req, res) => {
  try {
    const { level, search, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM words';
    let params = [];
    let conditions = [];

    if (level) {
      conditions.push('level = ?');
      params.push(level);
    }

    if (search) {
      conditions.push('(english LIKE ? OR japanese LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const words = await db.allAsync(query, params);

    res.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ message: '単語一覧の取得中にエラーが発生しました' });
  }
});

// 単語追加
router.post('/words', async (req, res) => {
  try {
    const { english, japanese, level = 'basic' } = req.body;

    if (!english || !japanese) {
      return res.status(400).json({ message: '英語と日本語が必要です' });
    }

    // 重複チェック
    const existingWord = await db.getAsync(
      'SELECT id FROM words WHERE english = ? AND japanese = ?',
      [english, japanese]
    );

    if (existingWord) {
      return res.status(400).json({ message: 'この単語は既に登録されています' });
    }

    const result = await db.runAsync(
      'INSERT INTO words (english, japanese, level) VALUES (?, ?, ?)',
      [english, japanese, level]
    );

    res.status(201).json({ 
      message: '単語を追加しました',
      wordId: result.lastID
    });
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ message: '単語追加中にエラーが発生しました' });
  }
});

// 単語削除
router.delete('/words/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.runAsync(
      'DELETE FROM words WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: '単語が見つかりません' });
    }

    res.json({ message: '単語を削除しました' });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ message: '単語削除中にエラーが発生しました' });
  }
});

// CSVアップロード
router.post('/words/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSVファイルが必要です' });
    }

    const words = [];
    let addedCount = 0;
    let skippedCount = 0;

    // CSVファイルを読み込み
    const stream = fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        if (row.english && row.japanese) {
          words.push({
            english: row.english.trim(),
            japanese: row.japanese.trim(),
            level: row.level ? row.level.trim() : 'basic'
          });
        }
      })
      .on('end', async () => {
        try {
          // 単語を一つずつ処理
          for (const word of words) {
            try {
              // 重複チェック
              const existingWord = await db.getAsync(
                'SELECT id FROM words WHERE english = ? AND japanese = ?',
                [word.english, word.japanese]
              );

              if (!existingWord) {
                await db.runAsync(
                  'INSERT INTO words (english, japanese, level) VALUES (?, ?, ?)',
                  [word.english, word.japanese, word.level]
                );
                addedCount++;
              } else {
                skippedCount++;
              }
            } catch (error) {
              console.error('Error inserting word:', word, error);
              skippedCount++;
            }
          }

          // 一時ファイルを削除
          fs.unlinkSync(req.file.path);

          res.json({ 
            message: 'CSVアップロードが完了しました',
            count: addedCount,
            skipped: skippedCount,
            total: words.length
          });
        } catch (error) {
          console.error('Error processing CSV:', error);
          fs.unlinkSync(req.file.path);
          res.status(500).json({ message: 'CSV処理中にエラーが発生しました' });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        fs.unlinkSync(req.file.path);
        res.status(400).json({ message: 'CSVファイルの解析に失敗しました' });
      });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'CSVアップロード中にエラーが発生しました' });
  }
});

// 全体統計取得
router.get('/stats', async (req, res) => {
  try {
    const userCount = await db.getAsync('SELECT COUNT(*) as count FROM users');
    const wordCount = await db.getAsync('SELECT COUNT(*) as count FROM words');
    const studyRecordCount = await db.getAsync('SELECT COUNT(*) as count FROM study_records');
    
    const wordsByLevel = await db.allAsync(`
      SELECT level, COUNT(*) as count 
      FROM words 
      GROUP BY level
    `);

    const activeUsers = await db.getAsync(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM study_records 
      WHERE timestamp >= datetime('now', '-7 days')
    `);

    res.json({
      users: userCount.count,
      words: wordCount.count,
      studyRecords: studyRecordCount.count,
      activeUsers: activeUsers.count,
      wordsByLevel
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: '統計の取得中にエラーが発生しました' });
  }
});

// ユーザーの学習状況取得
router.get('/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.getAsync(
      'SELECT id, email, name FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    const totalStudied = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_records WHERE user_id = ?',
      [id]
    );

    const correctAnswers = await db.getAsync(
      'SELECT COUNT(*) as count FROM study_records WHERE user_id = ? AND is_correct = 1',
      [id]
    );

    const recentActivity = await db.allAsync(`
      SELECT DATE(timestamp) as date, COUNT(*) as count
      FROM study_records 
      WHERE user_id = ? AND timestamp >= datetime('now', '-30 days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `, [id]);

    res.json({
      user,
      totalStudied: totalStudied.count,
      correctAnswers: correctAnswers.count,
      accuracyRate: totalStudied.count > 0 ? Math.round((correctAnswers.count / totalStudied.count) * 100) : 0,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'ユーザー統計の取得中にエラーが発生しました' });
  }
});

export default router;