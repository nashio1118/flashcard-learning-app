import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'メールアドレスとパスワードが必要です' });
    }

    // ユーザーを検索
    const user = await db.getAsync(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています' });
    }

    // パスワードを検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが間違っています' });
    }

    // JWTトークンを生成
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // パスワードを除いてユーザー情報を返す
    const { password: _, ...userInfo } = user;

    res.json({
      message: 'ログインに成功しました',
      token,
      user: userInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'ログイン処理中にエラーが発生しました' });
  }
});

// トークン検証
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'トークンは有効です',
    user: req.user
  });
});

// ユーザー情報取得
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

export default router;