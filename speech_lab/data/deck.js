/* Speech Lab — the drill deck.
 *
 * Every item names the trap it exists to catch. The traps are not generic
 * "hard English sounds": they are the specific Nepali-L1 substitutions
 * documented in Joshi, Eslami & Rivera, "English Language Features Challenging
 * for Nepali English Learners" (ORTESOL Journal 40, 2023), which is why each
 * one has a concrete physical fix rather than "practise more".
 *
 * Fields:
 *   w       the word or sentence to say
 *   ipa     General American, syllables separated by "."
 *   stress  index of the primary-stressed syllable (0-based). -1 = sentence.
 *   traps   trap ids from TRAPS below; drives both the tip and the
 *           personalisation, since the app counts failures per trap.
 *   near    words an American recogniser is likely to hear INSTEAD if the trap
 *           fires. This is the diagnostic: "it heard 'sink'" means /θ/ went to
 *           /s/, which is a different fix from it hearing "tink".
 *   lvl     1 foundation, 2 building, 3 academic, 4 connected speech
 *   track   'gen' | 'swe' | 'med'
 */

/* Each trap carries the substitution the paper actually documents, and the
 * instruction is a thing to do with the mouth — never "say it correctly". */
const TRAPS = {
  th_voiceless: {
    label: '/θ/ as in think',
    why: 'Nepali has dental plosives (त थ) but no dental fricative, so /θ/ comes out as a stop: think becomes tink.',
    fix: 'Tongue tip lightly between your teeth, and keep the air flowing. If the air stops, it became a T.',
  },
  th_voiced: {
    label: '/ð/ as in father',
    why: 'Same missing fricative, voiced. /ð/ lands on द or ध and father becomes fadar.',
    fix: 'Tongue tip between the teeth, voice on, air continuous. You should feel a buzz on the tongue tip.',
  },
  v_f: {
    label: '/v/ and /f/',
    why: 'Nepali has no labiodental fricatives. Both get made with two lips instead, so van and wan collapse.',
    fix: 'Lower lip against the edge of your upper teeth — not lip against lip. For /v/ add voice.',
  },
  w_v: {
    label: '/w/ vs /v/',
    why: 'One Nepali letter (व) covers both, so west and vest stop being different words.',
    fix: '/w/ = lips rounded, teeth uninvolved. /v/ = lower lip on upper teeth. Check which one your teeth touch.',
  },
  sh_s: {
    label: '/ʃ/ as in shoes',
    why: 'The paper is explicit: Nepalis replace /ʃ/ with /s/, so shoes is heard as sues.',
    fix: 'Pull the tongue back a centimetre from the /s/ position and round the lips slightly.',
  },
  zh: {
    label: '/ʒ/ as in measure',
    why: 'Nepali has no /ʒ/ at all; it becomes /z/ or the affricate [dz]. measure becomes mezer.',
    fix: 'Start from /ʃ/ in "shoe", then switch your voice on without moving the tongue.',
  },
  j_z: {
    label: '/dʒ/ as in language',
    why: 'The postalveolar affricate drifts to [dz] or plain /z/ — the paper records language as [læŋɡwɪz].',
    fix: 'Close the tongue against the ridge behind your teeth first, then release into the buzz. Stop, then friction.',
  },
  z_s: {
    label: '/z/ at the end',
    why: 'Final /z/ devoices to /s/, which erases plurals and third-person verbs.',
    fix: 'Keep your voice running through the final consonant. Put a hand on your throat — it must still buzz.',
  },
  s_cluster: {
    label: 'no vowel before s-clusters',
    why: 'The single most recognisable one: an /ɪ/ is inserted before initial sp-, st-, sk-, sm-, sn-, so smart becomes ismart. (sl- and sw- are fine.)',
    fix: 'Begin with the hiss already running, then add the stop. Never let a vowel open the word.',
  },
  stress: {
    label: 'word stress',
    why: 'Nepali does not use stress to change meaning, so speakers level-stress or default to syllable one. English fixes one stressed syllable per word and moving it costs intelligibility.',
    fix: 'Make the marked syllable longer, louder and higher — all three. The others should get shorter, not just quieter.',
  },
  schwa: {
    label: 'schwa in unstressed syllables',
    why: 'Nepali gives every syllable full value, so unstressed vowels stay strong and the word loses its shape.',
    fix: 'Let the unstressed vowels collapse to a lazy uh. Do not pronounce the letter you see.',
  },
  vowel_len: {
    label: 'long vs short vowel',
    why: 'English has 12 monophthongs, Nepali has 6, so pairs like ship/sheep and full/fool merge.',
    fix: 'Hold the long vowel roughly twice as long, and keep the tongue still while you do it.',
  },
  final_stop: {
    label: 'the final consonant',
    why: 'Word-final stops get swallowed, so the listener loses the tense and the plural.',
    fix: 'Release the last consonant audibly. A tiny puff, not a full extra syllable.',
  },
  plosive_force: {
    label: 'force on initial p, t, k',
    why: 'The paper notes Nepalis do not press hard enough for initial /p/ /t/ /k/, so pencil and tanker blur.',
    fix: 'Build real pressure behind the closure and let it burst. Hold a tissue up — it should move.',
  },
  rhythm: {
    label: 'stress-timed rhythm',
    why: 'Nepali is syllable-timed: every syllable gets about the same length. English compresses unstressed syllables between beats.',
    fix: 'Tap the stressed words at an even tempo and cram everything else into the gaps.',
  },
  intonation: {
    label: 'intonation',
    why: 'Falling for statements and wh-questions, rising for yes/no questions. A flat contour reads as disinterest.',
    fix: 'Decide before you speak whether the line ends up or down, and exaggerate it.',
  },
};

