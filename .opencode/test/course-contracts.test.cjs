const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const missions = [
  'missions/1.1-first-day/AGENTS.md',
  'missions/1.2-context/AGENTS.md',
  'missions/1.3-request/AGENTS.md',
  'missions/1.4-discrepancy/AGENTS.md',
  'missions/2.1-blame/AGENTS.md',
  'missions/2.2-iteration/AGENTS.md',
  'missions/2.3-corruption/AGENTS.md',
  'missions/2.4-risk/AGENTS.md',
  'missions/3.1-agent-brief/AGENTS.md',
  'missions/3.2-skill/AGENTS.md',
  'missions/3.3-parallel/AGENTS.md',
  'missions/3.4-new-data/AGENTS.md',
  'missions/4.1-specialists/AGENTS.md',
  'missions/4.2-orchestration/AGENTS.md',
  'missions/4.3-human-gate/AGENTS.md',
  'missions/4.4-final-brief/AGENTS.md',
];

// Short-mission format: every mission ends via the shared completion block,
// keeps 2-3 content stops, and never dumps full source documents into chat.
for (const mission of missions) {
  const content = read(mission);
  assert.match(
    content,
    /Action: выполни общее завершение миссии \d\.\d/u,
    `${mission} must end via the shared completion block`,
  );
  const checks = content.match(/^Check:/gmu) ?? [];
  assert.ok(
    checks.length >= 2 && checks.length <= 3,
    `${mission} must have 2-3 content stops, got ${checks.length}`,
  );
  const readyPrompts = content.match(/напиши мне/giu) ?? [];
  assert.ok(
    readyPrompts.length >= checks.length,
    `${mission} must give a ready-to-send "Напиши мне" message before every Check`,
  );
  assert.doesNotMatch(
    content,
    /Дай заготовку|\[(?:что|номер|сигнал|мой выбор|буква|чём|действие|важный|конкретное|решению)[^\]]*\]/u,
    `${mission} must not leave fill-in-the-blank placeholders without a filled default`,
  );
  assert.doesNotMatch(
    content,
    /покажи студенту содержимое `[^`]+` целиком/u,
    `${mission} must show excerpts, not full documents`,
  );
}

const instructions = read('.opencode/SCRIPT_INSTRUCTIONS.md');
assert.match(
  instructions,
  /Напиши мне/u,
  'every message before a Check must end with a ready-to-send block',
);
assert.match(
  instructions,
  /не длиннее 120 слов/u,
  'curator replies must be capped at 120 words',
);
assert.match(
  instructions,
  /не длиннее 120 слов|120 слов/u,
  'reply length limit must be stated',
);
assert.match(
  instructions,
  /только если[^\n]*дальше уже сохранённой миссии/u,
  'progress writes must only advance, never roll back',
);
assert.match(
  instructions,
  /не считается\s+вызовом|не засчитывай миссию|не завершай миссию без настоящего вызова/u,
  'fake tool calls must not count as real invocation',
);

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

// Known fact-consistency contracts.
const corruption = read('missions/2.3-corruption/AGENTS.md');
assert.doesNotMatch(
  corruption,
  /~?3,1 млн/u,
  'the client-loss shortfall must not be overstated (it is 2.1)',
);
assert.match(
  corruption,
  /2,1 млн/u,
  'mission 2.3 must carry the correct 2.1 loss figure',
);

const iteration = read('missions/2.2-iteration/AGENTS.md');
assert.match(
  iteration,
  /Q2 → сентябрь/u,
  'mission 2.2 must fix the period to Q2 -> September',
);
assert.match(
  iteration,
  /Учебный дефект/u,
  'mission 2.2 must explicitly label the planted defect',
);

const newData = read('missions/3.4-new-data/AGENTS.md');
assert.doesNotMatch(
  newData,
  /ярмарка — лучши(?:й|х) канал|лучши(?:й|х) канал для/u,
  'the fair must not be called the best channel without comparative evidence',
);
assert.match(
  newData,
  /не доказывает, что ярмарка лучший канал/u,
  'mission 3.4 must explicitly cap the 19% conclusion',
);

const risk = read('missions/2.4-risk/AGENTS.md');
assert.match(
  risk,
  /изолированного субагента/u,
  'the external check must use an isolated subagent',
);
assert.match(
  risk,
  /не изображай субагента/u,
  'mission 2.4 must forbid imitating a subagent',
);

const specialists = read('missions/4.1-specialists/AGENTS.md');
assert.match(
  specialists,
  /bash: deny/u,
  'read-only specialists must not retain shell write access',
);

const orchestration = read('missions/4.2-orchestration/AGENTS.md');
assert.match(
  orchestration,
  /Выбор студента/u,
  'mission 4.2 must record the student choice',
);
for (const banned of [/−15…−20%/u, /\+8–12 сделок/u, /3,3–4,9 млн/u]) {
  assert.doesNotMatch(
    orchestration,
    banned,
    `mission 4.2 must not prescribe unsubstantiated forecast ${banned}`,
  );
}

const finalBrief = read('missions/4.4-final-brief/AGENTS.md');
assert.doesNotMatch(
  finalBrief,
  /сценарий В принят/u,
  'the epilogue must preserve the scenario selected by the student',
);
assert.match(
  finalBrief,
  /три факта\s*и\s*одн/u,
  'the final acceptance must be limited to three facts and one caveat',
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
