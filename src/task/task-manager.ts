import { ActionItem, TaskTableRow } from '../types';
import * as createCsvWriter from 'csv-writer';
import dayjs from 'dayjs';

export class TaskManager {
  generateTaskTable(actionItems: ActionItem[]): TaskTableRow[] {
    return actionItems.map(item => ({
      id: item.id,
      task: item.task,
      assignee: item.assignee,
      deadline: item.deadline,
      priority: item.priority,
      status: item.status,
      dependencies: item.dependencies?.join(', ') || 'None',
      estimatedHours: this.estimateHours(item),
      actualHours: 0,
      completionRate: item.status === 'completed' ? 100 : 0
    }));
  }

  private estimateHours(item: ActionItem): number {
    // Simple estimation based on priority
    const estimates: Record<string, number> = {
      'high': 8,
      'medium': 4,
      'low': 2
    };
    return estimates[item.priority] || 4;
  }

  formatAsAsciiTable(rows: TaskTableRow[]): string {
    const headers = ['ID', 'Task', 'Assignee', 'Deadline', 'Priority', 'Status'];
    const maxLengths: Record<string, number> = {};

    // Calculate max lengths
    headers.forEach(h => maxLengths[h] = h.length);
    rows.forEach(row => {
      maxLengths['ID'] = Math.max(maxLengths['ID'], row.id.length);
      maxLengths['Task'] = Math.max(maxLengths['Task'], Math.min(row.task.length, 40));
      maxLengths['Assignee'] = Math.max(maxLengths['Assignee'], row.assignee.length);
      maxLengths['Deadline'] = Math.max(maxLengths['Deadline'], row.deadline.length);
      maxLengths['Priority'] = Math.max(maxLengths['Priority'], row.priority.length);
      maxLengths['Status'] = Math.max(maxLengths['Status'], row.status.length);
    });

    // Build table
    let table = '';
    
    // Header row
    const headerLine = headers.map(h => h.padEnd(maxLengths[h])).join(' | ');
    const separatorLine = headers.map(h => '-'.repeat(maxLengths[h])).join('-+-');
    
    table += headerLine + '\n';
    table += separatorLine + '\n';

    // Data rows
    rows.forEach(row => {
      const task = row.task.length > 40 ? row.task.substring(0, 37) + '...' : row.task;
      const rowLine = [
        row.id.padEnd(maxLengths['ID']),
        task.padEnd(maxLengths['Task']),
        row.assignee.padEnd(maxLengths['Assignee']),
        row.deadline.padEnd(maxLengths['Deadline']),
        row.priority.padEnd(maxLengths['Priority']),
        row.status.padEnd(maxLengths['Status'])
      ].join(' | ');
      table += rowLine + '\n';
    });

    return table;
  }

  async exportToCsv(rows: TaskTableRow[], filePath: string): Promise<void> {
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'task', title: 'Task' },
        { id: 'assignee', title: 'Assignee' },
        { id: 'deadline', title: 'Deadline' },
        { id: 'priority', title: 'Priority' },
        { id: 'status', title: 'Status' },
        { id: 'dependencies', title: 'Dependencies' },
        { id: 'estimatedHours', title: 'Estimated Hours' },
        { id: 'actualHours', title: 'Actual Hours' },
        { id: 'completionRate', title: 'Completion %' }
      ]
    });

    await csvWriter.writeRecords(rows);
  }

  generateGanttChart(actionItems: ActionItem[]): string {
    const today = dayjs();
    let chart = '\n📊 Gantt Chart View:\n\n';
    
    // Sort by deadline
    const sorted = [...actionItems].sort((a, b) => {
      const dateA = dayjs(a.deadline);
      const dateB = dayjs(b.deadline);
      return dateA.diff(dateB);
    });

    const weeks = 4; // Show 4 weeks
    const weekHeaders = Array.from({ length: weeks }, (_, i) => 
      `W${i + 1}`
    ).join(' ');
    
    chart += `Task                    | ${weekHeaders}\n`;
    chart += `------------------------|${'-'.repeat(weeks * 4)}\n`;

    sorted.forEach(item => {
      const taskName = item.task.length > 23 
        ? item.task.substring(0, 20) + '...'
        : item.task.padEnd(23);
      
      const deadline = dayjs(item.deadline);
      const daysUntil = deadline.diff(today, 'day');
      const weekNumber = Math.floor(daysUntil / 7);
      
      let timeline = '';
      for (let w = 0; w < weeks; w++) {
        if (w === weekNumber && weekNumber >= 0 && weekNumber < weeks) {
          timeline += '████';
        } else {
          timeline += '    ';
        }
      }
      
      const priorityIcon = {
        'high': '🔴',
        'medium': '🟡',
        'low': '🟢'
      }[item.priority] || '⚪';
      
      chart += `${taskName} |${timeline} ${priorityIcon}\n`;
    });

    return chart;
  }

  generateDependencyGraph(actionItems: ActionItem[]): string {
    let graph = '\n🔗 Task Dependencies:\n\n';
    
    const itemMap = new Map(actionItems.map(item => [item.id, item]));
    
    actionItems.forEach(item => {
      if (item.dependencies && item.dependencies.length > 0) {
        graph += `${item.id}: ${item.task.substring(0, 30)}\n`;
        item.dependencies.forEach(depId => {
          const dep = itemMap.get(depId);
          if (dep) {
            graph += `  └─> ${depId}: ${dep.task.substring(0, 25)}\n`;
          }
        });
        graph += '\n';
      }
    });

    if (graph === '\n🔗 Task Dependencies:\n\n') {
      graph += 'No dependencies defined.\n';
    }

    return graph;
  }
}