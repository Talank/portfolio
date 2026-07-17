window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['dynamic-programming'] = {
  id: 'dynamic-programming',
  title: 'Dynamic Programming',
  titleNe: 'एकपटक सोध, नोटबुकमा लेख, फेरि नसोध',
  intro: 'overlapping subproblems + optimal substructure — remember answers instead of recomputing them',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'The brute-force recursion re-solves the <b>same subproblem</b> many times — that repetition is the signal.',
        'Ask: “can I express the answer for n in terms of the answer for smaller n?” — if yes, DP is on the table.',
        'Two flavours: top-down (recursion + memo) and bottom-up (table, filled in order).',
      ],
      narration: 'अब Dynamic Programming — धेरैलाई डर लाग्ने नाम, तर मुटु एकदमै सरल छ। Fibonacci सोच्नुहोस् — सोझो recursion ले fib of five निकाल्न fib of three लाई कति पटक फेरि-फेरि गणना गर्छ, थाहा छ? धेरै पटक — उही प्रश्न, उही उत्तर, तर बारम्बार भुलेर फेरि सोधिन्छ। कथा — एउटा विद्यार्थी जो हरेक पटक उही जोड-घटाउको जवाफ सम्झन नसकेर फेरि क्याल्कुलेटर च्यापिरहन्छ। समाधान सजिलो — पहिलो पटक जवाफ आउनासाथ नोटबुकको एउटा पानामा लेख्ने। फेरि उही प्रश्न आयो भने क्याल्कुलेटर नझिकी नोटबुक हेर्ने। यही हो DP — overlapping subproblems (दोहोरिने उपप्रश्न) र optimal substructure (सानो उत्तरबाट ठूलो उत्तर बन्ने गुण) भेटियो भने, नोटबुक (memoization) राख्ने।',
    },
    {
      heading: 'कथा: Top-down vs bottom-up — same notebook, different door',
      bullets: [
        '<b>Top-down</b>: start from the big question, recurse down, cache (<code>@lru_cache</code> or a dict) as you go.',
        '<b>Bottom-up</b>: start from the smallest base cases, build the table up to the answer — no recursion, no stack risk.',
        'Same notebook, opposite doors — top-down feels natural to write, bottom-up is safer for large n.',
      ],
      narration: 'नोटबुक राख्ने दुई तरिका छन्, दुवैले उही नोटबुक प्रयोग गर्छन्, फरक ढोकाबाट पस्छन् मात्र। Top-down — ठूलो प्रश्नबाटै सुरु गर्ने — मलाई n को उत्तर चाहियो, त्यसका लागि n-एक र n-दुई चाहियो, तिनलाई सोध्दै तल झर्ने, र उत्तर आउनासाथ नोटबुकमा टिप्दै फर्किने। यो लेख्न धेरैलाई सजिलो लाग्छ, किनकि सोझो recursion जस्तै देखिन्छ, केवल एउटा dict वा lru_cache थपिएको। Bottom-up — ठीक उल्टो ढोकाबाट — सबैभन्दा साना base case हरूबाट सुरु गरेर, तालिका तलदेखि माथिसम्म भर्दै जाने, अन्त्यमा ठूलो उत्तरमा पुग्ने। यसमा recursion नै हुँदैन, त्यसैले Python को recursion limit ठोक्किने डर छैन — n ठूलो भएका प्रश्नमा bottom-up बढी भरपर्दो हुन्छ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“एकपटक सोध, नोटबुकमा लेख, फेरि सोध्दा नोटबुक हेर, क्याल्कुलेटर नझिक।”',
      bullets: [
        'State = “what do I need to know to answer this subproblem?” — often (index) or (index, remaining capacity).',
        'Transition = how today’s state is built from yesterday’s — this is 90% of the actual thinking.',
        'Base case = the smallest state you can answer without recursing further.',
      ],
      narration: 'सूत्र — एकपटक सोध, नोटबुकमा लेख, फेरि सोध्दा नोटबुक हेर, क्याल्कुलेटर नझिक। DP प्रश्न हल गर्दा तीन कुरा टुङ्ग्याउनुपर्छ। पहिलो — state, अर्थात् यो उपप्रश्नको उत्तर दिन के-के जान्नु जरुरी छ — प्रायः एउटा index (कहाँसम्म पुगियो), कहिलेकाहीं index र बाँकी क्षमता दुवै (जस्तै Knapsack मा तौल बाँकी)। दोस्रो, र सबैभन्दा गाह्रो भाग — transition — आजको उत्तर हिजोको उत्तर(हरू)बाट कसरी बन्छ भन्ने सूत्र — DP समस्याको नब्बे प्रतिशत सोचाइ यहीं खर्च हुन्छ। तेस्रो — base case — recursion नगरिकनै जवाफ थाहा हुने सबैभन्दा सानो अवस्था। यी तीन टुङ्ग्याइसकेपछि कोड लेख्नु औपचारिकता मात्र बाँकी रहन्छ।',
    },
    {
      heading: 'Python template',
      code: 'from functools import lru_cache\n\n# Top-down: Climbing Stairs (n ways to reach step n, 1 or 2 steps at a time)\n@lru_cache(maxsize=None)\ndef climb(n):\n    if n <= 2:\n        return n                      # base case (नोटबुकको पहिलो पाना)\n    return climb(n - 1) + climb(n - 2)  # transition\n\n# Bottom-up: same problem, table filled left to right\ndef climb_bottom_up(n):\n    if n <= 2:\n        return n\n    dp = [0] * (n + 1)\n    dp[1], dp[2] = 1, 2\n    for i in range(3, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]     # transition, but as a loop\n    return dp[n]\n\n# 0/1 Knapsack — the other DP archetype (state = (index, capacity))\ndef knapsack(weights, values, capacity):\n    n = len(weights)\n    dp = [[0] * (capacity + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for c in range(capacity + 1):\n            dp[i][c] = dp[i - 1][c]                     # यो वस्तु नलिने\n            if weights[i - 1] <= c:\n                dp[i][c] = max(dp[i][c], dp[i - 1][c - weights[i - 1]] + values[i - 1])  # लिने\n    return dp[n][capacity]',
      narration: 'तीन उदाहरण। Climb Stairs को top-down रूप हेर्नुहोस् — lru_cache को एक लाइनले नै पूरै नोटबुक राखिदिन्छ, कोड सोझो recursion जस्तै देखिन्छ। त्यही प्रश्नको bottom-up रूप — dp array भर्दै जाने, for loop ले recursion बदल्छ, उही transition, तर तलदेखि माथि। अनि Knapsack — DP को अर्को ठूलो परिवार, जहाँ state मा दुई कुरा चाहिन्छ — कतिऔं वस्तुसम्म हेरियो, र झोलामा कति ठाउँ बाँकी छ। हरेक वस्तुमा दुई छनोट — नलिने (माथिकै मान सार्ने) कि लिने (यो वस्तुको मूल्य थपेर बाँकी ठाउँमा उत्तर हेर्ने) — दुवैमध्ये ठूलो राख्ने। यही “लिने कि नलिने” ढाँचा subset-sum, coin-change जस्ता धेरै प्रश्नमा दोहोरिन्छ।',
    },
    {
      heading: 'होसियार! Recognizing DP and common traps',
      bullets: [
        'Keywords: “number of ways”, “minimum/maximum cost to reach”, “can you partition/reach exactly X”.',
        'Space optimization: if <code>dp[i]</code> only needs <code>dp[i-1]</code>/<code>dp[i-2]</code>, drop the array for two variables.',
        'Off-by-one in the table size (<code>n+1</code> rows/cols) is the #1 bug — draw the table on paper first.',
        'If subproblems <i>don’t</i> overlap, you don’t need DP — plain recursion or greedy may be simpler and faster.',
      ],
      narration: 'अन्तिम होसियारी। प्रश्नमा यी शब्द देख्नुभयो भने DP को झ्यालढोका ढक्ढक्याउनुहोस् — number of ways, minimum cost to reach, can you make exactly X। एउटा राम्रो optimization — Climbing Stairs जस्तो प्रश्नमा dp of i लाई अघिल्ला दुई मात्र चाहिन्छ, पूरै array नराखी दुई भेरिएबल मात्र राख्दा space O(n) बाट O(1) मा झर्छ — यो प्रायः bonus प्रश्नको रूपमा सोधिन्छ। सबैभन्दा सामान्य bug — तालिकाको आकारमा एक-दुई को हिसाब बिग्रनु — त्यसैले कोड लेख्नुअघि सानो उदाहरणमा हातैले तालिका कोरेर हेर्ने बानी बसाल्नुहोस्। र अन्तिम — यदि उपप्रश्नहरू साँच्चै एक-अर्कासँग नदोहोरिने रहेछन् भने DP चाहिँदैन — त्यो त सादा recursion वा अघिल्लो module हरूकै backtracking/greedy ले नै छिटो हल हुन्छ, DP लाई जबरजस्ती नथोपर्नुहोस्।',
    },
  ],
};
