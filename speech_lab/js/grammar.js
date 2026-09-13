/* Speech Lab — grammar, aimed rather than general.
 *
 * A general-purpose checker is a solved problem and this is not one: Harper
 * (Automattic, Rust compiled to WASM, runs fully offline) is the drop-in if
 * broad coverage is wanted later, and `check()` below has the same shape as
 * its API on purpose so swapping it in is a one-file change.
 *
 * What this file does instead is aim. Every rule here is an error class that
 * Nepali — and South Asian English generally — produces *systematically*,
 * because the structure behind it differs from English: Nepali has no
 * articles, marks aspect differently, and takes different prepositions. That
 * makes the errors predictable, which makes a rule list genuinely useful where
 * a generic one would mostly find comma splices.
 *
 * Precision over recall, deliberately. A checker that flags correct sentences
 * teaches you to ignore it, so every rule here is one that is nearly always a
 * real error, and the ambiguous classes (article omission in general, "the"
 * overuse) are left out rather than guessed at.
 */

/* Verbs whose -ing form is wrong in almost every context: they describe states,
 * not actions in progress. "I am knowing him" is the classic. */
const STATIVE = [
  'knowing', 'understanding', 'believing', 'liking', 'loving', 'hating',
  'wanting', 'needing', 'owning', 'belonging', 'preferring', 'containing',
  'consisting', 'seeming', 'resembling', 'costing', 'weighing',
];

/* "Having" is fine for meals, parties and trouble; it is wrong for possession.
 * The object list is what separates the two, so the rule stays precise. */
const POSSESSIONS = [
  'a car', 'a house', 'a bike', 'a laptop', 'a phone', 'a job', 'a brother',
  'a sister', 'money', 'a degree', 'a computer', 'a flat', 'an apartment',
];

const UNCOUNTABLE = [
  'information', 'equipment', 'furniture', 'advice', 'luggage', 'homework',
  'software', 'hardware', 'feedback', 'evidence', 'knowledge', 'machinery',
  'stationery', 'jewellery', 'baggage', 'scenery', 'slang',
];

/* Third-person singular. Modals are excluded by the lookbehind, or "he can go"
 * would be flagged on every line. */
const BARE_VERBS = [
  'go', 'do', 'have', 'make', 'take', 'say', 'come', 'know', 'think', 'want',
  'need', 'work', 'live', 'play', 'write', 'run', 'get', 'give', 'see',
  'feel', 'look', 'seem', 'become', 'leave', 'start', 'keep', 'bring',
  'hold', 'move', 'turn', 'show', 'try', 'call', 'ask', 'help', 'use', 'find',
  'tell', 'like', 'love', 'watch', 'study', 'teach', 'speak', 'walk', 'talk',
];
const MODALS = 'can|could|will|would|shall|should|may|might|must|did|does|to|not|never|also|always|often|usually|only';

const rx = (s, f = 'gi') => new RegExp(s, f);

