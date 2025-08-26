import Anthropic from '@anthropic-ai/sdk';
import { Minutes, TranscriptSegment, ActionItem, Decision, PendingItem } from '../types';
import dayjs from 'dayjs';

export class AIAnalyzer {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async analyze(transcript: string, participants: string[] = []): Promise<Minutes> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(transcript);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    return this.parseAIResponse(content.text, participants);
  }

  private getSystemPrompt(): string {
    return `You are an expert meeting minutes analyzer. Your task is to analyze meeting transcripts and extract structured information.

You must respond with a JSON object containing the following fields:
{
  "title": "Meeting title",
  "summary": "Executive summary (2-3 sentences)",
  "decisions": [
    {
      "topic": "Decision topic",
      "decision": "What was decided",
      "rationale": "Why this decision was made (optional)"
    }
  ],
  "actionItems": [
    {
      "task": "Task description",
      "assignee": "Person responsible",
      "deadline": "Due date (YYYY-MM-DD format or relative like 'next week')",
      "priority": "high/medium/low",
      "dependencies": ["list of task IDs this depends on"]
    }
  ],
  "pendingItems": [
    {
      "topic": "Topic that needs further discussion",
      "description": "Details about what's pending",
      "nextSteps": "What needs to happen next"
    }
  ],
  "notDoingItems": [
    "Things explicitly decided NOT to do"
  ],
  "keyPoints": [
    "Important discussion points or insights"
  ]
}

Focus on:
1. Clear, actionable items with specific owners and deadlines
2. Explicit decisions vs items that need more discussion
3. Things that were explicitly rejected or decided against
4. Key insights and important discussion points`;
  }

  private getUserPrompt(transcript: string): string {
    return `Please analyze the following meeting transcript and extract structured meeting minutes:

${transcript}

Remember to:
- Identify all action items with clear owners and deadlines
- Distinguish between decided items and pending discussions
- Note what was explicitly decided NOT to do
- Extract key discussion points and insights`;
  }

  private parseAIResponse(response: string, participants: string[]): Minutes {
    try {
      const parsed = JSON.parse(response);
      
      const actionItems: ActionItem[] = (parsed.actionItems || []).map((item: any, index: number) => ({
        id: `ACTION-${index + 1}`,
        task: item.task,
        assignee: item.assignee || 'Unassigned',
        deadline: this.normalizeDeadline(item.deadline),
        priority: item.priority || 'medium',
        status: 'pending',
        dependencies: item.dependencies || []
      }));

      const decisions: Decision[] = (parsed.decisions || []).map((item: any) => ({
        topic: item.topic,
        decision: item.decision,
        rationale: item.rationale
      }));

      const pendingItems: PendingItem[] = (parsed.pendingItems || []).map((item: any) => ({
        topic: item.topic,
        description: item.description,
        nextSteps: item.nextSteps
      }));

      return {
        title: parsed.title || 'Meeting Minutes',
        date: dayjs().format('YYYY-MM-DD'),
        participants: participants.length > 0 ? participants : this.extractParticipants(parsed),
        summary: parsed.summary || '',
        decisions,
        actionItems,
        pendingItems,
        notDoingItems: parsed.notDoingItems || [],
        keyPoints: parsed.keyPoints || []
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  private normalizeDeadline(deadline: string): string {
    if (!deadline) return 'TBD';
    
    const relativeTerms: Record<string, number> = {
      'today': 0,
      'tomorrow': 1,
      'next week': 7,
      'next month': 30,
      'end of week': 5,
      'end of month': 30
    };

    for (const [term, days] of Object.entries(relativeTerms)) {
      if (deadline.toLowerCase().includes(term)) {
        return dayjs().add(days, 'day').format('YYYY-MM-DD');
      }
    }

    // Try to parse as date
    const parsed = dayjs(deadline);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }

    return deadline;
  }

  private extractParticipants(parsed: any): string[] {
    const participants = new Set<string>();
    
    // Extract from action items
    if (parsed.actionItems) {
      parsed.actionItems.forEach((item: any) => {
        if (item.assignee && item.assignee !== 'Unassigned') {
          participants.add(item.assignee);
        }
      });
    }

    return Array.from(participants);
  }
}