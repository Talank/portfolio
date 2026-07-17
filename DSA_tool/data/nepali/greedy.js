window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['greedy'] = {
  id: 'greedy',
  title: 'Greedy',
  titleNe: 'अहिले सबैभन्दा राम्रो टिप, पछि नफर्क',
  intro: 'take the locally-best choice at every step and trust it adds up to the global best — when that trust is provable',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'At each step, take the choice that looks best <b>right now</b> — never reconsider it later.',
        'Works only when the problem has the <b>greedy-choice property</b>: local best ⇒ part of some global best.',
        'Interval scheduling, coin change (canonical systems), Huffman coding, gas station.',
      ],
      narration: 'अब Greedy — सबैभन्दा सोझो देखिने तर सबैभन्दा छल्ने pattern। कथा — बजारमा तपाईं तरकारी किन्दै हुनुहुन्छ, र नियम छ — हरेक पसलमा त्यहीं-त्यहीं जे सबैभन्दा ताजा देखियो त्यही टिप्ने, अनि फेरि कहिल्यै फर्केर हेर्ने छैन। यो greedy हो — हरेक कदममा अहिले सबैभन्दा राम्रो देखिने कुरा टिप्ने, पछाडि फर्केर सोच्दै नबस्ने। तर यो चाल जहिल्यै जित्दैन — कहिलेकाहीं अहिलेको “राम्रो” ले पछि झन् महँगो सम्झौता गराउँछ। Greedy तब मात्र भरपर्दो हुन्छ जब प्रश्नमा greedy-choice property हुन्छ — अर्थात् गणितीय रूपमै प्रमाणित हुन्छ कि स्थानीय राम्रो छनोटले नै अन्तिम उत्तम उत्तरतिर लैजान्छ। Interval scheduling, gas station, Huffman coding — यी क्लासिक greedy प्रश्न हुन्।',
    },
    {
      heading: 'कथा: Why greedy needs proof, not just intuition',
      bullets: [
        'Classic trap: <b>coin change with arbitrary denominations</b> — greedy (biggest coin first) can fail!',
        'Example: coins {1, 3, 4}, target 6 — greedy picks 4+1+1 (3 coins), but 3+3 (2 coins) is better.',
        'The exchange argument: prove that swapping any optimal solution toward the greedy choice never makes it worse.',
      ],
      narration: 'greedy सबैभन्दा खतरनाक ठाउँ यही हो — नियत राम्रो लाग्छ, तर सधैं सही हुँदैन। सिक्का फिर्ता दिने प्रख्यात उदाहरण हेरौं — सिक्का एक, तीन, चार रुपैयाँका छन्, र छ रुपैयाँ फिर्ता दिनुपर्छ। Greedy सोच्छ — सबैभन्दा ठूलो सिक्का पहिले टिप — चार, अनि बाँकी दुई रुपैयाँ — एक अनि एक — जम्मा तीनवटा सिक्का। तर बुद्धिले हेर्दा तीन प्लस तीन — दुईवटा सिक्कामै सकिन्छ, झन् राम्रो! यहाँ greedy चुक्यो, किनकि यी सिक्काहरूको सेट greedy-choice property पूरा गर्दैन। जति ठाउँमा greedy प्रयोग गर्नुहुन्छ, त्यहाँ मनमनै एउटा प्रमाणको तर्क (exchange argument) खोज्नुहोस् — कुनै पनि उत्तम उत्तरलाई मेरो greedy छनोटतिर सारे पनि त्यो झन् नराम्रो बन्दैन भनेर देखाउन सक्नुपर्छ — यदि सक्नुभएन भने greedy होइन, DP खोज्नुहोस्।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“अहिले सबैभन्दा राम्रो टिप, पछि नफर्क — तर पहिले प्रमाणित गर।”',
      bullets: [
        'Interval problems: sort by <b>end time</b> — the interval that finishes soonest frees up room for the most future choices.',
        'Once sorted correctly, the greedy loop is almost always a single linear pass.',
        'If a counter-example comes to mind in 30 seconds, greedy is wrong — don’t force it.',
      ],
      narration: 'सूत्र — अहिले सबैभन्दा राम्रो टिप, पछि नफर्क, तर पहिले प्रमाणित गर। धेरै greedy प्रश्न interval (समय-अन्तराल) बारे हुन्छन् — जस्तै कति भेटघाट (meetings) एकैचोटि लिन सकिन्छ। त्यहाँ जादुई चाल एउटै छ — end time अनुसार sort गर्ने, सुरु हुने समय अनुसार होइन। किन? जुन काम सबैभन्दा चाँडो सकिन्छ, त्यसले भविष्यका लागि सबैभन्दा धेरै ठाउँ खाली छोड्छ — यही नै greedy-choice हो, र यसलाई प्रमाणित गर्न सकिन्छ। एकपटक सही किसिमले sort गरेपछि, बाँकी काम प्रायः एउटै सोझो for loop मै सकिन्छ। र एउटा व्यावहारिक जाँच — यदि पहिलो तीस सेकेन्डमै counter-example (उदाहरण जहाँ greedy चुक्छ) दिमागमा आयो भने, त्यो greedy होइन — जबरजस्ती नथोपर्नुहोस्, अर्को औजार खोज्नुहोस्।',
    },
    {
      heading: 'Python template',
      code: 'def max_meetings(intervals):\n    # intervals: list of (start, end)\n    intervals.sort(key=lambda iv: iv[1])   # end time अनुसार sort — जादुको चाबी\n    count, last_end = 0, float("-inf")\n    for start, end in intervals:\n        if start >= last_end:              # अघिल्लोसँग टकराव छैन\n            count += 1\n            last_end = end                  # टिप, फर्केर नहेर्\n    return count\n\ndef can_reach_end(gas):\n    # Gas Station flavour: can you complete a jump/gas-station loop?\n    total, tank, start = 0, 0, 0\n    for i, g in enumerate(gas):\n        total += g\n        tank += g\n        if tank < 0:                       # यहाँबाट सुरु गर्न सकिँदैन\n            start = i + 1\n            tank = 0\n    return start if total >= 0 else -1',
      narration: 'पहिलो function — Interval Scheduling — तीन लाइनको मुटु — sort by end time, अनि for loop मा अघिल्लो टिपेको भेटघाट नसकिँदै नयाँ सुरु भएन भने मात्र टिप्ने। यति सोझो देखिए पनि यसैले proven-optimal उत्तर दिन्छ। दोस्रो — Gas Station स्वादको प्रश्न — हरेक ठाउँमा tank ऋणात्मक भयो भने त्यसको मतलब सुरुविन्दुदेखि यहाँसम्म आइपुग्न सकिँदैन, त्यसैले greedy ले तुरुन्तै next ठाउँबाट फेरि सुरु गर्ने अनुमान लगाउँछ — र यो अनुमान पनि प्रमाणित छ, कुनै अघिल्लो असफल विन्दुबाट सुरु गरे झन् नराम्रो हुन्छ भनेर। दुवैमा एउटै मूल भावना — एकपटक सही sort वा सही अनुमान भेटियो भने, बाँकी काम एकै pass मा सकिन्छ।',
    },
    {
      heading: 'होसियार! When greedy fails, and how to double-check',
      bullets: [
        '0/1 Knapsack: greedy (best value/weight ratio) fails — that needs DP, not greedy.',
        'Fractional Knapsack (can take partial items): greedy <i>does</i> work — same name, different problem!',
        'Dijkstra is “greedy that works” because edge weights are non-negative — Bellman-Ford is the DP fallback when they aren’t.',
        'When in doubt: code the DP solution first (correct, maybe slow), then look for the greedy shortcut.',
      ],
      narration: 'अन्तिम, र सबैभन्दा महत्त्वपूर्ण होसियारी — greedy कहिले चुक्छ। Zero-one Knapsack मा (हरेक वस्तु या त पूरै लिने या पूरै छोड्ने) greedy ले मूल्य-तौल अनुपात हेरेर टिप्दै जाँदा चुक्छ — त्यहाँ अघिल्लो module कै DP चाहिन्छ। तर उस्तै नाम भएको Fractional Knapsack मा (वस्तुको आधा-चौथाइ पनि लिन मिल्ने) उही greedy चाल साँच्चै काम गर्छ — यो नाम मिल्दोजुल्दो भएकैले भ्रम पार्ने प्रख्यात जोडी हो, होसियार रहनुहोस्। Dijkstra लाई “greedy जो साँच्चै काम गर्छ” भनिन्छ, किनभने त्यहाँ बाटोको तौल कहिल्यै ऋणात्मक हुँदैन भन्नेग्यारेन्टी छ — तौल ऋणात्मक हुन सक्ने भइदियो भने Bellman-Ford जस्तो DP-आधारित उपाय चाहिन्छ। अन्तिम व्यावहारिक सल्लाह — शंका लाग्यो भने पहिला DP समाधान नै लेखिहाल्नुहोस् — ढिलो भए पनि सही हुन्छ — अनि त्यसपछि मात्र greedy shortcut खोज्नुहोस्, उल्टो होइन।',
    },
  ],
};
