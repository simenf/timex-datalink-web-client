#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

const DIST_DIR = 'dist';

// Files and directories to include in the build
const INCLUDE_PATTERNS = [
  // Core web files
  'index.html',
  'oauth-setup.html', 
  'protocol-help.html',
  'simple-calendar-test.html',
  '_headers',
  
  // JavaScript modules
  'js/**/*.js',
  'lib/**/*.js',
  
  // Styles
  'styles/**/*',
  
  // Documentation (for web access)
  'docs/**/*.md',
  
  // Examples (for web access)
  'examples/**/*.js',
  
  // Screenshots (for web display)
  'screenshots/**/*'
];

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  'tests',
  'spec',
  '.git',
  '.kiro',
  '.vscode',
  '.DS_Store',
  '*.gemspec',
  'Gemfile*',
  '.rubocop.yml',
  '.rspec',
  'build.js',
  'package*.json',
  'README*.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'ACKNOWLEDGMENTS.md'
];

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
  console.log(`Copied: ${src} → ${dest}`);
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      // Simple glob matching
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

async function matchesPattern(filePath, pattern) {
  if (pattern.includes('**')) {
    // Handle recursive directory patterns like 'js/**/*.js'
    const [dir, filePattern] = pattern.split('/**/');
    if (filePath.startsWith(dir + '/')) {
      const relativePath = filePath.substring(dir.length + 1);
      if (filePattern === '*' || relativePath.endsWith(filePattern.replace('*', ''))) {
        return true;
      }
    }
  } else if (pattern.includes('*')) {
    // Handle simple wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filePath);
  } else {
    // Exact match
    return filePath === pattern;
  }
  return false;
}

async function shouldInclude(filePath) {
  for (const pattern of INCLUDE_PATTERNS) {
    if (await matchesPattern(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

async function getAllFiles(dir = '.', prefix = '') {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
    
    if (shouldExclude(relativePath)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, relativePath);
      files.push(...subFiles);
    } else {
      files.push({ fullPath, relativePath });
    }
  }
  
  return files;
}

async function build() {
  console.log('🚀 Building for Cloudflare deployment...\n');
  
  // Clean dist directory
  try {
    await fs.rm(DIST_DIR, { recursive: true, force: true });
  } catch (err) {
    // Directory doesn't exist, that's fine
  }
  
  await fs.mkdir(DIST_DIR, { recursive: true });
  
  // Get all files
  const allFiles = await getAllFiles();
  
  // Copy included files
  let copiedCount = 0;
  for (const { fullPath, relativePath } of allFiles) {
    if (await shouldInclude(relativePath)) {
      const destPath = path.join(DIST_DIR, relativePath);
      await copyFile(fullPath, destPath);
      copiedCount++;
    }
  }
  
  console.log(`\n✅ Build complete! Copied ${copiedCount} files to ${DIST_DIR}/`);
  console.log(`\n📦 Ready for Cloudflare Pages deployment:`);
  console.log(`   Build output directory: ${DIST_DIR}`);
  console.log(`   Build command: node build.js`);
  console.log(`   Root directory: ${DIST_DIR}`);
}

build().catch(console.error);