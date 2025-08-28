import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

/**
 * Generic Development MCP Server for VS Code
 * Provides development tools and utilities for any project
 */
class GenericDevMCPServer {
  private server: Server;
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = process.cwd();
    
    this.server = new Server(
      {
        name: 'generic-dev-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Tool handlers for generic development operations
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_project_structure',
          description: 'Analyze and document the project structure, dependencies, and architecture',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to analyze (defaults to workspace root)',
                default: '.',
              },
              includeNodeModules: {
                type: 'boolean',
                description: 'Include node_modules in analysis',
                default: false,
              },
              maxDepth: {
                type: 'number',
                description: 'Maximum directory depth to analyze',
                default: 5,
              },
            },
          },
        },
        {
          name: 'generate_documentation',
          description: 'Generate documentation for code files (README, API docs, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['readme', 'api', 'changelog', 'contributing'],
                description: 'Type of documentation to generate',
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific files to document (optional)',
              },
              outputPath: {
                type: 'string',
                description: 'Output path for documentation',
              },
            },
            required: ['type'],
          },
        },
        {
          name: 'run_code_analysis',
          description: 'Run static code analysis, linting, and quality checks',
          inputSchema: {
            type: 'object',
            properties: {
              tools: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['eslint', 'prettier', 'tsc', 'cargo-check', 'clippy', 'rustfmt'],
                },
                description: 'Analysis tools to run',
              },
              fix: {
                type: 'boolean',
                description: 'Attempt to auto-fix issues',
                default: false,
              },
              path: {
                type: 'string',
                description: 'Path to analyze',
                default: '.',
              },
            },
            required: ['tools'],
          },
        },
        {
          name: 'setup_testing_framework',
          description: 'Set up testing framework for the project (Jest, Vitest, Playwright, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              framework: {
                type: 'string',
                enum: ['jest', 'vitest', 'playwright', 'cypress', 'mocha', 'cargo-test'],
                description: 'Testing framework to set up',
              },
              language: {
                type: 'string',
                enum: ['typescript', 'javascript', 'rust', 'python'],
                description: 'Primary language of the project',
              },
              testTypes: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['unit', 'integration', 'e2e', 'visual'],
                },
                description: 'Types of tests to configure',
              },
            },
            required: ['framework', 'language'],
          },
        },
        {
          name: 'create_project_template',
          description: 'Create a new project from template or scaffold existing project',
          inputSchema: {
            type: 'object',
            properties: {
              template: {
                type: 'string',
                enum: ['react-ts', 'node-ts', 'rust-cli', 'rust-lib', 'tauri', 'nextjs', 'vite'],
                description: 'Project template to use',
              },
              name: {
                type: 'string',
                description: 'Project name',
              },
              path: {
                type: 'string',
                description: 'Path where to create the project',
                default: '.',
              },
              features: {
                type: 'array',
                items: { type: 'string' },
                description: 'Additional features to include (testing, linting, etc.)',
              },
            },
            required: ['template', 'name'],
          },
        },
        {
          name: 'optimize_dependencies',
          description: 'Analyze and optimize project dependencies',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['audit', 'update', 'cleanup', 'analyze-bundle'],
                description: 'Optimization action to perform',
              },
              packageManager: {
                type: 'string',
                enum: ['npm', 'yarn', 'pnpm', 'cargo'],
                description: 'Package manager to use',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'git_workflow_helper',
          description: 'Git workflow operations and analysis',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['status', 'branch-analysis', 'commit-suggest', 'changelog', 'hooks-setup'],
                description: 'Git operation to perform',
              },
              commitMessage: {
                type: 'string',
                description: 'Commit message for commit operations',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'environment_setup',
          description: 'Set up development environment (VS Code settings, extensions, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['vscode-settings', 'vscode-extensions', 'devcontainer', 'github-actions'],
                description: 'Type of environment setup',
              },
              language: {
                type: 'string',
                description: 'Primary language for environment setup',
              },
            },
            required: ['type'],
          },
        },
      ],
    }));

    // Resource handlers for project data access
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'file://project-structure',
          name: 'Project Structure',
          description: 'Current project structure and file tree',
          mimeType: 'application/json',
        },
        {
          uri: 'file://package-info',
          name: 'Package Information',
          description: 'Package.json, Cargo.toml, and dependency information',
          mimeType: 'application/json',
        },
        {
          uri: 'file://git-info',
          name: 'Git Information',
          description: 'Git repository status and branch information',
          mimeType: 'application/json',
        },
        {
          uri: 'file://code-metrics',
          name: 'Code Metrics',
          description: 'Code quality metrics and analysis results',
          mimeType: 'application/json',
        },
      ],
    }));

    // Resource reading handlers
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'file://project-structure':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify(await this.getProjectStructure(), null, 2),
              },
            ],
          };
        case 'file://package-info':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify(await this.getPackageInfo(), null, 2),
              },
            ],
          };
        case 'file://git-info':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify(await this.getGitInfo(), null, 2),
              },
            ],
          };
        case 'file://code-metrics':
          return {
            contents: [
              {
                type: 'text',
                text: JSON.stringify(await this.getCodeMetrics(), null, 2),
              },
            ],
          };
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // Tool execution handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze_project_structure':
          return await this.handleAnalyzeProjectStructure(args);
        case 'generate_documentation':
          return await this.handleGenerateDocumentation(args);
        case 'run_code_analysis':
          return await this.handleRunCodeAnalysis(args);
        case 'setup_testing_framework':
          return await this.handleSetupTestingFramework(args);
        case 'create_project_template':
          return await this.handleCreateProjectTemplate(args);
        case 'optimize_dependencies':
          return await this.handleOptimizeDependencies(args);
        case 'git_workflow_helper':
          return await this.handleGitWorkflowHelper(args);
        case 'environment_setup':
          return await this.handleEnvironmentSetup(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  // Tool implementation methods
  private async handleAnalyzeProjectStructure(args: any) {
    const targetPath = path.resolve(this.workspaceRoot, args.path || '.');
    const structure = await this.analyzeDirectoryStructure(targetPath, args.maxDepth || 5);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Project Structure Analysis\n\n${this.formatProjectStructure(structure)}`,
        },
      ],
    };
  }

  private async handleGenerateDocumentation(args: any) {
    const docType = args.type;
    let content = '';

    switch (docType) {
      case 'readme':
        content = await this.generateReadme();
        break;
      case 'api':
        content = await this.generateApiDocs(args.files);
        break;
      case 'changelog':
        content = await this.generateChangelog();
        break;
      case 'contributing':
        content = await this.generateContributingGuide();
        break;
    }

    if (args.outputPath) {
      await fs.writeFile(path.resolve(this.workspaceRoot, args.outputPath), content);
      return {
        content: [
          {
            type: 'text',
            text: `Documentation written to ${args.outputPath}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async handleRunCodeAnalysis(args: any) {
    const results = [];
    
    for (const tool of args.tools) {
      try {
        const result = await this.runAnalysisTool(tool, args.path, args.fix);
        results.push(result);
      } catch (error) {
        results.push(`Error running ${tool}: ${error.message}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `# Code Analysis Results\n\n${results.join('\n\n')}`,
        },
      ],
    };
  }

  private async handleSetupTestingFramework(args: any) {
    const config = await this.generateTestingConfig(args.framework, args.language, args.testTypes);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Testing Framework Setup: ${args.framework}\n\n${config}`,
        },
      ],
    };
  }

  private async handleCreateProjectTemplate(args: any) {
    const template = await this.generateProjectTemplate(args.template, args.name, args.features);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Project Template: ${args.template}\n\n${template}`,
        },
      ],
    };
  }

  private async handleOptimizeDependencies(args: any) {
    const result = await this.optimizeDependencies(args.action, args.packageManager);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Dependency Optimization: ${args.action}\n\n${result}`,
        },
      ],
    };
  }

  private async handleGitWorkflowHelper(args: any) {
    const result = await this.gitWorkflowOperation(args.action, args.commitMessage);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Git Workflow: ${args.action}\n\n${result}`,
        },
      ],
    };
  }

  private async handleEnvironmentSetup(args: any) {
    const config = await this.generateEnvironmentConfig(args.type, args.language);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Environment Setup: ${args.type}\n\n${config}`,
        },
      ],
    };
  }

  // Helper methods for resource access
  private async getProjectStructure(): Promise<any> {
    return await this.analyzeDirectoryStructure(this.workspaceRoot, 3);
  }

  private async getPackageInfo(): Promise<any> {
    const info: any = {};
    
    // Check for package.json
    try {
      const packageJson = await fs.readFile(path.join(this.workspaceRoot, 'package.json'), 'utf-8');
      info.packageJson = JSON.parse(packageJson);
    } catch {}

    // Check for Cargo.toml
    try {
      const cargoToml = await fs.readFile(path.join(this.workspaceRoot, 'Cargo.toml'), 'utf-8');
      info.cargoToml = cargoToml;
    } catch {}

    return info;
  }

  private async getGitInfo(): Promise<any> {
    try {
      const status = await this.runCommand('git status --porcelain');
      const branch = await this.runCommand('git branch --show-current');
      const lastCommit = await this.runCommand('git log -1 --oneline');
      
      return {
        branch: branch.trim(),
        status: status.split('\n').filter(line => line.trim()),
        lastCommit: lastCommit.trim(),
      };
    } catch {
      return { error: 'Not a git repository' };
    }
  }

  private async getCodeMetrics(): Promise<any> {
    const metrics: any = {};
    
    try {
      // Count lines of code
      const files = await this.findFiles(this.workspaceRoot, ['.js', '.ts', '.tsx', '.rs', '.py']);
      let totalLines = 0;
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          totalLines += content.split('\n').length;
        } catch {}
      }
      
      metrics.totalFiles = files.length;
      metrics.totalLines = totalLines;
      metrics.languages = this.detectLanguages(files);
    } catch {}
    
    return metrics;
  }

  // Utility methods
  private async analyzeDirectoryStructure(dirPath: string, maxDepth: number, currentDepth = 0): Promise<any> {
    if (currentDepth >= maxDepth) return null;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const structure: any = {
        name: path.basename(dirPath),
        type: 'directory',
        children: [],
      };

      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.github') continue;
        if (entry.name === 'node_modules' || entry.name === 'target') continue;

        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subStructure = await this.analyzeDirectoryStructure(fullPath, maxDepth, currentDepth + 1);
          if (subStructure) {
            structure.children.push(subStructure);
          }
        } else {
          structure.children.push({
            name: entry.name,
            type: 'file',
            extension: path.extname(entry.name),
          });
        }
      }

      return structure;
    } catch {
      return null;
    }
  }

  private formatProjectStructure(structure: any, indent = 0): string {
    if (!structure) return '';
    
    const prefix = '  '.repeat(indent);
    let result = `${prefix}${structure.name}${structure.type === 'directory' ? '/' : ''}\n`;
    
    if (structure.children) {
      for (const child of structure.children) {
        result += this.formatProjectStructure(child, indent + 1);
      }
    }
    
    return result;
  }

  private async generateReadme(): Promise<string> {
    const packageInfo = await this.getPackageInfo();
    const projectName = packageInfo.packageJson?.name || path.basename(this.workspaceRoot);
    
    return `# ${projectName}

## Description

[Add a brief description of your project]

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

[Add usage instructions]

## Development

\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
`;
  }

  private async generateApiDocs(files?: string[]): Promise<string> {
    return `# API Documentation

[Auto-generated API documentation would go here]

## Endpoints

[List your API endpoints]

## Types

[Document your types and interfaces]
`;
  }

  private async generateChangelog(): Promise<string> {
    try {
      const gitLog = await this.runCommand('git log --oneline -10');
      return `# Changelog

## Recent Changes

${gitLog.split('\n').map(line => `- ${line}`).join('\n')}
`;
    } catch {
      return `# Changelog

## [Unreleased]
- Initial version
`;
    }
  }

  private async generateContributingGuide(): Promise<string> {
    return `# Contributing

Thank you for your interest in contributing to this project!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: \`npm install\`
4. Create a branch: \`git checkout -b feature/amazing-feature\`

## Code Style

- Use TypeScript for new code
- Follow the existing code style
- Run \`npm run lint\` before committing
- Add tests for new features

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the version numbers if applicable
3. Make sure all tests pass
4. Submit your pull request

## Code of Conduct

Please be respectful and inclusive in all interactions.
`;
  }

  private async runAnalysisTool(tool: string, targetPath: string, fix: boolean): Promise<string> {
    const commands: Record<string, string> = {
      eslint: fix ? 'npx eslint --fix' : 'npx eslint',
      prettier: fix ? 'npx prettier --write' : 'npx prettier --check',
      tsc: 'npx tsc --noEmit',
      'cargo-check': 'cargo check',
      clippy: 'cargo clippy',
      rustfmt: fix ? 'cargo fmt' : 'cargo fmt -- --check',
    };

    const command = commands[tool];
    if (!command) {
      throw new Error(`Unknown analysis tool: ${tool}`);
    }

    try {
      const result = await this.runCommand(`${command} ${targetPath}`);
      return `## ${tool}\n\`\`\`\n${result}\n\`\`\``;
    } catch (error) {
      return `## ${tool}\nError: ${error.message}`;
    }
  }

  private async generateTestingConfig(framework: string, language: string, testTypes?: string[]): Promise<string> {
    // This would generate appropriate testing configurations
    return `Configuration for ${framework} with ${language} would be generated here.`;
  }

  private async generateProjectTemplate(template: string, name: string, features?: string[]): Promise<string> {
    return `Project template ${template} for ${name} would be generated here.`;
  }

  private async optimizeDependencies(action: string, packageManager?: string): Promise<string> {
    return `Dependency optimization (${action}) would be performed here.`;
  }

  private async gitWorkflowOperation(action: string, commitMessage?: string): Promise<string> {
    return `Git workflow operation (${action}) would be performed here.`;
  }

  private async generateEnvironmentConfig(type: string, language?: string): Promise<string> {
    return `Environment configuration (${type}) would be generated here.`;
  }

  private async runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { cwd: this.workspaceRoot, shell: true });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  private async findFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    
    const traverse = async (currentDir: string) => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await traverse(fullPath);
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch {}
    };
    
    await traverse(dir);
    return files;
  }

  private detectLanguages(files: string[]): Record<string, number> {
    const languages: Record<string, number> = {};
    
    for (const file of files) {
      const ext = path.extname(file);
      const langMap: Record<string, string> = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript React',
        '.rs': 'Rust',
        '.py': 'Python',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
      };
      
      const lang = langMap[ext] || 'Other';
      languages[lang] = (languages[lang] || 0) + 1;
    }
    
    return languages;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Generic Development MCP Server running on stdio');
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GenericDevMCPServer();
  server.run().catch(console.error);
}

export default GenericDevMCPServer;
