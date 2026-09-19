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
 * instruction is a thing to do with the mouth — never "say it correctly".
 *
 *   why    what Nepali does instead, and why
 *   fix    the one thing to move, right now, in this word
 *   drill  how to rehearse it away from the word — a fix you can only perform
 *          while saying the word is not yet a fix you own */
const TRAPS = {
  th_voiceless: {
    label: '/θ/ as in think',
    why: 'Nepali has dental plosives (त थ) but no dental fricative, so /θ/ comes out as a stop: think becomes tink.',
    fix: 'Tongue tip lightly between your teeth, and keep the air flowing. If the air stops, it became a T.',
    drill: 'Hold a long ssss, then slide the tongue forward until it touches the teeth and the hiss goes soft. That soft hiss is /θ/. Say th-th-th-think five times, then record.',
  },
  th_voiced: {
    label: '/ð/ as in father',
    why: 'Same missing fricative, voiced. /ð/ lands on द or ध and father becomes fadar.',
    fix: 'Tongue tip between the teeth, voice on, air continuous. You should feel a buzz on the tongue tip.',
    drill: 'Say “this, that, those” with a finger on your throat. The buzz has to start on the tongue tip, before the vowel, not after it.',
  },
  v_f: {
    label: '/v/ and /f/',
    why: 'Nepali has no labiodental fricatives. Both get made with two lips instead, so van and wan collapse.',
    fix: 'Lower lip against the edge of your upper teeth — not lip against lip. For /v/ add voice.',
    drill: 'Bite your lower lip gently and blow: fffff. Now switch your voice on without moving anything: vvvvv. Say the word starting from that lip position.',
  },
  w_v: {
    label: '/w/ vs /v/',
    why: 'One Nepali letter (व) covers both, so west and vest stop being different words.',
    fix: '/w/ = lips rounded, teeth uninvolved. /v/ = lower lip on upper teeth. Check which one your teeth touch.',
    drill: 'Say “woo” with your lips pushed forward like a kiss and your teeth well clear. Keep that shape and run straight into the word.',
  },
  sh_s: {
    label: '/ʃ/ as in shoes',
    why: 'The paper is explicit: Nepalis replace /ʃ/ with /s/, so shoes is heard as sues.',
    fix: 'Pull the tongue back a centimetre from the /s/ position and round the lips slightly.',
    drill: 'Say /s/, then pull the tongue back a centimetre until the hiss darkens, and round your lips. Hold the dark hiss, then add the vowel.',
  },
  zh: {
    label: '/ʒ/ as in measure',
    why: 'Nepali has no /ʒ/ at all; it becomes /z/ or the affricate [dz]. measure becomes mezer.',
    fix: 'Start from /ʃ/ in "shoe", then switch your voice on without moving the tongue.',
    drill: 'Say shhh, then switch your voice on without moving the tongue. Run “vision, measure, treasure” together in one breath.',
  },
  j_z: {
    label: '/dʒ/ as in language',
    why: 'The postalveolar affricate drifts to [dz] or plain /z/ — the paper records language as [læŋɡwɪz].',
    fix: 'Close the tongue against the ridge behind your teeth first, then release into the buzz. Stop, then friction.',
    drill: 'Say /d/ and hold the closure a moment before letting it go into the buzz: d–ʒ, d–ʒ, dʒ. Stop first, friction second.',
  },
  z_s: {
    label: '/z/ at the end',
    why: 'Final /z/ devoices to /s/, which erases plurals and third-person verbs.',
    fix: 'Keep your voice running through the final consonant. Put a hand on your throat — it must still buzz.',
    drill: 'Say “bus” then “buzz” with a hand on your throat. Only the second one keeps buzzing to the very end. Now the word.',
  },
  s_cluster: {
    label: 'no vowel before s-clusters',
    why: 'The single most recognisable one: an /ɪ/ is inserted before initial sp-, st-, sk-, sm-, sn-, so smart becomes ismart. (sl- and sw- are fine.)',
    fix: 'Begin with the hiss already running, then add the stop. Never let a vowel open the word.',
    drill: 'Start from the hiss and hold it before the word arrives: sssss–mart. Do it three times. If a vowel opens the word, start again.',
  },
  stress: {
    label: 'word stress',
    why: 'Nepali does not use stress to change meaning, so speakers level-stress or default to syllable one. English fixes one stressed syllable per word and moving it costs intelligibility.',
    fix: 'Make the marked syllable longer, louder and higher — all three. The others should get shorter, not just quieter.',
    drill: 'Hum the shape before you say it — da-DA-da — and only then put the letters onto the hum. The hum is the word; the letters are decoration.',
  },
  schwa: {
    label: 'schwa in unstressed syllables',
    why: 'Nepali gives every syllable full value, so unstressed vowels stay strong and the word loses its shape.',
    fix: 'Let the unstressed vowels collapse to a lazy uh. Do not pronounce the letter you see.',
    drill: 'Say it too fast to pronounce the unstressed vowels properly. That over-reduction lands closer to English than being careful does.',
  },
  vowel_len: {
    label: 'long vs short vowel',
    why: 'English has 12 monophthongs, Nepali has 6, so pairs like ship/sheep and full/fool merge.',
    fix: 'Hold the long vowel roughly twice as long, and keep the tongue still while you do it.',
    drill: 'Say the pair back to back — ship, sheep — holding the long one about twice as long, tongue completely still. Then say the target alone.',
  },
  final_stop: {
    label: 'the final consonant',
    why: 'Word-final stops get swallowed, so the listener loses the tense and the plural.',
    fix: 'Release the last consonant audibly. A tiny puff, not a full extra syllable.',
    drill: 'Say the word and add a tiny puff off the end: smart-t. Then shrink the puff until it is only just audible but still there.',
  },
  plosive_force: {
    label: 'force on initial p, t, k',
    why: 'The paper notes Nepalis do not press hard enough for initial /p/ /t/ /k/, so pencil and tanker blur.',
    fix: 'Build real pressure behind the closure and let it burst. Hold a tissue up — it should move.',
    drill: 'Hold a tissue a hand-width in front of your mouth. Say the word. If the tissue does not move on the first consonant, press harder.',
  },
  rhythm: {
    label: 'stress-timed rhythm',
    why: 'Nepali is syllable-timed: every syllable gets about the same length. English compresses unstressed syllables between beats.',
    fix: 'Tap the stressed words at an even tempo and cram everything else into the gaps.',
    drill: 'Tap a steady beat on the table, one tap per stressed word, and squeeze every unstressed syllable into the gaps between taps.',
  },
  intonation: {
    label: 'intonation',
    why: 'Falling for statements and wh-questions, rising for yes/no questions. A flat contour reads as disinterest.',
    fix: 'Decide before you speak whether the line ends up or down, and exaggerate it.',
    drill: 'Say the line twice — once ending up, once ending down — and decide which one matches the meaning before you record it.',
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

/* Orthographic syllable splits, for showing the beats on the spelling the user
 * is actually reading rather than only on the IPA. Hand-typed, because English
 * spelling does not divide by rule — and therefore checked at runtime against
 * the IPA in spellSyllables() below, which returns null on any disagreement.
 * A word with a typo here simply loses the beat row; it never gets a beat
 * boundary drawn in the wrong place. test.mjs asserts every word has a valid
 * split, so the silent fallback should never actually fire in shipped data.
 *
 * The splits follow the pronunciation, not the dictionary's hyphenation:
 * vegetable is veg·eta·ble because the middle "e" is not spoken. */
const SPELLED = {
  thirty: 'thir\u00b7ty', father: 'fa\u00b7ther', weather: 'wea\u00b7ther', very: 've\u00b7ry',
  student: 'stu\u00b7dent', pencil: 'pen\u00b7cil', measure: 'mea\u00b7sure', language: 'lan\u00b7guage',

  develop: 'de\u00b7ve\u00b7lop', photograph: 'pho\u00b7to\u00b7graph',
  photography: 'pho\u00b7to\u00b7gra\u00b7phy', photographic: 'pho\u00b7to\u00b7gra\u00b7phic',
  comfortable: 'com\u00b7fort\u00b7able', vegetable: 'veg\u00b7eta\u00b7ble',
  opportunity: 'op\u00b7por\u00b7tu\u00b7ni\u00b7ty', available: 'a\u00b7vai\u00b7la\u00b7ble',
  question: 'ques\u00b7tion', temperature: 'tem\u00b7per\u00b7a\u00b7ture',

  algorithm: 'al\u00b7go\u00b7ri\u00b7thm', parameter: 'pa\u00b7ra\u00b7me\u00b7ter',
  variable: 'va\u00b7ri\u00b7a\u00b7ble', iterate: 'i\u00b7te\u00b7rate', schema: 'sche\u00b7ma',
  query: 'que\u00b7ry', tuple: 'tu\u00b7ple', boolean: 'boo\u00b7le\u00b7an',
  integer: 'in\u00b7te\u00b7ger', recursion: 're\u00b7cur\u00b7sion', latency: 'la\u00b7ten\u00b7cy',
  throughput: 'through\u00b7put', repository: 're\u00b7po\u00b7si\u00b7to\u00b7ry',
  deployment: 'de\u00b7ploy\u00b7ment', asynchronous: 'a\u00b7syn\u00b7chro\u00b7nous',
  authentication: 'au\u00b7then\u00b7ti\u00b7ca\u00b7tion', configuration: 'con\u00b7fi\u00b7gu\u00b7ra\u00b7tion',
  idempotent: 'i\u00b7dem\u00b7po\u00b7tent', heuristic: 'heu\u00b7ris\u00b7tic',
  polymorphism: 'po\u00b7ly\u00b7mor\u00b7phi\u00b7sm', concurrency: 'con\u00b7cur\u00b7ren\u00b7cy',
  immutable: 'im\u00b7mu\u00b7ta\u00b7ble', serialize: 'se\u00b7ri\u00b7a\u00b7lize',
  regression: 're\u00b7gre\u00b7ssion', virtualize: 'vir\u00b7tu\u00b7a\u00b7lize',
  scalability: 'sca\u00b7la\u00b7bi\u00b7li\u00b7ty', kubernetes: 'ku\u00b7ber\u00b7ne\u00b7tes',

  vesicle: 've\u00b7si\u00b7cle', ischemia: 'i\u00b7sche\u00b7mi\u00b7a', arrhythmia: 'a\u00b7rrhyth\u00b7mi\u00b7a',
  tachycardia: 'ta\u00b7chy\u00b7car\u00b7di\u00b7a', bradycardia: 'bra\u00b7dy\u00b7car\u00b7di\u00b7a',
  defibrillate: 'de\u00b7fi\u00b7bri\u00b7llate', epinephrine: 'e\u00b7pi\u00b7ne\u00b7phrine',
  pulmonary: 'pul\u00b7mo\u00b7na\u00b7ry', thrombosis: 'throm\u00b7bo\u00b7sis',
  anesthesia: 'a\u00b7nes\u00b7the\u00b7sia', diagnosis: 'di\u00b7ag\u00b7no\u00b7sis',
  hypertension: 'hy\u00b7per\u00b7ten\u00b7sion', myocardial: 'my\u00b7o\u00b7car\u00b7di\u00b7al',
  sepsis: 'sep\u00b7sis', catheter: 'ca\u00b7the\u00b7ter', sterile: 'ste\u00b7rile',
  asystole: 'a\u00b7sys\u00b7to\u00b7le', auscultate: 'au\u00b7scul\u00b7tate', dyspnea: 'dysp\u00b7ne\u00b7a',
  syncope: 'syn\u00b7co\u00b7pe', anaphylaxis: 'a\u00b7na\u00b7phy\u00b7la\u00b7xis', edema: 'e\u00b7de\u00b7ma',
};

/* The word split into as many chunks as it has syllables, or null if the split
 * cannot be trusted. Null is a real answer: the UI says "the beats could not be
 * lined up" rather than drawing a boundary it guessed. */
function spellSyllables(item) {
  const n = syllablesOf(item);
  if (!n) return null;
  const raw = SPELLED[item.w];
  if (!raw) return n === 1 ? [item.w] : null;
  const parts = raw.split('\u00b7');
  if (parts.length !== n) return null;              // disagrees with the IPA
  if (parts.join('') !== item.w) return null;       // disagrees with the spelling
  return parts;
}

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

export { DECK, TRAPS, LEVELS, TRACKS, syllablesOf, spellSyllables };