const DECK = [
  /* ---- Level 1 · general · the consonant substitutions ------------------ */
  { w: 'think',    ipa: 'θɪŋk',        stress: 0, traps: ['th_voiceless'], near: ['sink', 'tink', 'ting'], lvl: 1, track: 'gen' },
  { w: 'three',    ipa: 'θɹi',         stress: 0, traps: ['th_voiceless'], near: ['tree', 'free', 'see'],  lvl: 1, track: 'gen' },
  { w: 'thirty',   ipa: 'ˈθɜɹ.ti',     stress: 0, traps: ['th_voiceless'], near: ['dirty', 'thirsty'],     lvl: 1, track: 'gen' },
  { w: 'father',   ipa: 'ˈfɑ.ðəɹ',     stress: 0, traps: ['th_voiced', 'schwa'], near: ['fadar', 'farther'], lvl: 1, track: 'gen' },
  { w: 'weather',  ipa: 'ˈwɛ.ðəɹ',     stress: 0, traps: ['th_voiced', 'w_v'], near: ['whether', 'vether'], lvl: 1, track: 'gen' },
  { w: 'very',     ipa: 'ˈvɛ.ɹi',      stress: 0, traps: ['v_f', 'w_v'],    near: ['wary', 'berry', 'weary'], lvl: 1, track: 'gen' },
  { w: 'van',      ipa: 'væn',         stress: 0, traps: ['v_f', 'w_v'],    near: ['ban', 'wan', 'fan'],   lvl: 1, track: 'gen' },
  { w: 'west',     ipa: 'wɛst',        stress: 0, traps: ['w_v'],           near: ['vest', 'best'],        lvl: 1, track: 'gen' },
  { w: 'shoes',    ipa: 'ʃuz',         stress: 0, traps: ['sh_s', 'z_s'],   near: ['sues', 'choose', 'soos'], lvl: 1, track: 'gen' },
  { w: 'sure',     ipa: 'ʃʊɹ',         stress: 0, traps: ['sh_s'],          near: ['sir', 'sore'],         lvl: 1, track: 'gen' },
  { w: 'zoo',      ipa: 'zu',          stress: 0, traps: ['z_s'],           near: ['sue', 'shoe'],         lvl: 1, track: 'gen' },
  { w: 'school',   ipa: 'skul',        stress: 0, traps: ['s_cluster'],     near: ['is school', 'is cool', 'cool'], lvl: 1, track: 'gen' },
  { w: 'smart',    ipa: 'smɑɹt',       stress: 0, traps: ['s_cluster', 'final_stop'], near: ['is smart', 'mart'], lvl: 1, track: 'gen' },
  { w: 'street',   ipa: 'stɹit',       stress: 0, traps: ['s_cluster', 'vowel_len'], near: ['is street', 'strit'], lvl: 1, track: 'gen' },
  { w: 'student',  ipa: 'ˈstu.dənt',   stress: 0, traps: ['s_cluster', 'schwa'], near: ['is student'],      lvl: 1, track: 'gen' },
  { w: 'sport',    ipa: 'spɔɹt',       stress: 0, traps: ['s_cluster'],     near: ['is sport', 'support'], lvl: 1, track: 'gen' },
  { w: 'pencil',   ipa: 'ˈpɛn.səl',    stress: 0, traps: ['plosive_force', 'schwa'], near: ['bensil'],      lvl: 1, track: 'gen' },
  { w: 'ship',     ipa: 'ʃɪp',         stress: 0, traps: ['vowel_len', 'sh_s'], near: ['sheep', 'sip'],     lvl: 1, track: 'gen' },
  { w: 'sheep',    ipa: 'ʃip',         stress: 0, traps: ['vowel_len', 'sh_s'], near: ['ship', 'seep'],     lvl: 1, track: 'gen' },
  { w: 'measure',  ipa: 'ˈmɛ.ʒəɹ',     stress: 0, traps: ['zh', 'schwa'],   near: ['mezer', 'major'],      lvl: 1, track: 'gen' },
  { w: 'language', ipa: 'ˈlæŋ.ɡwɪdʒ',  stress: 0, traps: ['j_z'],           near: ['languez', 'languid'],  lvl: 1, track: 'gen' },
  { w: 'judge',    ipa: 'dʒʌdʒ',       stress: 0, traps: ['j_z', 'final_stop'], near: ['juj', 'zuz'],      lvl: 1, track: 'gen' },

  /* ---- Level 2 · general · stress starts to carry meaning --------------- */
  { w: 'develop',      ipa: 'dɪ.ˈvɛ.ləp', stress: 1, traps: ['stress', 'v_f', 'schwa'], near: ['devlop'], lvl: 2, track: 'gen' },
  { w: 'photograph',   ipa: 'ˈfoʊ.tə.ɡɹæf', stress: 0, traps: ['stress', 'schwa'], near: ['photographer'], lvl: 2, track: 'gen' },
  { w: 'photography',  ipa: 'fə.ˈtɑ.ɡɹə.fi', stress: 1, traps: ['stress', 'schwa'], near: ['photograph'], lvl: 2, track: 'gen' },
  { w: 'photographic', ipa: 'foʊ.tə.ˈɡɹæ.fɪk', stress: 2, traps: ['stress', 'schwa'], near: [], lvl: 2, track: 'gen' },
  { w: 'comfortable',  ipa: 'ˈkʌmf.təɹ.bəl', stress: 0, traps: ['stress', 'schwa'], near: ['comfort table'], lvl: 2, track: 'gen' },
  { w: 'vegetable',    ipa: 'ˈvɛdʒ.tə.bəl', stress: 0, traps: ['stress', 'schwa', 'v_f'], near: ['vege table'], lvl: 2, track: 'gen' },
  { w: 'opportunity',  ipa: 'ɑ.pəɹ.ˈtu.nə.ti', stress: 2, traps: ['stress', 'schwa'], near: [], lvl: 2, track: 'gen' },
  { w: 'available',    ipa: 'ə.ˈveɪ.lə.bəl', stress: 1, traps: ['stress', 'schwa', 'v_f'], near: [], lvl: 2, track: 'gen' },
  { w: 'question',     ipa: 'ˈkwɛs.tʃən', stress: 0, traps: ['schwa'], near: ['kweschan'], lvl: 2, track: 'gen' },
  { w: 'temperature',  ipa: 'ˈtɛm.pəɹ.ə.tʃəɹ', stress: 0, traps: ['stress', 'schwa'], near: ['temprature'], lvl: 2, track: 'gen' },

  /* ---- Level 2-3 · software engineering -------------------------------- */
  { w: 'algorithm',     ipa: 'ˈæl.ɡə.ɹɪ.ðəm', stress: 0, traps: ['stress', 'th_voiced', 'schwa'], near: ['algorism', 'al gore rhythm'], lvl: 2, track: 'swe' },
  { w: 'parameter',     ipa: 'pə.ˈɹæ.mə.təɹ', stress: 1, traps: ['stress', 'schwa'], near: ['para meter', 'perimeter'], lvl: 2, track: 'swe' },
  { w: 'variable',      ipa: 'ˈvɛ.ɹi.ə.bəl',  stress: 0, traps: ['stress', 'v_f', 'schwa'], near: ['veriable', 'wariable'], lvl: 2, track: 'swe' },
  { w: 'iterate',       ipa: 'ˈɪ.tə.ɹeɪt',    stress: 0, traps: ['stress', 'final_stop'], near: ['it rate'], lvl: 2, track: 'swe' },
  { w: 'schema',        ipa: 'ˈski.mə',       stress: 0, traps: ['s_cluster', 'schwa'], near: ['shema', 'is kema'], lvl: 2, track: 'swe' },
  { w: 'cache',         ipa: 'kæʃ',           stress: 0, traps: ['sh_s'], near: ['cash', 'cass', 'catch'], lvl: 2, track: 'swe' },
  { w: 'query',         ipa: 'ˈkwɪ.ɹi',       stress: 0, traps: ['w_v'], near: ['kveri', 'curry'], lvl: 2, track: 'swe' },
  { w: 'tuple',         ipa: 'ˈtu.pəl',       stress: 0, traps: ['plosive_force', 'schwa'], near: ['topple', 'dupple'], lvl: 2, track: 'swe' },
  { w: 'boolean',       ipa: 'ˈbu.li.ən',     stress: 0, traps: ['stress', 'schwa'], near: ['bolean'], lvl: 2, track: 'swe' },
  { w: 'integer',       ipa: 'ˈɪn.tə.dʒəɹ',   stress: 0, traps: ['j_z', 'schwa'], near: ['integar', 'intezar'], lvl: 2, track: 'swe' },
  { w: 'recursion',     ipa: 'ɹɪ.ˈkɜɹ.ʒən',   stress: 1, traps: ['zh', 'stress'], near: ['recurshion', 'recursen'], lvl: 3, track: 'swe' },
  { w: 'latency',       ipa: 'ˈleɪ.tən.si',   stress: 0, traps: ['stress', 'schwa'], near: ['lettency'], lvl: 2, track: 'swe' },
  { w: 'throughput',    ipa: 'ˈθɹu.pʊt',      stress: 0, traps: ['th_voiceless', 'final_stop'], near: ['true put', 'tru put'], lvl: 3, track: 'swe' },
  { w: 'repository',    ipa: 'ɹɪ.ˈpɑ.zə.tɔ.ɹi', stress: 1, traps: ['stress', 'z_s', 'schwa'], near: ['repositary'], lvl: 3, track: 'swe' },
  { w: 'deployment',    ipa: 'dɪ.ˈplɔɪ.mənt', stress: 1, traps: ['stress', 'schwa', 'final_stop'], near: [], lvl: 2, track: 'swe' },
  { w: 'asynchronous',  ipa: 'eɪ.ˈsɪŋ.kɹə.nəs', stress: 1, traps: ['stress', 'schwa'], near: ['a synchronous'], lvl: 3, track: 'swe' },
  { w: 'authentication', ipa: 'ɔ.θɛn.tə.ˈkeɪ.ʃən', stress: 3, traps: ['stress', 'th_voiceless', 'sh_s'], near: [], lvl: 3, track: 'swe' },
  { w: 'configuration', ipa: 'kən.fɪ.ɡjə.ˈɹeɪ.ʃən', stress: 3, traps: ['stress', 'schwa', 'sh_s'], near: [], lvl: 3, track: 'swe' },
  { w: 'idempotent',    ipa: 'aɪ.ˈdɛm.pə.tənt', stress: 1, traps: ['stress', 'schwa'], near: [], lvl: 4, track: 'swe' },
  { w: 'heuristic',     ipa: 'hjʊ.ˈɹɪs.tɪk',  stress: 1, traps: ['stress', 's_cluster'], near: ['huristic'], lvl: 3, track: 'swe' },
  { w: 'polymorphism',  ipa: 'ˌpɑ.li.ˈmɔɹ.fɪ.zəm', stress: 2, traps: ['stress', 'v_f', 'z_s'], near: [], lvl: 3, track: 'swe' },
  { w: 'concurrency',   ipa: 'kən.ˈkɜ.ɹən.si', stress: 1, traps: ['stress', 'schwa'], near: [], lvl: 3, track: 'swe' },
  { w: 'immutable',     ipa: 'ɪ.ˈmju.tə.bəl', stress: 1, traps: ['stress', 'schwa'], near: [], lvl: 3, track: 'swe' },
  { w: 'serialize',     ipa: 'ˈsɪ.ɹi.ə.laɪz', stress: 0, traps: ['stress', 'z_s'], near: ['serialise'], lvl: 3, track: 'swe' },
  { w: 'regression',    ipa: 'ɹɪ.ˈɡɹɛ.ʃən',   stress: 1, traps: ['sh_s', 'stress'], near: ['regresen'], lvl: 2, track: 'swe' },
  { w: 'virtualize',    ipa: 'ˈvɜɹ.tʃu.ə.laɪz', stress: 0, traps: ['v_f', 'stress'], near: ['wirtualize'], lvl: 3, track: 'swe' },
  { w: 'scalability',   ipa: 'skeɪ.lə.ˈbɪ.lə.ti', stress: 2, traps: ['s_cluster', 'stress'], near: ['is calability'], lvl: 3, track: 'swe' },
  { w: 'kubernetes',    ipa: 'ˌku.bəɹ.ˈnɛ.tiz', stress: 2, traps: ['stress', 'z_s'], near: ['kubernets'], lvl: 3, track: 'swe' },

  /* ---- Level 2-4 · medical --------------------------------------------- */
  { w: 'vesicle',      ipa: 'ˈvɛ.sɪ.kəl',    stress: 0, traps: ['v_f', 'schwa'], near: ['besicle', 'vehicle'], lvl: 2, track: 'med' },
  { w: 'ischemia',     ipa: 'ɪ.ˈski.mi.ə',   stress: 1, traps: ['s_cluster', 'stress'], near: ['is chemia', 'ishemia'], lvl: 3, track: 'med' },
  { w: 'arrhythmia',   ipa: 'ə.ˈɹɪð.mi.ə',   stress: 1, traps: ['th_voiced', 'stress'], near: ['aridmia', 'arithmia'], lvl: 3, track: 'med' },
  { w: 'tachycardia',  ipa: 'ˌtæ.kɪ.ˈkɑɹ.di.ə', stress: 2, traps: ['stress', 'plosive_force'], near: [], lvl: 3, track: 'med' },
  { w: 'bradycardia',  ipa: 'ˌbɹeɪ.dɪ.ˈkɑɹ.di.ə', stress: 2, traps: ['stress'], near: [], lvl: 3, track: 'med' },
  { w: 'defibrillate', ipa: 'di.ˈfɪ.bɹə.leɪt', stress: 1, traps: ['stress', 'v_f', 'final_stop'], near: [], lvl: 3, track: 'med' },
  { w: 'epinephrine',  ipa: 'ˌɛ.pə.ˈnɛ.fɹɪn', stress: 2, traps: ['stress', 'v_f'], near: [], lvl: 3, track: 'med' },
  { w: 'pulmonary',    ipa: 'ˈpʊl.mə.nɛ.ɹi', stress: 0, traps: ['stress', 'plosive_force', 'schwa'], near: [], lvl: 2, track: 'med' },
  { w: 'thrombosis',   ipa: 'θɹɑm.ˈboʊ.sɪs', stress: 1, traps: ['th_voiceless', 'stress'], near: ['trombosis'], lvl: 3, track: 'med' },
  { w: 'anesthesia',   ipa: 'ˌæ.nəs.ˈθi.ʒə', stress: 2, traps: ['th_voiceless', 'zh', 'stress'], near: ['anesteshia'], lvl: 4, track: 'med' },
  { w: 'diagnosis',    ipa: 'ˌdaɪ.əɡ.ˈnoʊ.sɪs', stress: 2, traps: ['stress', 'schwa'], near: [], lvl: 2, track: 'med' },
  { w: 'hypertension', ipa: 'ˌhaɪ.pəɹ.ˈtɛn.ʃən', stress: 2, traps: ['stress', 'sh_s'], near: [], lvl: 2, track: 'med' },
  { w: 'myocardial',   ipa: 'ˌmaɪ.ə.ˈkɑɹ.di.əl', stress: 2, traps: ['stress', 'schwa'], near: [], lvl: 3, track: 'med' },
  { w: 'sepsis',       ipa: 'ˈsɛp.sɪs',      stress: 0, traps: ['s_cluster', 'final_stop'], near: ['sepsis is'], lvl: 2, track: 'med' },
  { w: 'catheter',     ipa: 'ˈkæ.θə.təɹ',    stress: 0, traps: ['th_voiceless', 'schwa'], near: ['cateter', 'cathether'], lvl: 2, track: 'med' },
  { w: 'sterile',      ipa: 'ˈstɛ.ɹəl',      stress: 0, traps: ['s_cluster', 'schwa'], near: ['is sterile', 'steril'], lvl: 2, track: 'med' },
  { w: 'asystole',     ipa: 'eɪ.ˈsɪs.tə.li', stress: 1, traps: ['s_cluster', 'stress'], near: ['a systole'], lvl: 4, track: 'med' },
  { w: 'auscultate',   ipa: 'ˈɔ.skəl.teɪt',  stress: 0, traps: ['s_cluster', 'final_stop'], near: [], lvl: 4, track: 'med' },
  { w: 'dyspnea',      ipa: 'ˈdɪsp.ni.ə',    stress: 0, traps: ['s_cluster'], near: ['dispenia'], lvl: 4, track: 'med' },
  { w: 'syncope',      ipa: 'ˈsɪŋ.kə.pi',    stress: 0, traps: ['stress', 'schwa'], near: ['sinkope', 'sin cope'], lvl: 3, track: 'med' },
  { w: 'anaphylaxis',  ipa: 'ˌæ.nə.fə.ˈlæk.sɪs', stress: 3, traps: ['stress', 'v_f'], near: [], lvl: 4, track: 'med' },
  { w: 'edema',        ipa: 'ɪ.ˈdi.mə',      stress: 1, traps: ['stress', 'vowel_len'], near: ['idema'], lvl: 2, track: 'med' },

  /* ---- Level 4 · connected speech -------------------------------------- *
   * Sentences exist to measure rhythm, which a single word cannot show. The
   * stress field is -1 because the metric here is nPVI across the whole line,
   * not which syllable of one word won.                                     */
  { w: 'I think the third result is the one we want.', ipa: '', stress: -1, traps: ['th_voiceless', 'rhythm'], near: [], lvl: 4, track: 'gen' },
  { w: 'The weather there is better than the weather here.', ipa: '', stress: -1, traps: ['th_voiced', 'rhythm'], near: [], lvl: 4, track: 'gen' },
  { w: 'We should measure the value before we change it.', ipa: '', stress: -1, traps: ['zh', 'v_f', 'rhythm'], near: [], lvl: 4, track: 'gen' },
  { w: 'Did you save the file?', ipa: '', stress: -1, traps: ['intonation', 'v_f'], near: [], lvl: 4, track: 'gen' },
  { w: 'The algorithm runs in linear time.', ipa: '', stress: -1, traps: ['rhythm', 'th_voiced'], near: [], lvl: 4, track: 'swe' },
  { w: 'The schema changed, so the query fails.', ipa: '', stress: -1, traps: ['s_cluster', 'rhythm'], near: [], lvl: 4, track: 'swe' },
  { w: 'Can you review my pull request today?', ipa: '', stress: -1, traps: ['intonation', 'v_f'], near: [], lvl: 4, track: 'swe' },
  { w: 'The patient has a rapid, irregular pulse.', ipa: '', stress: -1, traps: ['rhythm'], near: [], lvl: 4, track: 'med' },
  { w: 'Start compressions and call for the defibrillator.', ipa: '', stress: -1, traps: ['s_cluster', 'rhythm'], near: [], lvl: 4, track: 'med' },
  { w: 'Is the airway clear?', ipa: '', stress: -1, traps: ['intonation'], near: [], lvl: 4, track: 'med' },
];

const LEVELS = [
  { n: 1, name: 'Foundation',       blurb: 'The consonants Nepali does not have. One syllable at a time.' },
  { n: 2, name: 'Building',         blurb: 'Two to four syllables, where stress starts to decide the word.' },
  { n: 3, name: 'Academic',         blurb: 'The long technical words you actually say at work.' },
  { n: 4, name: 'Connected speech', blurb: 'Whole sentences: rhythm and intonation, not sounds.' },
];

const TRACKS = [
  { id: 'gen', name: 'General' },
  { id: 'swe', name: 'Software' },
  { id: 'med', name: 'Medical' },
];

/* Syllable count is derived, never typed: the deck had three wrong counts when
 * they were hand-entered, and a wrong expected count makes the app accuse you
 * of inserting a vowel you did not insert. */
function syllablesOf(item) {
  if (item.stress < 0) return null;            // sentences are not counted
  if (item.ipa) return item.ipa.split('.').length;
  return null;
}

export { DECK, TRAPS, LEVELS, TRACKS, syllablesOf };
