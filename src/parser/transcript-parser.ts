import { TranscriptSegment } from '../types';
import * as fs from 'fs/promises';

export class TranscriptParser {
  async parseFile(filePath: string): Promise<TranscriptSegment[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.parseText(content);
  }

  parseText(text: string): TranscriptSegment[] {
    const lines = text.split('\n').filter(line => line.trim());
    const segments: TranscriptSegment[] = [];
    
    for (const line of lines) {
      const segment = this.parseLine(line);
      if (segment) {
        segments.push(segment);
      }
    }
    
    return this.mergeConsecutiveSpeakers(segments);
  }

  private parseLine(line: string): TranscriptSegment | null {
    // Pattern 1: [timestamp] Speaker: text
    const timestampPattern = /^\[(\d{2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.+)$/;
    const timestampMatch = line.match(timestampPattern);
    if (timestampMatch) {
      return {
        timestamp: timestampMatch[1],
        speaker: timestampMatch[2].trim(),
        text: timestampMatch[3].trim()
      };
    }

    // Pattern 2: Speaker: text
    const speakerPattern = /^([^:]+):\s*(.+)$/;
    const speakerMatch = line.match(speakerPattern);
    if (speakerMatch && speakerMatch[1].length < 30) {
      return {
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2].trim()
      };
    }

    // Pattern 3: Plain text (continuation of previous speaker)
    return {
      text: line.trim()
    };
  }

  private mergeConsecutiveSpeakers(segments: TranscriptSegment[]): TranscriptSegment[] {
    const merged: TranscriptSegment[] = [];
    let current: TranscriptSegment | null = null;

    for (const segment of segments) {
      if (segment.speaker) {
        if (current) {
          merged.push(current);
        }
        current = { ...segment };
      } else if (current) {
        current.text += ' ' + segment.text;
      } else {
        current = { ...segment };
      }
    }

    if (current) {
      merged.push(current);
    }

    return merged;
  }

  formatForAnalysis(segments: TranscriptSegment[]): string {
    return segments
      .map(s => {
        const prefix = s.speaker ? `${s.speaker}: ` : '';
        return prefix + s.text;
      })
      .join('\n\n');
  }
}