export const RULES = [
  /* ---- articles: Nepali has none, so both directions happen -------------- */
  {
    id: 'art-profession', cls: 'Articles',
    re: rx(`\\b(i\\s+am|he\\s+is|she\\s+is|you\\s+are|they\\s+are|we\\s+are)\\s+(student|teacher|doctor|engineer|nurse|developer|researcher|programmer|scientist|manager|writer)\\b`),
    msg: 'A singular job or role needs an article.',
    fix: (m) => `${m[1]} a ${m[2]}`,
    why: 'Nepali has no articles, so the a/an before a singular countable noun is the first thing to go missing.',
  },
  {
    id: 'art-time-of-day', cls: 'Articles',
    re: rx(`\\bin\\s+(morning|evening|afternoon)\\b`),
    msg: 'Times of day take "the".',
    fix: (m) => `in the ${m[1]}`,
    why: 'Fixed English phrases keep their article even though the meaning is general.',
  },
  {
    id: 'art-a-vowel', cls: 'Articles',
    re: rx(`\\ba\\s+([aeiou]\\w+)`),
    msg: 'Use "an" before a vowel sound.',
    fix: (m) => `an ${m[1]}`,
    why: 'The choice follows the sound, not the spelling — an hour, a university.',
    // "a university", "a European", "a one-off" are correct: the sound is /j/ or /w/.
    skip: (m) => /^(uni|use|user|usual|euro|ubiqu|one|uk|us\b)/i.test(m[1]),
  },

  /* ---- aspect: the progressive is used far more widely in Nepali ---------- */
  {
    id: 'stative-ing', cls: 'Tense',
    re: rx(`\\b(am|is|are|was|were)\\s+(${STATIVE.join('|')})\\b`),
    msg: 'This verb describes a state, so it does not take the -ing form.',
    fix: (m) => `${m[2].replace(/ing$/, '')}  (e.g. "I know", not "I am knowing")`,
    why: 'Nepali marks this differently and lets the progressive cover states. English keeps states in the simple present.',
  },
  {
    id: 'having-possession', cls: 'Tense',
    re: rx(`\\b(am|is|are|was|were)\\s+having\\s+(${POSSESSIONS.join('|')})\\b`),
    msg: '"Having" cannot mean "own". Use "have".',
    fix: (m) => `have ${m[2]}`,
    why: 'Having works for meals, parties and trouble — not for possessions.',
  },
  {
    id: 'perfect-past-adverb', cls: 'Tense',
    re: rx(`\\b(have|has)\\s+\\w+(ed|en|ne|me|ght)\\b[^.?!]{0,30}\\b(yesterday|last\\s+(night|week|month|year)|ago)\\b`),
    msg: 'The present perfect cannot take a finished past time.',
    fix: () => 'use the simple past — "I went yesterday", not "I have gone yesterday"',
    why: 'Present perfect means "before now, time unspecified". Naming the time forces the simple past.',
  },

  /* ---- agreement --------------------------------------------------------- */
  {
    id: 'sv-third-person', cls: 'Agreement',
    re: rx(`\\b(he|she|it)\\s+(?!(?:${MODALS})\\b)(${BARE_VERBS.join('|')})\\b`),
    msg: 'Third-person singular needs -s on the verb.',
    fix: (m) => `${m[1]} ${m[2] === 'have' ? 'has' : m[2] === 'go' || m[2] === 'do' ? m[2] + 'es' : m[2] + 's'}`,
    why: 'Nepali agreement works differently, so the English -s has no counterpart to carry over.',
    // "I suggest he go home" is the subjunctive, not a missing -s.
    skip: (m) => /\b(suggest|recommend|insist|demand|request|propose)(ed|s)?\s+(that\s+)?$/i
      .test(m.input.slice(0, m.index)),
  },
  {
    id: 'sv-people', cls: 'Agreement',
    re: rx(`\\bpeople\\s+(is|was|has)\\b`),
    msg: '"People" is plural.',
    fix: (m) => `people ${({ is: 'are', was: 'were', has: 'have' })[m[1].toLowerCase()]}`,
    why: 'It has no -s, so it reads as singular; it is not.',
  },
  {
    id: 'one-of-singular', cls: 'Agreement',
    re: rx(`\\bone\\s+of\\s+(my|our|the|his|her|their|your)\\s+(\\w+?)(?<!s)\\b(?!\\w)`),
    msg: '"One of" needs a plural after it.',
    fix: (m) => `one of ${m[1]} ${m[2]}s`,
    why: 'You are picking one out of many, so the group has to be plural.',
  },

  /* ---- countability ------------------------------------------------------ */
  {
    id: 'uncountable-plural', cls: 'Countability',
    re: rx(`\\b(${UNCOUNTABLE.join('|')})s\\b`),
    msg: 'This noun has no plural in English.',
    fix: (m) => `${m[1]} (or "pieces of ${m[1]}")`,
    why: 'Nepali counts several of these freely, so the -s transfers across and sounds wrong to a native ear.',
  },
  {
    id: 'many-uncountable', cls: 'Countability',
    re: rx(`\\bmany\\s+(${UNCOUNTABLE.join('|')})\\b`),
    msg: 'Uncountable nouns take "much", not "many".',
    fix: (m) => `much ${m[1]}`,
    why: 'Many counts items; much measures mass.',
  },

  /* ---- prepositions: the highest-frequency class in South Asian English --- */
  {
    id: 'discuss-about', cls: 'Prepositions',
    re: rx(`\\bdiscuss(ed|ing|es)?\\s+about\\b`),
    msg: '"Discuss" takes no preposition.',
    fix: (m) => `discuss${m[1] || ''}`,
    why: 'The "about" is already inside the verb.',
  },
  {
    id: 'married-with', cls: 'Prepositions',
    re: rx(`\\bmarried\\s+with\\b`),
    msg: 'Married *to* someone.',
    fix: () => 'married to',
    why: 'You are married with a person only in the sense of alongside them.',
  },
  {
    id: 'reach-at', cls: 'Prepositions',
    re: rx(`\\breach(ed|ing|es)?\\s+(at|to)\\b`),
    msg: '"Reach" takes no preposition before a place.',
    fix: (m) => `reach${m[1] || ''}`,
    why: 'Reach the office, arrive at the office.',
  },
  {
    id: 'since-duration', cls: 'Prepositions',
    re: rx(`\\bsince\\s+(\\d+|a|two|three|four|five|six|seven|eight|nine|ten)\\s+(year|month|week|day|hour|minute)s?\\b`),
    msg: '"Since" marks a starting point; a length of time takes "for".',
    fix: (m) => `for ${m[1]} ${m[2]}s`,
    why: 'Since 2019, for three years.',
  },
  {
    id: 'good-in', cls: 'Prepositions',
    re: rx(`\\bgood\\s+in\\s+(\\w+ing|maths|math|english|science|programming)\\b`),
    msg: 'Good *at* something.',
    fix: (m) => `good at ${m[1]}`,
    why: 'At for skills, in for a location.',
  },

  /* ---- redundancy carried in from Nepali phrasing ------------------------- */
  {
    id: 'return-back', cls: 'Redundancy',
    re: rx(`\\b(return|revert|repeat|reply)\\s+back\\b`),
    msg: 'The "back" is already in the verb.',
    fix: (m) => m[1],
    why: 'Return means to come back. Adding back says it twice.',
  },
  {
    id: 'cope-up', cls: 'Redundancy',
    re: rx(`\\bcope\\s+up\\s+with\\b`),
    msg: 'Cope *with*, no "up".',
    fix: () => 'cope with',
    why: 'Keep up with and cope with are two different phrases that blend together.',
  },
  {
    id: 'more-better', cls: 'Redundancy',
    re: rx(`\\bmore\\s+(better|worse|easier|faster|higher|lower|greater|simpler)\\b`),
    msg: 'This comparative already carries "more".',
    fix: (m) => m[1],
    why: 'English marks a comparative once — either -er or more, never both.',
  },

  /* ---- word order -------------------------------------------------------- */
  {
    id: 'embedded-question', cls: 'Word order',
    re: rx(`\\b(asked|know|wonder|tell\\s+me|explain)\\b[^.?!]{0,20}\\b(what|where|when|why|how|who)\\s+(is|are|was|were|do|does|did)\\s+(his|her|my|your|their|our|the|this|that|he|she|it|they|we|you|i)\\b`),
    msg: 'An embedded question keeps statement order.',
    fix: () => '"…what his name is", not "…what is his name"',
    why: 'Only a direct question inverts. Inside a sentence the subject comes first again.',
  },
  {
    id: 'direct-question-order', cls: 'Word order',
    re: rx(`^\\s*(what|where|when|why|how|who)\\s+(you|he|she|it|they|we)\\s+(are|is|am|was|were|have|has|can|will)\\b`),
    msg: 'A direct question inverts the subject and the verb.',
    fix: (m) => `${m[1]} ${m[3]} ${m[2]} …`,
    why: 'Where are you going, not Where you are going.',
  },
  {
    id: 'universal-tag', cls: 'Word order',
    re: rx(`,\\s*(isn't\\s+it|no)\\s*\\?`),
    msg: 'English tags agree with the sentence’s own verb.',
    fix: () => '"…, doesn’t it?" / "…, aren’t you?" — matched to the main verb',
    why: '"Isn’t it?" works as a universal tag in South Asian English but not in American English.',
  },

  /* ---- vocabulary that is standard locally but not in the US -------------- */
  {
    id: 'doubt-question', cls: 'Word choice',
    re: rx(`\\b(i\\s+have\\s+a\\s+doubt|any\\s+doubts\\?)`),
    msg: '"Doubt" means disbelief in American English.',
    fix: () => '"I have a question" / "Any questions?"',
    why: 'Asking if anyone has doubts reads as asking whether they distrust you.',
  },
  {
    id: 'do-the-needful', cls: 'Word choice',
    re: rx(`\\bdo\\s+the\\s+needful\\b`),
    msg: 'Not used in American English.',
    fix: () => 'name the action — "please review it", "please approve it"',
    why: 'It is standard in South Asian business English and opaque outside it.',
  },
  {
    id: 'prepone', cls: 'Word choice',
    re: rx(`\\bprepone[d]?\\b`),
    msg: 'Not an American English word.',
    fix: () => 'move up / bring forward',
    why: 'It is a perfectly logical coinage that American listeners will not know.',
  },
  {
    id: 'kindly', cls: 'Word choice',
    re: rx(`\\bkindly\\b(?=\\s+(do|send|find|revert|check|confirm)\\b)`),
    msg: '"Kindly" sounds archaic or stiff in American English.',
    fix: (m) => `please ${m[1]}`,
    why: 'Please is the neutral register; kindly reads as either formal or sarcastic.',
  },
];

/**
 * Check a block of text.
 * @returns {Array<{id,cls,msg,why,fix,start,end,text}>}
 */
export function check(text) {
  const out = [];
  if (!text || !text.trim()) return out;

  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text)) !== null) {
      if (m[0].length === 0) { rule.re.lastIndex++; continue; }
      if (rule.skip && rule.skip(m)) continue;
      out.push({
        id: rule.id,
        cls: rule.cls,
        msg: rule.msg,
        why: rule.why,
        suggestion: rule.fix ? rule.fix(m) : null,
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
      });
      if (!rule.re.global) break;
    }
  }

  // Overlapping hits read as noise; keep the earliest, longest one per span.
  out.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const kept = [];
  for (const f of out) {
    if (kept.some((k) => f.start < k.end && k.start < f.end)) continue;
    kept.push(f);
  }
  return kept;
}

export const RULE_COUNT = RULES.length;
export const RULE_CLASSES = [...new Set(RULES.map((r) => r.cls))];
