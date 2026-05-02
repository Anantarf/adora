const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/lint.json', 'utf8'));
data.forEach(f => {
  if (f.messages && f.messages.length > 0) {
    console.log(f.filePath);
    f.messages.forEach(m => {
      console.log(`  ${m.line}:${m.column} [${m.ruleId}] ${m.message}`);
    });
  }
});
