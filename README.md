# 英単語フラッシュカードアプリ

塾オリジナルの英単語学習Webアプリです。スマートフォンでの学習に最適化されており、PWA（Progressive Web App）としてホーム画面にインストールできます。

## 主な機能

### 🎯 学習機能
- **フラッシュカード学習**: タップで表裏を切り替え、知っているかどうかを回答
- **600語のサンプル単語**: 基本・中級・上級レベルの英単語を収録
- **学習履歴の記録**: 正答率、連続正解数、学習日数を追跡
- **オフライン学習**: インターネット接続がなくても学習可能

### 👨‍🏫 管理機能
- **ユーザー管理**: 生徒アカウントの一括作成・削除
- **単語管理**: 個別追加・削除、CSVファイルからの一括インポート
- **学習状況確認**: 全生徒の学習進捗を一覧表示

### 📱 PWA機能
- **ホーム画面インストール**: アプリのように使用可能
- **オフライン対応**: Service Workerによるキャッシュ機能
- **レスポンシブデザイン**: スマートフォン・タブレット・PC対応

## 技術構成

### フロントエンド
- **React 18** + **Vite**: 高速な開発環境
- **Tailwind CSS**: レスポンシブなUIデザイン
- **React Router**: SPA routing
- **Axios**: HTTP通信
- **React Hot Toast**: 通知表示

### バックエンド
- **Node.js** + **Express**: RESTful API
- **SQLite**: ファイルベースデータベース
- **JWT**: 認証システム
- **bcryptjs**: パスワードハッシュ化
- **Multer**: ファイルアップロード

### PWA
- **Service Worker**: オフライン対応・キャッシュ
- **Web App Manifest**: アプリインストール
- **Workbox**: PWAツールチェーン

## セットアップ手順

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd 英単語フラッシュアプリ
```

### 2. 依存関係のインストール
```bash
npm run install:all
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001

## デモアカウント

### 生徒用
- **メール**: student@example.com
- **パスワード**: password123

### 管理者用
- **メール**: admin@example.com
- **パスワード**: password123

## デプロイ

### Vercel (フロントエンド)
1. Vercelアカウントでリポジトリを接続
2. Build Command: `cd client && npm run build`
3. Output Directory: `client/dist`
4. 環境変数: `VITE_API_URL=<バックエンドURL>`

### Railway (バックエンド)
1. Railwayアカウントでリポジトリを接続
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. 環境変数:
   - `NODE_ENV=production`
   - `JWT_SECRET=<安全なランダム文字列>`
   - `PORT=3001`

## CSVアップロード形式

単語の一括登録用CSVファイルの形式：

```csv
english,japanese,level
apple,りんご,basic
beautiful,美しい,intermediate
sophisticated,洗練された,advanced
```

## ライセンス

MIT License

## 開発者

塾オリジナル教材開発チーム