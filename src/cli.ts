#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TranscriptParser } from './parser/transcript-parser';
import { AIAnalyzer } from './ai/analyzer';
import { OutputFormatter } from './formatter/output-formatter';
import { TaskManager } from './task/task-manager';
import { AnalysisOptions } from './types';

dotenv.config();

const program = new Command();

program
  .name('smart-minutes')
  .description('AI-powered meeting minutes generator with task management')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze meeting transcript and generate minutes')
  .argument('<file>', 'Path to transcript file')
  .option('-f, --format <format>', 'Output format (markdown|json|html|csv)', 'markdown')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-m, --model <model>', 'AI model to use', process.env.AI_MODEL || 'claude-3-haiku-20240307')
  .option('--with-tasks', 'Include detailed task table and charts', false)
  .option('--export-tasks <file>', 'Export tasks to CSV file')
  .option('--participants <list>', 'Comma-separated list of participants')
  .option('--template <path>', 'Custom HTML template path')
  .action(async (file, options) => {
    const spinner = ora('Analyzing transcript...').start();
    
    try {
      // Check API key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not found in environment variables');
      }

      // Parse transcript
      spinner.text = 'Parsing transcript...';
      const parser = new TranscriptParser();
      const segments = await parser.parseFile(file);
      const formattedTranscript = parser.formatForAnalysis(segments);
      
      // Get participants
      const participants = options.participants 
        ? options.participants.split(',').map((p: string) => p.trim())
        : [];

      // Analyze with AI
      spinner.text = 'Analyzing with AI...';
      const analyzer = new AIAnalyzer(apiKey, options.model);
      const minutes = await analyzer.analyze(formattedTranscript, participants);
      
      // Format output
      spinner.text = 'Formatting output...';
      const formatter = new OutputFormatter();
      const output = await formatter.format(minutes, options.format, {
        includeTaskTable: options.withTasks,
        templatePath: options.template
      });
      
      // Save main output
      const extension = options.format === 'html' ? 'html' : options.format === 'json' ? 'json' : 'md';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `minutes_${timestamp}.${extension}`;
      const outputPath = await formatter.saveToFile(output, filename, options.output);
      
      // Export tasks if requested
      if (options.exportTasks && minutes.actionItems.length > 0) {
        spinner.text = 'Exporting tasks to CSV...';
        const taskManager = new TaskManager();
        const taskTable = taskManager.generateTaskTable(minutes.actionItems);
        const csvPath = path.join(options.output, options.exportTasks);
        await taskManager.exportToCsv(taskTable, csvPath);
        console.log(chalk.green(`\n✅ Tasks exported to: ${csvPath}`));
      }
      
      spinner.succeed(chalk.green(`Minutes generated successfully!`));
      console.log(chalk.blue(`\n📁 Output saved to: ${outputPath}`));
      
      // Print summary
      console.log(chalk.cyan('\n📊 Summary:'));
      console.log(`  • Decisions made: ${minutes.decisions.length}`);
      console.log(`  • Action items: ${minutes.actionItems.length}`);
      console.log(`  • Pending items: ${minutes.pendingItems.length}`);
      console.log(`  • Items not doing: ${minutes.notDoingItems.length}`);
      
      if (minutes.actionItems.length > 0) {
        console.log(chalk.yellow('\n⚡ High Priority Actions:'));
        minutes.actionItems
          .filter(item => item.priority === 'high')
          .forEach(item => {
            console.log(`  • ${item.task} (${item.assignee} - ${item.deadline})`);
          });
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('example')
  .description('Generate example transcript file')
  .option('-o, --output <file>', 'Output file path', './example_transcript.txt')
  .action(async (options) => {
    const exampleContent = `[09:00] Sarah: Good morning everyone! Let's start our project planning meeting for the new dashboard feature.

[09:01] John: Morning! I've prepared some mockups to share. The main goal is to create a real-time analytics dashboard for our users.

[09:03] Sarah: Great! Let's first discuss the timeline. When do we need to deliver this?

[09:04] Mike: Based on the product roadmap, we should aim for end of next month. That gives us about 6 weeks.

[09:05] Sarah: That's tight but doable. John, can you walk us through the mockups?

[09:07] John: Sure! The dashboard will have three main sections: real-time metrics, historical trends, and customizable widgets. Users can drag and drop widgets to customize their view.

[09:10] Emily: I love the customization aspect. For the backend, we'll need to set up WebSocket connections for real-time updates. I estimate that will take about 2 weeks.

[09:12] Mike: We should also consider the database performance. Real-time queries could be expensive.

[09:13] Emily: Good point. I suggest we implement caching with Redis and only update metrics every 30 seconds instead of real-time.

[09:15] Sarah: That sounds reasonable. Let's make that decision - 30-second update intervals with Redis caching.

[09:17] John: For the frontend, I'll need to create the component library first. I can have that ready by next week.

[09:19] Sarah: Perfect. Let's also decide on the tech stack. React for frontend, Node.js backend, Redis for caching, and PostgreSQL for the database. Everyone agree?

[09:20] Everyone: Agreed!

[09:22] Mike: We should NOT implement user-specific dashboards in this version. Let's keep it simple with a standard dashboard for all users.

[09:24] Sarah: Agreed. That's out of scope for v1. Let's focus on getting the core functionality working first.

[09:26] Emily: I'll also need to set up monitoring and alerts. We should track dashboard load times and error rates.

[09:28] Sarah: Good thinking. Mike, can you handle the testing strategy?

[09:29] Mike: Yes, I'll write up a test plan by tomorrow and set up the automated testing pipeline by end of this week.

[09:31] John: One thing we haven't discussed - mobile responsiveness. Should the dashboard work on mobile?

[09:33] Sarah: That's a good question. Let's put that as a pending item to discuss with the product team.

[09:35] Emily: Also, we need to clarify the data retention policy. How long do we keep historical data?

[09:36] Sarah: Another good point. Let's add that to our pending items list.

[09:38] Sarah: Alright, let's wrap up. To summarize our action items:
- John: Create component library by next week and complete frontend by end of month
- Emily: Set up WebSocket and Redis caching in 2 weeks, implement monitoring
- Mike: Test plan by tomorrow, testing pipeline by end of week
- Sarah: Clarify requirements with product team on mobile and data retention

[09:40] Sarah: Great meeting everyone! Let's reconvene next week to check progress.`;

    await fs.writeFile(options.output, exampleContent, 'utf-8');
    console.log(chalk.green(`✅ Example transcript created: ${options.output}`));
    console.log(chalk.cyan('\nYou can now run:'));
    console.log(chalk.white(`  smart-minutes analyze ${options.output} --with-tasks`));
  });

program.parse();