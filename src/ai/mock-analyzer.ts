import { Minutes, TranscriptSegment, ActionItem, Decision, PendingItem } from '../types';
import dayjs from 'dayjs';

export class MockAIAnalyzer {
  async analyze(transcript: string, participants: string[] = []): Promise<Minutes> {
    // デモ用の固定レスポンス
    console.log('🤖 モックAIアナライザーで解析中...');
    
    // 簡単な解析ロジック
    const lines = transcript.split('\n');
    const extractedParticipants = this.extractParticipants(lines);
    
    // デモ用の固定データ
    const actionItems: ActionItem[] = [
      {
        id: 'ACTION-1',
        task: 'コンポーネントライブラリの作成と実装',
        assignee: 'John',
        deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        priority: 'high',
        status: 'pending',
        dependencies: []
      },
      {
        id: 'ACTION-2',
        task: 'WebSocket接続とRedisキャッシングのセットアップ',
        assignee: 'Emily',
        deadline: dayjs().add(14, 'day').format('YYYY-MM-DD'),
        priority: 'high',
        status: 'pending',
        dependencies: []
      },
      {
        id: 'ACTION-3',
        task: 'テスト計画書の作成',
        assignee: 'Mike',
        deadline: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        priority: 'medium',
        status: 'pending',
        dependencies: []
      },
      {
        id: 'ACTION-4',
        task: '自動テストパイプラインの構築',
        assignee: 'Mike',
        deadline: dayjs().add(5, 'day').format('YYYY-MM-DD'),
        priority: 'medium',
        status: 'pending',
        dependencies: ['ACTION-3']
      },
      {
        id: 'ACTION-5',
        task: 'モニタリングとアラートの設定',
        assignee: 'Emily',
        deadline: dayjs().add(10, 'day').format('YYYY-MM-DD'),
        priority: 'low',
        status: 'pending',
        dependencies: ['ACTION-2']
      },
      {
        id: 'ACTION-6',
        task: '製品チームと要件確認（モバイル対応・データ保持）',
        assignee: 'Sarah',
        deadline: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        priority: 'high',
        status: 'pending',
        dependencies: []
      }
    ];

    const decisions: Decision[] = [
      {
        topic: '更新間隔とキャッシング戦略',
        decision: '30秒間隔での更新とRedisキャッシングを採用',
        rationale: 'リアルタイム性とパフォーマンスのバランスを考慮'
      },
      {
        topic: '技術スタック',
        decision: 'React + Node.js + Redis + PostgreSQLで構築',
        rationale: 'チームの技術スキルと実績を考慮'
      },
      {
        topic: 'v1のスコープ',
        decision: 'ユーザー別カスタムダッシュボードは実装しない',
        rationale: 'まずはコア機能の安定化を優先'
      }
    ];

    const pendingItems: PendingItem[] = [
      {
        topic: 'モバイル対応',
        description: 'ダッシュボードのモバイル対応要否',
        nextSteps: '製品チームと協議して要件を明確化'
      },
      {
        topic: 'データ保持ポリシー',
        description: '履歴データの保持期間の決定',
        nextSteps: 'コスト試算と法的要件の確認'
      }
    ];

    const notDoingItems = [
      'ユーザー別カスタムダッシュボード（v1では実装しない）',
      'リアルタイム更新（30秒間隔に制限）',
      '複数テナント対応（次フェーズで検討）'
    ];

    const keyPoints = [
      'ダッシュボード機能の実装は6週間のタイムラインで実施',
      'カスタマイズ可能なウィジェット機能が差別化ポイント',
      'パフォーマンスを考慮してリアルタイムではなく30秒更新を採用',
      'モバイル対応とデータ保持ポリシーは追加検討が必要'
    ];

    return {
      title: 'ダッシュボード機能開発プロジェクト会議',
      date: dayjs().format('YYYY-MM-DD'),
      participants: participants.length > 0 ? participants : extractedParticipants,
      summary: '新規ダッシュボード機能の開発計画について議論。6週間での開発を目指し、React/Node.js/Redis/PostgreSQLの技術スタックで実装。30秒更新間隔とRedisキャッシングを採用し、v1ではユーザー別カスタマイズは見送り。',
      decisions,
      actionItems,
      pendingItems,
      notDoingItems,
      keyPoints
    };
  }

  private extractParticipants(lines: string[]): string[] {
    const participants = new Set<string>();
    
    lines.forEach(line => {
      // [時刻] 名前: の形式から名前を抽出
      const match = line.match(/\[[\d:]+\]\s*([^:]+):/);
      if (match && match[1]) {
        participants.add(match[1].trim());
      }
      // 名前: の形式から名前を抽出
      const simpleMatch = line.match(/^([^:]+):/);
      if (simpleMatch && simpleMatch[1] && simpleMatch[1].length < 20) {
        participants.add(simpleMatch[1].trim());
      }
    });

    return Array.from(participants);
  }
}