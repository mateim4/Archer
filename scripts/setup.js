#!/usr/bin/env node

/**
 * LCM Designer Development Environment Setup
 * 
 * Automated setup script for new developers
 * Checks prerequisites, installs dependencies, and configures the development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

// Colors for console output (without external dependencies)
const colors = {
  green: (text) => `\x1b[32m✅ ${text}\x1b[0m`,
  red: (text) => `\x1b[31m❌ ${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m⚠️  ${text}\x1b[0m`,
  blue: (text) => `\x1b[34mℹ️  ${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m🔗 ${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.cyan('🚀 LCM Designer Development Environment Setup'));
console.log('');

/**
 * Check if a command exists in the system PATH
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get version of a command
 */
function getVersion(command, versionFlag = '--version') {
  try {
    const output = execSync(`${command} ${versionFlag}`, { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    return output.trim().split('\n')[0];
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Compare version strings (basic implementation)
 */
function compareVersions(version, minVersion) {
  const v1 = version.split('.').map(Number);
  const v2 = minVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const a = v1[i] || 0;
    const b = v2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Check system prerequisites
 */
function checkPrerequisites() {
  console.log(colors.bold('📋 Checking prerequisites...'));
  console.log('');

  const requirements = [
    {
      name: 'Node.js',
      command: 'node',
      minVersion: '16.0.0',
      installUrl: 'https://nodejs.org/'
    },
    {
      name: 'npm',
      command: 'npm',
      minVersion: '7.0.0',
      installUrl: 'https://www.npmjs.com/'
    },
    {
      name: 'Rust',
      command: 'rustc',
      minVersion: '1.70.0',
      installUrl: 'https://rustup.rs/'
    },
    {
      name: 'Cargo',
      command: 'cargo',
      minVersion: '1.70.0',
      installUrl: 'https://rustup.rs/'
    }
  ];

  let allGood = true;

  for (const req of requirements) {
    const exists = commandExists(req.command);
    
    if (!exists) {
      console.log(colors.red(`❌ ${req.name} is not installed`));
      console.log(colors.blue(`   Install from: ${req.installUrl}`));
      allGood = false;
      continue;
    }

    const version = getVersion(req.command);
    const versionMatch = version.match(/(\d+\.\d+\.\d+)/);
    
    if (versionMatch && req.minVersion) {
      const currentVersion = versionMatch[1];
      const isValid = compareVersions(currentVersion, req.minVersion) >= 0;
      
      if (isValid) {
        console.log(colors.green(`✅ ${req.name} ${currentVersion} (required: ${req.minVersion})`));
      } else {
        console.log(colors.red(`❌ ${req.name} ${currentVersion} is too old (required: ${req.minVersion})`));
        console.log(colors.blue(`   Update from: ${req.installUrl}`));
        allGood = false;
      }
    } else {
      console.log(colors.green(`✅ ${req.name} is installed`));
    }
  }

  console.log('');
  return allGood;
}

/**
 * Check and create environment files
 */
function setupEnvironmentFiles() {
  console.log(colors.bold('🔧 Setting up environment files...'));
  console.log('');

  const envFiles = [
    {
      source: '.env.example',
      target: '.env',
      description: 'Environment variables for development'
    }
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile.source)) {
      if (!fs.existsSync(envFile.target)) {
        fs.copyFileSync(envFile.source, envFile.target);
        console.log(colors.green(`✅ Created ${envFile.target} from ${envFile.source}`));
      } else {
        console.log(colors.yellow(`⚠️  ${envFile.target} already exists`));
      }
    } else if (envFile.target === '.env') {
      // Create a basic .env file if .env.example doesn't exist
      const basicEnv = `# LCM Designer Environment Configuration
# Development settings
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001

# Backend settings  
RUST_LOG=debug
DATABASE_URL=memory

# Optional: Production settings (uncomment for production)
# NODE_ENV=production
# VITE_API_BASE_URL=https://api.your-domain.com
# DATABASE_URL=surreal://localhost:8000/lcm
`;
      fs.writeFileSync(envFile.target, basicEnv);
      console.log(colors.green(`✅ Created basic ${envFile.target} file`));
    }
  }

  console.log('');
}

/**
 * Install dependencies
 */
async function installDependencies() {
  console.log(colors.bold('📦 Installing dependencies...'));
  console.log('');

  const installations = [
    {
      name: 'Root dependencies',
      command: 'npm install',
      directory: '.'
    },
    {
      name: 'Frontend dependencies',
      command: 'npm install',
      directory: 'frontend'
    },
    {
      name: 'Legacy server dependencies',
      command: 'npm install',
      directory: 'legacy-server'
    },
    {
      name: 'Rust dependencies',
      command: 'cargo build',
      directory: '.'
    }
  ];

  for (const install of installations) {
    try {
      console.log(colors.blue(`📦 Installing ${install.name}...`));
      
      const options = {
        cwd: install.directory,
        stdio: 'inherit'
      };
      
      execSync(install.command, options);
      console.log(colors.green(`✅ ${install.name} installed successfully`));
      console.log('');
    } catch (error) {
      console.log(colors.red(`❌ Failed to install ${install.name}`));
      console.log(colors.yellow(`   Command: ${install.command}`));
      console.log(colors.yellow(`   Directory: ${install.directory}`));
      console.log('');
      
      // Don't exit on Rust build failure as it might be optional
      if (!install.command.includes('cargo')) {
        throw error;
      }
    }
  }
}

/**
 * Create VS Code configuration
 */
function setupVSCodeConfig() {
  console.log(colors.bold('⚙️  Setting up VS Code configuration...'));
  console.log('');

  const vscodeDir = '.vscode';
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }

  // Settings
  const settings = {
    "typescript.preferences.organizeImports": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true,
      "source.fixAll.eslint": true
    },
    "rust-analyzer.checkOnSave.command": "clippy",
    "files.associations": {
      "*.tsx": "typescriptreact"
    },
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "[rust]": {
      "editor.defaultFormatter": "rust-lang.rust-analyzer"
    }
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );

  // Extensions
  const extensions = {
    "recommendations": [
      "rust-lang.rust-analyzer",
      "bradlc.vscode-tailwindcss",
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "ms-playwright.playwright",
      "formulahendry.auto-rename-tag",
      "christian-kohler.path-intellisense",
      "ms-vscode.vscode-json"
    ]
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'extensions.json'),
    JSON.stringify(extensions, null, 2)
  );

  console.log(colors.green('✅ VS Code configuration created'));
  console.log(colors.blue('   Recommended extensions listed in .vscode/extensions.json'));
  console.log('');
}

