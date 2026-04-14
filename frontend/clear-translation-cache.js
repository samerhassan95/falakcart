// Clear translation cache script
// Run this in browser console to clear all cached translations

console.log('Clearing translation cache...');

// Clear sessionStorage
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && key.startsWith('translations_')) {
    sessionStorage.removeItem(key);
    console.log('Removed:', key);
  }
}

// Clear localStorage translation keys
localStorage.removeItem('NEXT_LOCALE');
localStorage.removeItem('NEXT_DIR');

console.log('Translation cache cleared! Please refresh the page.');