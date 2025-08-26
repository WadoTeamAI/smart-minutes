import { Minutes, TaskTableRow } from '../types';
import { TaskManager } from '../task/task-manager';
import { marked } from 'marked';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export class OutputFormatter {
  private taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager();
  }

  async format(
    minutes: Minutes, 
    format: 'markdown' | 'json' | 'html' | 'csv' = 'markdown',
    options: { includeTaskTable?: boolean; templatePath?: string } = {}
  ): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(minutes, options.includeTaskTable);
      case 'json':
        return this.toJson(minutes);
      case 'html':
        return this.toHtml(minutes, options.templatePath);
      case 'csv':
        return this.toCsv(minutes);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private toMarkdown(minutes: Minutes, includeTaskTable: boolean = true): string {
    let md = `# ${minutes.title}\n\n`;
    md += `**Date:** ${minutes.date}\n`;
    md += `**Participants:** ${minutes.participants.join(', ') || 'Not recorded'}\n\n`;
    
    md += `## Summary\n\n${minutes.summary}\n\n`;

    if (minutes.decisions.length > 0) {
      md += `## ✅ Decisions Made\n\n`;
      minutes.decisions.forEach((decision, i) => {
        md += `### ${i + 1}. ${decision.topic}\n`;
        md += `**Decision:** ${decision.decision}\n`;
        if (decision.rationale) {
          md += `**Rationale:** ${decision.rationale}\n`;
        }
        md += '\n';
      });
    }

    if (minutes.actionItems.length > 0) {
      md += `## 📋 Action Items\n\n`;
      
      if (includeTaskTable) {
        const taskTable = this.taskManager.generateTaskTable(minutes.actionItems);
        md += '```\n';
        md += this.taskManager.formatAsAsciiTable(taskTable);
        md += '```\n\n';
        
        md += this.taskManager.generateGanttChart(minutes.actionItems);
        md += '\n';
        md += this.taskManager.generateDependencyGraph(minutes.actionItems);
        md += '\n';
      } else {
        minutes.actionItems.forEach(item => {
          const priorityEmoji = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
          }[item.priority] || '⚪';
          
          md += `- **[${item.id}]** ${item.task}\n`;
          md += `  - Assignee: ${item.assignee}\n`;
          md += `  - Deadline: ${item.deadline}\n`;
          md += `  - Priority: ${priorityEmoji} ${item.priority}\n`;
          if (item.dependencies && item.dependencies.length > 0) {
            md += `  - Dependencies: ${item.dependencies.join(', ')}\n`;
          }
          md += '\n';
        });
      }
    }

    if (minutes.pendingItems.length > 0) {
      md += `## 🔄 Pending Items\n\n`;
      minutes.pendingItems.forEach(item => {
        md += `### ${item.topic}\n`;
        md += `${item.description}\n`;
        if (item.nextSteps) {
          md += `**Next Steps:** ${item.nextSteps}\n`;
        }
        md += '\n';
      });
    }

    if (minutes.notDoingItems.length > 0) {
      md += `## ❌ Not Doing\n\n`;
      minutes.notDoingItems.forEach(item => {
        md += `- ${item}\n`;
      });
      md += '\n';
    }

    if (minutes.keyPoints.length > 0) {
      md += `## 💡 Key Discussion Points\n\n`;
      minutes.keyPoints.forEach(point => {
        md += `- ${point}\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
    md += `*Generated with Smart Minutes AI Tool*\n`;

    return md;
  }

  private toJson(minutes: Minutes): string {
    const output = {
      ...minutes,
      taskTable: this.taskManager.generateTaskTable(minutes.actionItems)
    };
    return JSON.stringify(output, null, 2);
  }

  private async toHtml(minutes: Minutes, templatePath?: string): Promise<string> {
    const markdown = this.toMarkdown(minutes);
    const html = await marked(markdown);
    
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate({ content: html, minutes });
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${minutes.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    h3 { color: #666; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }

  private toCsv(minutes: Minutes): string {
    const rows: string[] = [];
    
    // Header
    rows.push('Type,ID,Content,Assignee,Deadline,Priority,Status,Dependencies');
    
    // Action Items
    minutes.actionItems.forEach(item => {
      const deps = item.dependencies?.join(';') || '';
      rows.push(`Action,${item.id},"${item.task}",${item.assignee},${item.deadline},${item.priority},${item.status},"${deps}"`);
    });
    
    // Decisions
    minutes.decisions.forEach((decision, i) => {
      rows.push(`Decision,DEC-${i + 1},"${decision.topic}: ${decision.decision}",,,,,""`);
    });
    
    // Pending Items
    minutes.pendingItems.forEach((item, i) => {
      rows.push(`Pending,PEND-${i + 1},"${item.topic}: ${item.description}",,,,,""`);
    });
    
    return rows.join('\n');
  }

  async saveToFile(content: string, filename: string, outputDir: string = './output'): Promise<string> {
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }
}