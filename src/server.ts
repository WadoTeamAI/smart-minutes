import express from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs/promises';
import { TranscriptParser } from './parser/transcript-parser';
import { MockAIAnalyzer } from './ai/mock-analyzer';
import { OutputFormatter } from './formatter/output-formatter';
import { TaskManager } from './task/task-manager';

const app = express();
const port = process.env.PORT || 3001;

// Multerの設定
const upload = multer({ dest: 'uploads/' });

// 静的ファイルの配信
app.use(express.static('public'));
app.use(express.json());

// メインページ
app.get('/', async (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Minutes - AI議事録生成ツール</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            font-size: 1.1rem;
            opacity: 0.95;
        }
        .main-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            margin-bottom: 30px;
        }
        .input-section {
            margin-bottom: 30px;
        }
        .input-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        .text-input {
            width: 100%;
            min-height: 200px;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            resize: vertical;
            transition: border-color 0.3s;
        }
        .text-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .result-section {
            display: none;
            margin-top: 30px;
        }
        .result-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .tab {
            padding: 10px 20px;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: #666;
            transition: all 0.3s;
        }
        .tab.active {
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }
        .tab-content {
            display: none;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            max-height: 600px;
            overflow-y: auto;
        }
        .tab-content.active {
            display: block;
        }
        .markdown-content {
            line-height: 1.8;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
            margin-top: 20px;
            margin-bottom: 10px;
            color: #333;
        }
        .markdown-content pre {
            background: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }
        .markdown-content ul, .markdown-content ol {
            margin-left: 30px;
            margin-bottom: 15px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        .demo-banner {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Smart Minutes</h1>
            <p>AI-Powered Meeting Minutes Generator</p>
        </div>

        <div class="main-card">
            <div class="demo-banner">
                🎯 デモモード - APIキー不要で体験できます！
            </div>

            <div class="input-section">
                <h2>文字起こしテキストを入力</h2>
                <textarea id="transcriptInput" class="text-input" placeholder="[09:00] 山田: 今日の会議を始めます。&#10;[09:02] 田中: プロジェクトの進捗を報告します。&#10;...&#10;&#10;または「サンプルを使用」ボタンをクリック"></textarea>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="analyzeTranscript()">
                        🤖 議事録を生成
                    </button>
                    <button class="btn btn-secondary" onclick="loadSample()">
                        📋 サンプルを使用
                    </button>
                    <button class="btn btn-secondary" onclick="clearInput()">
                        🗑️ クリア
                    </button>
                </div>
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p style="margin-top: 20px; color: #666;">AI分析中...</p>
            </div>

            <div class="result-section" id="resultSection">
                <div class="stats" id="stats"></div>
                
                <div class="result-tabs">
                    <button class="tab active" onclick="showTab('preview')">📄 議事録</button>
                    <button class="tab" onclick="showTab('tasks')">📊 タスク表</button>
                    <button class="tab" onclick="showTab('raw')">📝 Raw Markdown</button>
                </div>
                
                <div id="preview" class="tab-content active">
                    <div class="markdown-content" id="minutesContent"></div>
                </div>
                
                <div id="tasks" class="tab-content">
                    <pre id="tasksContent"></pre>
                </div>
                
                <div id="raw" class="tab-content">
                    <pre id="rawContent"></pre>
                </div>
            </div>
        </div>
    </div>

    <script>
        const sampleTranscript = \`[09:00] 山田: おはようございます。本日の定例会議を開始します。

[09:02] 田中: おはようございます。まず先週の進捗から報告します。APIの実装は完了しました。

[09:04] 佐藤: フロントエンドも80%完成しています。来週中には完了予定です。

[09:06] 山田: 素晴らしい進捗ですね。次はセキュリティレビューについて話しましょう。

[09:08] 田中: 外部監査は来月予定です。内部レビューは今週実施します。

[09:10] 佐藤: テスト環境の準備も必要ですね。私が担当します。

[09:12] 山田: では、タスクを整理しましょう。田中さんは内部レビュー、佐藤さんはテスト環境構築。

[09:14] 田中: 了解しました。期限は今週金曜日でよろしいですか？

[09:15] 山田: はい、それでお願いします。あと、モバイル対応はv2に延期しましょう。

[09:17] 全員: 承知しました。

[09:18] 山田: それでは、本日の会議は以上です。お疲れ様でした。\`;

        function loadSample() {
            document.getElementById('transcriptInput').value = sampleTranscript;
        }

        function clearInput() {
            document.getElementById('transcriptInput').value = '';
            document.getElementById('resultSection').style.display = 'none';
        }

        async function analyzeTranscript() {
            const transcript = document.getElementById('transcriptInput').value;
            if (!transcript.trim()) {
                alert('文字起こしテキストを入力してください');
                return;
            }

            document.getElementById('loading').style.display = 'block';
            document.getElementById('resultSection').style.display = 'none';

            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ transcript })
                });

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }

                displayResults(data);
            } catch (error) {
                alert('エラーが発生しました: ' + error.message);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }

        function displayResults(data) {
            // 統計表示
            const statsHtml = \`
                <div class="stat-card">
                    <div class="stat-number">\${data.stats.decisions}</div>
                    <div class="stat-label">決定事項</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${data.stats.actions}</div>
                    <div class="stat-label">アクション</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${data.stats.pending}</div>
                    <div class="stat-label">保留事項</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${data.stats.notDoing}</div>
                    <div class="stat-label">見送り</div>
                </div>
            \`;
            document.getElementById('stats').innerHTML = statsHtml;

            // 議事録表示
            document.getElementById('minutesContent').innerHTML = data.html;
            document.getElementById('rawContent').textContent = data.markdown;
            document.getElementById('tasksContent').textContent = data.taskTable || 'タスクがありません';

            document.getElementById('resultSection').style.display = 'block';
        }

        function showTab(tabName) {
            // タブの切り替え
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
    </script>
</body>
</html>`;
  
  res.send(html);
});

// API: 議事録分析
app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // パース処理
    const parser = new TranscriptParser();
    const segments = parser.parseText(transcript);
    const formattedTranscript = parser.formatForAnalysis(segments);
    
    // モックAI分析（デモ版）
    const analyzer = new MockAIAnalyzer();
    const minutes = await analyzer.analyze(formattedTranscript);
    
    // フォーマット処理
    const formatter = new OutputFormatter();
    const markdown = await formatter.format(minutes, 'markdown', {
      includeTaskTable: true
    });
    const html = await formatter.format(minutes, 'html');
    
    // タスク表生成
    const taskManager = new TaskManager();
    const taskTable = minutes.actionItems.length > 0
      ? taskManager.formatAsAsciiTable(taskManager.generateTaskTable(minutes.actionItems))
      : null;
    
    // レスポンス
    res.json({
      success: true,
      markdown,
      html,
      taskTable,
      stats: {
        decisions: minutes.decisions.length,
        actions: minutes.actionItems.length,
        pending: minutes.pendingItems.length,
        notDoing: minutes.notDoingItems.length
      },
      minutes
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║     Smart Minutes Server Started!      ║
╠════════════════════════════════════════╣
║  🌐 URL: http://localhost:${port}         ║
║  📝 Status: Demo Mode (No API needed)  ║
║  🚀 Press Ctrl+C to stop               ║
╚════════════════════════════════════════╝
  `);
});

export default app;