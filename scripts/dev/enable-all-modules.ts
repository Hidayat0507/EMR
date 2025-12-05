#!/usr/bin/env bun
/**
 * Enable All Modules
 * Quick script to enable all modules in localStorage
 * 
 * Usage: bun run scripts/dev/enable-all-modules.ts
 * 
 * Note: This sets localStorage values that the browser will use.
 * You need to run this in a browser context or manually enable in Settings.
 */

console.log('📦 Module Enabler Script\n');
console.log('To enable PACS and other modules:');
console.log('\n1. Open your browser');
console.log('2. Go to: http://localhost:3000/settings');
console.log('3. Scroll to "Module Management" section');
console.log('4. Toggle ON the modules you want to use');
console.log('\nOR\n');
console.log('Open browser console (F12) and run:');
console.log('\n  localStorage.setItem("module_pacs", "true");');
console.log('  localStorage.setItem("module_poct", "true");');
console.log('  localStorage.setItem("module_triage", "true");');
console.log('  window.location.reload();');
console.log('\n✅ Modules will be enabled!\n');

// Alternative: Print bookmarklet
const bookmarklet = `javascript:(function(){['pacs','poct','triage','inventory','appointments','analytics'].forEach(m=>localStorage.setItem('module_'+m,'true'));alert('Modules enabled! Refreshing...');location.reload();})();`;
console.log('📌 Bookmarklet (drag to bookmarks bar):');
console.log(bookmarklet);






