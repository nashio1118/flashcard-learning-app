import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { initDatabase } from './database/init.js';
import authRoutes from './routes/auth.js';
import wordsRoutes from './routes/words.js';
import studyRoutes from './routes/study.js';
import adminRoutes from './routes/admin.js';

const app = express();

// レート制限の設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: { message: 'リクエストが多すぎます。しばらく待ってからもう一度お試しください。' }
});

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(limiter);

// データベース初期化
await initDatabase();

// ルート
app.use('/api/auth', authRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/admin', adminRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'フラッシュカードアプリサーバーが正常に動作しています' });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'サーバーエラーが発生しました' });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ message: 'エンドポイントが見つかりません' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 サーバーがポート ${PORT} で起動しました`);
  console.log(`🌐 http://localhost:${PORT}`);
});