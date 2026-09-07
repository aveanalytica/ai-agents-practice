const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const sourceMissions = [
  ['missions/1.1-first-day/AGENTS.md', 'company/inbox/director-brief.md'],
  ['missions/1.2-context/AGENTS.md', 'company/handbook.md'],
  ['missions/1.4-discrepancy/AGENTS.md', 'company/data/sales-q3.md'],
  ['missions/2.1-blame/AGENTS.md', 'company/inbox/marina-note.md'],
  ['missions/2.2-iteration/AGENTS.md', 'company/data/logistics-q3.md'],
  ['missions/2.3-corruption/AGENTS.md', 'company/data/claims-q3.md'],
  ['missions/2.4-risk/AGENTS.md', 'company/inbox/zarya-letter.md'],
  ['missions/3.4-new-data/AGENTS.md', 'company/data/fair-leads.md'],
];

for (const [mission, source] of sourceMissions) {
  const content = read(mission);
  assert.match(
    content,
    new RegExp(`Action: покажи студенту содержимое \`${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``),
    `${mission} must show ${source} to the student before discussing it`,
  );
}

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(fullPath);
    return entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

for (const file of markdownFiles(root)) {
  assert.doesNotMatch(
    fs.readFileSync(file, 'utf8'),
    /\bГП\b/u,
    `${path.relative(root, file)} must use the director's full name`,
  );
}

assert.doesNotMatch(
  read('missions/2.3-corruption/AGENTS.md'),
  /~3,1 млн\/кв/u,
  'the client-loss shortfall must not be overstated',
);
assert.doesNotMatch(
  read('missions/3.4-new-data/AGENTS.md'),
  /лучши(?:й|х) канал/u,
  'the fair must not be called the best channel without comparative evidence',
);
assert.match(
  read('missions/2.4-risk/AGENTS.md'),
  /изолированного субагента/u,
  'the external check must use an isolated subagent',
);
assert.match(
  read('missions/4.1-specialists/AGENTS.md'),
  /bash: deny/u,
  'read-only specialists must not retain shell write access',
);
assert.doesNotMatch(
  read('missions/4.4-final-brief/AGENTS.md'),
  /сценарий В принят/u,
  'the epilogue must preserve the scenario selected by the student',
);

const commandDirectory = path.join(root, '.opencode/command');
for (const file of fs.readdirSync(commandDirectory)) {
  if (!file.startsWith('start-') || !file.endsWith('.md')) continue;
  assert.match(
    fs.readFileSync(path.join(commandDirectory, file), 'utf8'),
    /\.progress\/rok\.local/u,
    `${file} must read the saved progress before starting a mission directly`,
  );
}
