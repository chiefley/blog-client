#!/usr/bin/env node

// Script to test shortcode parsing from command line
// Usage: node scripts/test-shortcode.mjs

import { parseShortcodes } from '../src/utils/shortcodeParser.ts';

// Test cases for different shortcode scenarios
const testCases = [
  {
    name: 'Simple self-closing',
    content: '[su_divider top="yes" /]'
  },
  {
    name: 'Shortcode with content',
    content: '[su_box title="Test"]Content here[/su_box]'
  },
  {
    name: 'Nested shortcodes',
    content: `[su_box title="Outer"]
      Outer content
      [su_button url="/test"]Button[/su_button]
      More content
    [/su_box]`
  },
  {
    name: 'Multiple shortcodes',
    content: `
      [su_highlight]Important[/su_highlight]
      Some text
      [su_quote cite="Author"]A quote[/su_quote]
    `
  },
  {
    name: 'Complex attributes',
    content: '[genetic-algorithm mutation-level="5" with-badger="true" population=100 /]'
  }
];

// Run tests
console.log('🧪 Shortcode Parser Test Suite\n');

for (const testCase of testCases) {
  console.log(`📝 Test: ${testCase.name}`);
  console.log(`Input: ${testCase.content.trim()}`);
  
  try {
    const nodes = parseShortcodes(testCase.content);
    console.log('✅ Parsed successfully');
    console.log('Result:', JSON.stringify(nodes, null, 2));
  } catch (error) {
    console.log('❌ Parse error:', error.message);
  }
  
  console.log('\n' + '-'.repeat(50) + '\n');
}

// Custom test from command line argument
if (process.argv[2]) {
  console.log('📝 Custom Test');
  console.log(`Input: ${process.argv[2]}`);
  
  try {
    const nodes = parseShortcodes(process.argv[2]);
    console.log('✅ Parsed successfully');
    console.log('Result:', JSON.stringify(nodes, null, 2));
  } catch (error) {
    console.log('❌ Parse error:', error.message);
  }
}