const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const varsToReplace = [
  'myGroups',
  'currentSearchResults',
  'currentUser',
  'currentDashboardContext',
  'currentMobileTab',
  'pendingJoinRequests'
];

varsToReplace.forEach(v => {
  const regex = new RegExp(\(?<!['"\\\\.])\\\\b\\\\\b(?!(?:\\\\s*:|['"]))\, 'g');
  let matches = 0;
  code = code.replace(regex, () => {
    matches++;
    return \globalStore.state.\\;
  });
  console.log(\Replaced \ occurrences of \\);
});

fs.writeFileSync('app.js', code);