/**
 * Create development scripts
 */
function createDevScripts() {
  console.log(colors.bold('📜 Creating development scripts...'));
  console.log('');

  const scriptsDir = 'scripts';
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
  }

  // Development start script
  const devScript = `#!/bin/bash
# LCM Designer Development Starter

echo "🚀 Starting LCM Designer development environment..."
echo ""

# Start backend in the background
echo "📡 Starting backend server..."
npm run backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
npm run dev

# Cleanup on exit
trap "echo 'Stopping servers...' && kill $BACKEND_PID" EXIT
`;

  fs.writeFileSync(path.join(scriptsDir, 'dev.sh'), devScript);
  
  // Make script executable
  try {
    execSync(`chmod +x ${path.join(scriptsDir, 'dev.sh')}`);
  } catch (error) {
    // Ignore chmod errors on Windows
  }

  console.log(colors.green('✅ Development scripts created'));
  console.log('');
}

/**
 * Verify setup
 */
function verifySetup() {
  console.log(colors.bold('🔍 Verifying setup...'));
  console.log('');

  const checks = [
    {
      name: 'Frontend node_modules',
      path: 'frontend/node_modules',
      type: 'directory'
    },
    {
      name: 'Environment file',
      path: '.env',
      type: 'file'
    },
    {
      name: 'VS Code settings',
      path: '.vscode/settings.json',
      type: 'file'
    }
  ];

  let allChecksPass = true;

  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      console.log(colors.green(`✅ ${check.name} exists`));
    } else {
      console.log(colors.red(`❌ ${check.name} missing`));
      allChecksPass = false;
    }
  }

  console.log('');
  return allChecksPass;
}

/**
 * Display next steps
 */
function displayNextSteps() {
  console.log(colors.bold('🎉 Setup complete! Next steps:'));
  console.log('');
  console.log(colors.cyan('1. Start development:'));
  console.log('   npm start                    # Start both frontend and backend');
  console.log('   # OR start separately:');
  console.log('   npm run dev                  # Frontend only');
  console.log('   npm run backend              # Backend only');
  console.log('');
  console.log(colors.cyan('2. Access the application:'));
  console.log('   Frontend: http://localhost:1420');
  console.log('   Backend:  http://localhost:3001');
  console.log('   API Docs: http://localhost:3001/docs (when implemented)');
  console.log('');
  console.log(colors.cyan('3. Useful commands:'));
  console.log('   npm run type-check           # TypeScript type checking');
  console.log('   npm run lint                 # ESLint code checking');
  console.log('   npm run test:ui              # Run UI tests');
  console.log('   cargo test                   # Run Rust tests');
  console.log('');
  console.log(colors.cyan('4. Documentation:'));
  console.log('   docs/development/onboarding.md    # Detailed setup guide');
  console.log('   docs/development/components.md    # Component documentation');
  console.log('   docs/api/openapi.yml              # API specification');
  console.log('');
  console.log(colors.green('Happy coding! 🚀'));
}

/**
 * Main setup function
 */
async function main() {
  try {
    // Check prerequisites
    const prereqsOk = checkPrerequisites();
    if (!prereqsOk) {
      console.log(colors.red('❌ Prerequisites not met. Please install the required tools and run setup again.'));
      process.exit(1);
    }

    // Setup environment
    setupEnvironmentFiles();
    
    // Install dependencies
    await installDependencies();
    
    // Setup development tools
    setupVSCodeConfig();
    createDevScripts();
    
    // Verify everything is working
    const setupOk = verifySetup();
    
    if (setupOk) {
      displayNextSteps();
    } else {
      console.log(colors.yellow('⚠️  Setup completed with some issues. Check the output above.'));
    }

  } catch (error) {
    console.log('');
    console.log(colors.red('❌ Setup failed:'));
    console.log(colors.red(error.message));
    console.log('');
    console.log(colors.yellow('💡 Try running the setup again or check the documentation:'));
    console.log(colors.blue('   docs/development/onboarding.md'));
    process.exit(1);
  }
}

// Run setup
main();