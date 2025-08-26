# Smart Minutes - AI-Powered Meeting Minutes Generator

文字起こしテキストから構造化された議事録を自動生成し、タスク管理機能まで提供するCLIツールです。

An intelligent CLI tool that automatically generates structured meeting minutes from transcripts with advanced task management features.

## 機能

### 🎯 核心機能
- **AI分析**: 文字起こしから決定事項・アクション・保留事項を自動抽出
- **タスク管理**: WHO/WHAT/WHENを明確にしたアクションアイテム管理
- **タスク表生成**: ガントチャート、依存関係図の自動生成
- **多様な出力**: Markdown, JSON, HTML, CSV形式対応

### 📊 タスク管理機能
- アクションアイテムの表形式表示
- ガントチャートビュー
- タスク依存関係の可視化
- CSV出力（Jira/Notion連携用）

## Quick Demo (No API Key Required)

```bash
# Clone and setup
git clone https://github.com/yourusername/smart-minutes.git
cd smart-minutes
npm install
npm run build

# Run demo
node dist/cli-demo.js demo --create-sample
```

## Installation

```bash
git clone https://github.com/yourusername/smart-minutes.git
cd smart-minutes
npm install
npm run build
npm link
```

## Configuration

`.env`ファイルを作成し、API キーを設定 / Create `.env` file with your API key:

```bash
ANTHROPIC_API_KEY=your_api_key_here
AI_MODEL=claude-3-haiku-20240307
OUTPUT_DIR=./output
```

## Usage / 使い方

### サンプル生成
```bash
smart-minutes example
```

### 議事録生成
```bash
# 基本使用
smart-minutes analyze meeting.txt

# タスク表付き
smart-minutes analyze meeting.txt --with-tasks

# CSV出力付き
smart-minutes analyze meeting.txt --with-tasks --export-tasks tasks.csv

# フォーマット指定
smart-minutes analyze meeting.txt --format html --with-tasks
```

## Supported Transcript Formats

以下の形式に対応 / Supports the following formats:

```
[09:00] 田中: 今日の会議を始めます
[09:01] 佐藤: プロジェクトの進捗を報告します
田中: では、まず優先順位を決めましょう
```

## 出力例

### 議事録構成
- 📝 サマリー
- ✅ 決定事項
- 📋 アクションアイテム（タスク表）
- 🔄 保留事項
- ❌ やらないこと
- 💡 重要な議論ポイント

### タスク表
```
ID       | Task                    | Assignee | Deadline   | Priority | Status
---------|------------------------|----------|------------|----------|--------
ACTION-1 | Component library作成   | John     | 2024-12-31 | high     | pending
ACTION-2 | テスト計画書作成        | Mike     | 2024-12-25 | medium   | pending
```

## オプション

| オプション | 説明 | デフォルト |
|-----------|------|------------|
| `-f, --format` | 出力形式 (markdown/json/html/csv) | markdown |
| `-o, --output` | 出力ディレクトリ | ./output |
| `-m, --model` | 使用するAIモデル | claude-3-haiku |
| `--with-tasks` | タスク表とチャートを含める | false |
| `--export-tasks` | タスクをCSVファイルに出力 | - |
| `--participants` | 参加者リスト（カンマ区切り） | - |

## 開発

```bash
# 開発モード
npm run dev

# ビルド
npm run build

# テスト
npm test
```

## Features Highlights

- 🤖 **AI Analysis** - Automatically extracts decisions, actions, and pending items
- 📋 **Task Management** - Clear WHO/WHAT/WHEN assignment
- 📊 **Visual Charts** - Gantt charts and dependency graphs
- 📁 **Multiple Formats** - Export to Markdown, JSON, HTML, CSV
- 🚀 **Demo Mode** - Try without API key

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Developed with Claude Code