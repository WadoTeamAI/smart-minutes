import { Request, Response } from 'express';
import { TranscriptParser } from '../src/parser/transcript-parser';
import { MockAIAnalyzer } from '../src/ai/mock-analyzer';
import { OutputFormatter } from '../src/formatter/output-formatter';
import { TaskManager } from '../src/task/task-manager';

export default async function handler(req: Request, res: Response) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      res.status(400).json({ error: 'Transcript is required' });
      return;
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
    const htmlContent = await formatter.format(minutes, 'html');
    
    // タスク表生成
    const taskManager = new TaskManager();
    const taskTable = minutes.actionItems.length > 0
      ? taskManager.formatAsAsciiTable(taskManager.generateTaskTable(minutes.actionItems))
      : null;
    
    // レスポンス
    res.status(200).json({
      success: true,
      markdown,
      html: htmlContent,
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
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}