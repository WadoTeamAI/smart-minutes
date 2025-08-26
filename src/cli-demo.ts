#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TranscriptParser } from './parser/transcript-parser';
import { MockAIAnalyzer } from './ai/mock-analyzer';
import { OutputFormatter } from './formatter/output-formatter';
import { TaskManager } from './task/task-manager';

const program = new Command();

program
  .name('smart-minutes-demo')
  .description('Smart Minutes デモ版（API不要）')
  .version('1.0.0');

program
  .command('demo')
  .description('デモ実行')
  .option('--create-sample', 'サンプル文字起こしファイルを作成', false)
  .action(async (options) => {
    console.log(chalk.cyan('\n📊 Smart Minutes デモンストレーション\n'));
    
    const spinner = ora('準備中...').start();
    
    try {
      // サンプルファイル作成
      if (options.createSample) {
        spinner.text = 'サンプル文字起こしファイルを作成中...';
        const sampleContent = `[09:00] 山田: おはようございます。本日のプロジェクト会議を開始します。

[09:02] 田中: おはようございます。今日は新機能の実装計画について話し合いましょう。

[09:03] 山田: はい、まずスケジュールから確認します。リリースまで3週間ありますが、間に合いそうですか？

[09:05] 佐藤: データベース設計は今週中に完了予定です。APIの実装に1週間、フロントエンドに1週間で計算しています。

[09:07] 田中: UIデザインは既に80%完成しています。残りは明日までに仕上げます。

[09:09] 山田: 良いですね。ではタスクを整理しましょう。佐藤さんはDB設計、田中さんはUI完成、私はドキュメント作成を担当します。

[09:11] 佐藤: セキュリティレビューも必要ですね。来週中に外部監査を入れましょう。

[09:13] 田中: パフォーマンステストも忘れずに。負荷テストツールの準備をお願いできますか？

[09:15] 山田: 承知しました。では決定事項をまとめます。3週間でリリース、各自のタスクは明確になりました。

[09:17] 佐藤: モバイル対応についてはどうしましょうか？

[09:18] 山田: それは次のフェーズで検討しましょう。今回はPCブラウザのみ対応とします。

[09:20] 田中: 了解です。あと、古いブラウザのサポートは切っても良いでしょうか？

[09:21] 山田: はい、IE11のサポートは不要とします。モダンブラウザのみ対応で。

[09:23] 全員: 承知しました！

[09:25] 山田: それでは本日の会議は以上です。来週また進捗確認をしましょう。`;
        
        await fs.writeFile('demo_transcript.txt', sampleContent, 'utf-8');
        spinner.succeed('サンプルファイル作成完了: demo_transcript.txt');
      }

      // ファイル読み込み
      spinner.start('文字起こしファイルを解析中...');
      const transcriptFile = options.createSample ? 'demo_transcript.txt' : 'example_transcript.txt';
      
      // ファイルの存在確認
      try {
        await fs.access(transcriptFile);
      } catch {
        spinner.fail(`ファイルが見つかりません: ${transcriptFile}`);
        console.log(chalk.yellow('\n💡 ヒント: --create-sample オプションでサンプルファイルを作成できます'));
        process.exit(1);
      }

      // パース処理
      const parser = new TranscriptParser();
      const segments = await parser.parseFile(transcriptFile);
      const formattedTranscript = parser.formatForAnalysis(segments);
      
      spinner.succeed('文字起こし解析完了');
      
      // モックAI解析
      spinner.start('AI解析中（デモ版）...');
      const analyzer = new MockAIAnalyzer();
      const minutes = await analyzer.analyze(formattedTranscript);
      
      // 少し待機（リアル感演出）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      spinner.succeed('AI解析完了');
      
      // 結果フォーマット
      spinner.start('議事録生成中...');
      const formatter = new OutputFormatter();
      const output = await formatter.format(minutes, 'markdown', {
        includeTaskTable: true
      });
      
      // ファイル保存
      await fs.mkdir('output', { recursive: true });
      const timestamp = new Date().toISOString().split('T')[0];
      const outputPath = `output/demo_minutes_${timestamp}.md`;
      await formatter.saveToFile(output, `demo_minutes_${timestamp}.md`, 'output');
      
      spinner.succeed('議事録生成完了！');
      
      // 結果サマリー表示
      console.log(chalk.green('\n✨ 解析結果サマリー\n'));
      console.log(chalk.white('📋 会議タイトル:'), minutes.title);
      console.log(chalk.white('📅 日付:'), minutes.date);
      console.log(chalk.white('👥 参加者:'), minutes.participants.join(', '));
      
      console.log(chalk.cyan('\n📊 統計:'));
      console.log(`  • 決定事項: ${minutes.decisions.length}件`);
      console.log(`  • アクションアイテム: ${minutes.actionItems.length}件`);
      console.log(`  • 保留事項: ${minutes.pendingItems.length}件`);
      console.log(`  • 見送り事項: ${minutes.notDoingItems.length}件`);
      
      // タスク表表示
      if (minutes.actionItems.length > 0) {
        const taskManager = new TaskManager();
        const taskTable = taskManager.generateTaskTable(minutes.actionItems);
        
        console.log(chalk.yellow('\n📋 タスク一覧:\n'));
        console.log(taskManager.formatAsAsciiTable(taskTable));
        
        // ガントチャート
        console.log(taskManager.generateGanttChart(minutes.actionItems));
      }
      
      // 高優先度タスク
      const highPriorityTasks = minutes.actionItems.filter(item => item.priority === 'high');
      if (highPriorityTasks.length > 0) {
        console.log(chalk.red('\n🔴 高優先度タスク:'));
        highPriorityTasks.forEach(task => {
          console.log(`  • ${task.task}`);
          console.log(`    担当: ${task.assignee} | 期限: ${task.deadline}`);
        });
      }
      
      console.log(chalk.green(`\n📁 議事録ファイル: ${outputPath}`));
      console.log(chalk.cyan('\n🎉 デモ実行完了！\n'));
      
    } catch (error) {
      spinner.fail('エラーが発生しました');
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  });

program.parse();