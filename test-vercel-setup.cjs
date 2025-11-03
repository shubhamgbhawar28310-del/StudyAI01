/**
 * Test script to verify Vercel setup
 * Run with: node test-vercel-setup.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Setup Verification\n');

const checks = [];

// Check 1: api/index.py exists
const apiIndexPath = path.join(__dirname, 'api', 'index.py');
if (fs.existsSync(apiIndexPath)) {
  checks.push({ name: 'api/index.py', status: '✅', message: 'Serverless function exists' });
} else {
  checks.push({ name: 'api/index.py', status: '❌', message: 'Missing serverless function' });
}

// Check 2: vercel.json exists and is valid
const vercelJsonPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    if (vercelConfig.builds && vercelConfig.routes) {
      checks.push({ name: 'vercel.json', status: '✅', message: 'Valid configuration' });
    } else {
      checks.push({ name: 'vercel.json', status: '⚠️', message: 'Missing builds or routes' });
    }
  } catch (e) {
    checks.push({ name: 'vercel.json', status: '❌', message: 'Invalid JSON' });
  }
} else {
  checks.push({ name: 'vercel.json', status: '❌', message: 'Missing configuration' });
}

// Check 3: requirements.txt exists
const requirementsPath = path.join(__dirname, 'requirements.txt');
if (fs.existsSync(requirementsPath)) {
  const content = fs.readFileSync(requirementsPath, 'utf8');
  const hasFlask = content.includes('flask');
  const hasPyPDF = content.includes('pypdf2') || content.includes('PyPDF2');
  if (hasFlask && hasPyPDF) {
    checks.push({ name: 'requirements.txt', status: '✅', message: 'All dependencies present' });
  } else {
    checks.push({ name: 'requirements.txt', status: '⚠️', message: 'Some dependencies missing' });
  }
} else {
  checks.push({ name: 'requirements.txt', status: '❌', message: 'Missing dependencies file' });
}

// Check 4: .vercelignore exists
const vercelIgnorePath = path.join(__dirname, '.vercelignore');
if (fs.existsSync(vercelIgnorePath)) {
  checks.push({ name: '.vercelignore', status: '✅', message: 'Ignore file configured' });
} else {
  checks.push({ name: '.vercelignore', status: '⚠️', message: 'No ignore file (optional)' });
}

// Check 5: package.json has vercel-build script
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts['vercel-build']) {
      checks.push({ name: 'package.json', status: '✅', message: 'Build script configured' });
    } else {
      checks.push({ name: 'package.json', status: '⚠️', message: 'No vercel-build script' });
    }
  } catch (e) {
    checks.push({ name: 'package.json', status: '❌', message: 'Invalid JSON' });
  }
} else {
  checks.push({ name: 'package.json', status: '❌', message: 'Missing package.json' });
}

// Check 6: python-backend/src exists
const pythonBackendPath = path.join(__dirname, 'python-backend', 'src');
if (fs.existsSync(pythonBackendPath)) {
  checks.push({ name: 'python-backend/src', status: '✅', message: 'Source code available' });
} else {
  checks.push({ name: 'python-backend/src', status: '❌', message: 'Missing source code' });
}

// Check 7: API service updated
const apiServicePath = path.join(__dirname, 'src', 'services', 'api.ts');
if (fs.existsSync(apiServicePath)) {
  const content = fs.readFileSync(apiServicePath, 'utf8');
  if (content.includes('import.meta.env.PROD')) {
    checks.push({ name: 'src/services/api.ts', status: '✅', message: 'Smart URL detection enabled' });
  } else {
    checks.push({ name: 'src/services/api.ts', status: '⚠️', message: 'May need URL update' });
  }
} else {
  checks.push({ name: 'src/services/api.ts', status: '❌', message: 'Missing API service' });
}

// Print results
console.log('Setup Checks:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(30)} - ${check.message}`);
});

// Summary
const passed = checks.filter(c => c.status === '✅').length;
const warnings = checks.filter(c => c.status === '⚠️').length;
const failed = checks.filter(c => c.status === '❌').length;

console.log('\n' + '='.repeat(60));
console.log(`\nSummary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 Your Vercel setup looks good!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm install -g vercel');
  console.log('  2. Run: vercel login');
  console.log('  3. Run: vercel --prod');
  console.log('\nFor more info, see: VERCEL_QUICK_START.md\n');
} else {
  console.log('⚠️  Some issues found. Please check the failed items above.\n');
  console.log('For help, see: VERCEL_MIGRATION_COMPLETE.md\n');
}
