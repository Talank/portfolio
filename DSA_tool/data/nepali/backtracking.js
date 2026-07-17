window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['backtracking'] = {
  id: 'backtracking',
  title: 'Backtracking',
  titleNe: 'अघि बढ, अलमलियो भने फर्क',
  intro: 'choose → explore → un-choose — the three-step dance behind every subset, permutation, and puzzle solver',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“Generate all subsets / permutations / combinations” — anything that wants <b>every</b> valid arrangement.',
        'Puzzle solvers: N-Queens, Sudoku, word search — try a choice, and undo it if it leads nowhere.',
        'Exponential by nature — the art is <b>pruning</b> early, not avoiding the exponential.',
      ],
      narration: 'अब Backtracking — नाम सुन्दा गाह्रो लाग्छ, तर यो त हामी सानै देखि गर्दै आएको काम हो। कल्पना गर्नुहोस् — तपाईं भुलभुलैया (maze) मा हुनुहुन्छ, बाटो थाहा छैन। के गर्नुहुन्छ? एउटा बाटो रोज्नुहुन्छ, अघि बढ्नुहुन्छ। पर्खाल आयो वा पहिले नै गएको ठाउँ आयो भने? पछाडि फर्केर, अर्को बाटो रोज्नुहुन्छ। यही हो backtracking — रोज, अघि बढ, अलमलियो भने त्यही रोजाइ मेटाएर फर्क, अर्को रोज्नुहोस्। Subsets, permutations, N-Queens, Sudoku — सबैको मुटुमा यही तीन-चालको नाच छ। यो स्वभावैले exponential हुन्छ — सबै सम्भावना हेर्नुपर्ने भएकोले — कला भनेको exponential लाई हटाउनु होइन, बरु बेकारका बाटो चाँडै चिनेर काट्नु (pruning) हो।',
    },
    {
      heading: 'कथा: The three-step dance',
      bullets: [
        '<b>Choose</b>: add a candidate to the current path.',
        '<b>Explore</b>: recurse — go deeper as if this choice was final.',
        '<b>Un-choose (backtrack)</b>: remove it before trying the next candidate — the path must be clean for siblings.',
      ],
      narration: 'तीन-चालको नाच नजिकबाट हेरौं। पहिलो — रोज — अहिलेको बाटोमा एउटा नयाँ ठाउँ थप्ने। दोस्रो — अघि बढ — जसरी यही रोजाइ अन्तिम हो झैं गरी recursion ले अझ गहिरो जाने। तेस्रो, र सबैभन्दा बिर्सिने चरण — फर्क — त्यो थप्नुभन्दा अघिको अवस्थामै फर्काउने, अर्को दाजुभाइ रोजाइ प्रयास गर्नुअघि। किन यो तेस्रो चरण अनिवार्य छ? सोच्नुहोस् — तपाईं साथीहरूसँग समूह-फोटोको लागि उभिने क्रम मिलाउँदै हुनुहुन्छ। एउटा क्रम कोसिस गर्नुभयो, फोटो खिचियो (recursion सकियो) — अब अर्को क्रम कोसिस गर्नुअघि पहिलेकै मान्छे लाइनमा बसिरहेको भए अर्को combination सही बन्दैन। त्यसैले फर्किंदा जहिल्यै त्यही एउटा थपाइ हटाउने — path लाई siblings का लागि सफा राख्ने। यही एउटा अनुशासनले backtracking लाई सही बनाउँछ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“रोज, अघि बढ, अलमलियो भने फर्क — path सधैं सफा राख।”',
      bullets: [
        'The path/current state is <b>mutated in place</b> — append then pop, not new lists every call.',
        'A base case saves (a copy of) the path when it is complete or valid.',
        'Pruning = check the constraint <i>before</i> recursing deeper, not after.',
      ],
      narration: 'सूत्र — रोज, अघि बढ, अलमलियो भने फर्क, path सधैं सफा राख। व्यवहारमा एउटा प्राविधिक कुरा याद राख्नुहोस् — प्रायः एउटै path list लाई बारम्बार append र pop गरिन्छ, हरेक call मा नयाँ list नबनाई — यसले स्मृति (memory) बचाउँछ। Base case मा पुगेपछि — path पूरा भयो वा शर्त पुग्यो भने — त्यो path को एउटा copy (list of path, copy नगरी सिधै राख्दा पछि त्यही reference खाली भएर देखिन्छ) उत्तरमा थप्ने। र pruning भनेको के हो — शर्त तोडिने कि भनेर पहिल्यै जाँच्ने, गइसकेपछि पछुतो नमानी। जस्तै Sudoku मा अङ्क राख्नुअघि नै — यो row, column, box मा मिल्छ कि भनेर जाँचिहाल्ने, राखेर पछि जाँच्दा धेरै समय खेर जान्छ।',
    },
    {
      heading: 'Python template',
      code: '# Subsets — the cleanest skeleton\ndef subsets(nums):\n    res, path = [], []\n    def backtrack(start):\n        res.append(path[:])              # स्न्यापशट (copy) थप\n        for i in range(start, len(nums)):\n            path.append(nums[i])          # रोज\n            backtrack(i + 1)               # अघि बढ\n            path.pop()                     # फर्क\n    backtrack(0)\n    return res\n\n# Permutations — the "used" set variant\ndef permutations(nums):\n    res, path, used = [], [], [False] * len(nums)\n    def backtrack():\n        if len(path) == len(nums):\n            res.append(path[:])\n            return\n        for i in range(len(nums)):\n            if used[i]:\n                continue\n            used[i] = True\n            path.append(nums[i])\n            backtrack()\n            path.pop()\n            used[i] = False\n    backtrack()\n    return res',
      narration: 'दुई template — दुवैको ढाँचा उस्तै, फरक भनेको “के छोड्ने कति” मा। Subsets मा हरेक नोड नै एउटा valid उत्तर हो — त्यसैले res dot append हरेक call को सुरुमै हुन्छ — त्यसपछि matplotlib जस्तै for loop ले अगाडिका मात्र (start देखि) रोज्दै जान्छ, पछाडिका दोहोरिन नदिन। Permutations मा भने क्रम फरक भए पनि नयाँ उत्तर मानिन्छ, त्यसैले used भन्ने array ले “यो अङ्क अहिले path मा छ कि छैन” ट्र्याक गर्छ, र base case path पूरै भरिएपछि मात्र आउँछ। दुवैमा उही ढाँचा दोहोरिन्छ — append, recurse, pop — यो तीन लाइन नै backtracking को सम्पूर्ण व्याकरण हो।',
    },
    {
      heading: 'होसियार! Pitfalls and where it shows up',
      bullets: [
        'Forgetting to pop/undo → the path leaks into sibling branches → silently wrong answers.',
        'Duplicates in input (e.g. Subsets II): sort first, then skip <code>nums[i] == nums[i-1]</code> at the same recursion depth.',
        'N-Queens / Sudoku: track constraints (columns, diagonals) with sets for O(1) checks, not re-scanning the board.',
        'If overlapping subproblems appear (same state reached multiple ways), you may actually want DP, not backtracking.',
      ],
      narration: 'अन्तिम होसियारी। सबैभन्दा सामान्य गल्ती — pop गर्न बिर्सिनु — path अर्को branch मा चुहिन्छ र उत्तर चुपचाप गलत आउँछ, कुनै error नै नआई — त्यसैले debug गर्न गाह्रो हुन्छ, सधैं जाँच्नुहोस्। Input मा दोहोरो अङ्क भएको बेला (जस्तै Subsets दुई) — पहिला sort गर्ने, अनि उही तहमा अघिल्लो जत्तिकै अङ्क आयो भने छोड्ने — नत्र उही subset पटक-पटक दोहोरिन्छ। N-Queens र Sudoku जस्ता puzzle मा column, diagonal जस्ता constraint लाई set मा राखेर O(1) मा जाँच्ने बानी बसाल्नुहोस्, हरेक पटक पूरै board नस्क्यान गरी। र एउटा गहिरो अन्तरदृष्टि — यदि उस्तै state पटक-पटक फरक बाटोबाट आइरहेको महसुस भयो भने, त्यो backtracking भन्दा dynamic programming को संकेत हुन सक्छ — अर्को module मा त्यो भेट्नुहुनेछ।',
    },
  ],
};
