export interface TranscriptSegment {
  speaker?: string;
  timestamp?: string;
  text: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dependencies?: string[];
}

export interface Decision {
  topic: string;
  decision: string;
  rationale?: string;
}

export interface PendingItem {
  topic: string;
  description: string;
  nextSteps?: string;
}

export interface Minutes {
  title: string;
  date: string;
  participants: string[];
  summary: string;
  decisions: Decision[];
  actionItems: ActionItem[];
  pendingItems: PendingItem[];
  notDoingItems: string[];
  keyPoints: string[];
  rawTranscript?: TranscriptSegment[];
}

export interface TaskTableRow {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: string;
  status: string;
  dependencies: string;
  estimatedHours?: number;
  actualHours?: number;
  completionRate?: number;
}

export interface AnalysisOptions {
  model?: string;
  outputFormat?: 'markdown' | 'json' | 'html' | 'csv';
  includeTaskTable?: boolean;
  exportTasksCsv?: string;
  templatePath?: string;
}