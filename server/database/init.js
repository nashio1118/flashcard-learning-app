import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';
import { sampleWords } from '../data/sample-words.js';

const db = new sqlite3.Database('./database.sqlite');

// SQLite3のメソッドをPromise化
db.runAsync = promisify(db.run).bind(db);
db.getAsync = promisify(db.get).bind(db);
db.allAsync = promisify(db.all).bind(db);

export const initDatabase = async () => {
  try {
    console.log('🗄️  データベースを初期化中...');

    // ユーザーテーブル
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 単語テーブル
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        english TEXT NOT NULL,
        japanese TEXT NOT NULL,
        level TEXT DEFAULT 'basic',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 学習記録テーブル
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS study_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (word_id) REFERENCES words (id)
      )
    `);

    // デフォルトユーザーの作成
    const adminExists = await db.getAsync('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.runAsync(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@example.com', hashedPassword, '管理者', 'admin']
      );
      console.log('✅ デフォルト管理者アカウントを作成しました');
    }

    const studentExists = await db.getAsync('SELECT id FROM users WHERE email = ?', ['student@example.com']);
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.runAsync(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['student@example.com', hashedPassword, '生徒', 'student']
      );
      console.log('✅ デフォルト生徒アカウントを作成しました');
    }

    // サンプル単語データの挿入
    const wordCount = await db.getAsync('SELECT COUNT(*) as count FROM words');
    if (wordCount.count === 0) {
      console.log('📚 サンプル単語データを挿入中...');
      
      for (const word of sampleWords) {
        await db.runAsync(
          'INSERT INTO words (english, japanese, level) VALUES (?, ?, ?)',
          [word.english, word.japanese, word.level]
        );
      }
      
      console.log(`✅ ${sampleWords.length}語のサンプルデータを挿入しました`);
    }

    console.log('✅ データベース初期化が完了しました');
  } catch (error) {
    console.error('❌ データベース初期化エラー:', error);
    throw error;
  }
};

export { db };