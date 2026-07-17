window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['heaps-top-k'] = {
  id: 'heaps-top-k',
  title: 'Heaps / Top-K',
  titleNe: 'सधैं सिरानीमा सानो (वा ठूलो)',
  intro: 'a lazy tree that only guarantees the top of the pile — perfect for “k best” questions',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“Top K”, “Kth largest/smallest”, “K closest points”, “merge K sorted lists” — the K is the signal.',
        'Heap gives O(log n) push/pop and O(1) peek at the best — much cheaper than sorting everything.',
        'Python’s <code>heapq</code> is a <b>min-heap only</b> — negate values to fake a max-heap.',
      ],
      narration: 'अब Heap, र त्यसको सबैभन्दा प्रिय प्रयोग — Top-K प्रश्नहरू। जहिल्यै प्रश्नमा K अक्षर देख्नुभयो — kth largest, K closest, top K frequent — दिमागमा heap बजोस्। किन? किनभने पूरै array sort गर्नु त धेरै धेरै बढी मेहनत हो — हामीलाई त सिरानीको टुप्पो मात्र चाहिएको छ, पूरै ओछ्यान मिलाउनु पर्दैन। कथा यसो सोच्नुहोस् — भान्साको भाँडा थुप्रो — तपाईंलाई जहिल्यै सबैभन्दा सानो भाँडो चाहिन्छ, पूरै थुप्रो क्रमबद्ध गर्नु पर्दैन, टुप्पोमा जहिल्यै सानो नै आइरहोस् भने पुग्छ। Python मा heapq भन्ने भाँडो छ, तर त्यसले सधैं सानोलाई मात्र माथि राख्छ — ठूलो चाहियो भने value लाई ऋणात्मक बनाएर छल गर्ने चलन छ।',
    },
    {
      heading: 'कथा: Why keep only K in the heap',
      bullets: [
        'For “K largest”, keep a <b>min-heap of size K</b> — the smallest of your current top-K sits on top.',
        'New number bigger than the top? It deserves a spot — evict the top, push the new one.',
        'This keeps the heap at size K forever — O(n log K), not O(n log n).',
      ],
      narration: 'भित्री जुक्ति यहाँ छ, र यो थोरै counter-intuitive छ। K largest खोज्दा पनि माथि सानो राख्ने heap नै प्रयोग गरिन्छ — किन ठूलो हैन? सोच्नुहोस् — तपाईंको हातमा K सिट भएको भ्वाइपी लाउन्ज छ। भित्र बसेका मध्ये सबैभन्दा कमजोर मान्छे ढोकानिर उभिन्छ — किनकि नयाँ आगन्तुक आउँदा सबैभन्दा पहिले उसैलाई तुलना गर्नुपर्छ, निकाल्ने हो कि भनेर। नयाँ आगन्तुक ढोकानिरको भन्दा बलियो छ भने — ढोकानिरकोलाई बाहिर निकाल, नयाँलाई भित्र पठाऊ। कमजोर छ भने भित्रै नपस्नुस्, बाहिरै फर्काइदिनुस्। यसरी लाउन्जमा सधैं K जना मात्र बस्छन्, र ढोकानिर उभिनेचाहिँ भित्रका मध्ये सबैभन्दा कमजोर — जुन नै हामीले हेर्नुपर्ने एक मात्र मान्छे हो। पूरै array भरि सबैलाई heap मा नराखी, K आकारमै सीमित राखेकोले समय O(n log K) मा झर्छ, जुन K सानो हुँदा O(n log n) भन्दा निकै छिटो हुन्छ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“K largest चाहियो? — सानोलाई माथि राख, कमजोरलाई ढोकैमा राख।”',
      bullets: [
        'K largest → min-heap of size K. K smallest → max-heap of size K (opposite!).',
        '“Kth largest” = the top of a size-K min-heap after processing everything.',
        'K closest points → same trick, but ordered by distance instead of value.',
      ],
      narration: 'सूत्र — K largest चाहियो भने सानोलाई माथि राख, कमजोरलाई ढोकैमा राख। यहाँ एउटा जालले धेरैलाई अलमल्याउँछ — K smallest खोज्दा उल्टो हुन्छ — त्यहाँ माथि ठूलो राख्ने max-heap चाहिन्छ, किनकि अब भित्रका मध्ये सबैभन्दा “नराम्रो” (ठूलो) लाई ढोकानिर राखेर तुलना गर्नुपर्छ। यो जोडी बिपरीत छ भनेर घोक्नुहोस् — largest मा min-heap, smallest मा max-heap। Kth largest एउटै मात्र संख्या खोज्ने प्रश्न हो — पूरै array यसरी नै प्रशोधन गरेपछि heap को टुप्पो नै उत्तर हो। अनि K closest points to origin जस्तो प्रश्नमा उही चाल — केवल value होइन, दूरी अनुसार तुलना गर्ने मात्र फरक।',
    },
    {
      heading: 'Python template',
      code: 'import heapq\n\ndef k_largest(nums, k):\n    heap = []                          # min-heap, size ≤ k\n    for x in nums:\n        heapq.heappush(heap, x)\n        if len(heap) > k:\n            heapq.heappop(heap)        # कमजोरलाई ढोकाबाट फाल\n    return heap                        # heap[0] = kth largest\n\n# One-liner using heapq directly:\ndef k_largest_v2(nums, k):\n    return heapq.nlargest(k, nums)\n\ndef top_k_frequent(nums, k):\n    from collections import Counter\n    count = Counter(nums)\n    return heapq.nlargest(k, count.keys(), key=count.get)',
      narration: 'पहिलो function ले पूरै तर्क कोडमा देखाउँछ — push गर्दै जाने, आकार k भन्दा बढी भएपिच्छे pop — अन्त्यमा heap भित्र ठ्याक्कै k largest बाँकी रहन्छन्, र heap of zero नै kth largest हो। Python ले भने यो सबै एकै लाइनमा दिन्छ — heapq dot nlargest — इन्टरभ्यूमा तर्क बुझाएपछि यो शर्टकट पनि चिनेको देखाउनुहोस्। Top K Frequent एउटा राम्रो combo हो — पहिला Counter ले गन्ती गर्छ (हरेक module ले अघिल्लोलाई प्रयोग गर्दै जाने यो एउटा राम्रो उदाहरण हो), अनि heapq ले त्यो गन्तीमाथि नै largest k छान्छ।',
    },
    {
      heading: 'होसियार! Pitfalls and cousins',
      bullets: [
        'Min-heap of size K trick only wins when K ≪ n — for K ≈ n, plain sort is simpler and fine.',
        'Merge K Sorted Lists: push one “head” per list, pop-min, push its successor — classic heap use.',
        '<code>heapq</code> needs comparable tuples — ties on the first element compare the second, which can crash on objects.',
        'Quickselect gives O(n) average for a single “kth” query — heap wins when you need the whole top-K, repeatedly.',
      ],
      narration: 'अन्तिम होसियारी। यो K-आकारको heap जुक्ति K, n भन्दा धेरै सानो हुँदा मात्र फाइदाजनक हुन्छ — K लगभग n नै भइदियो भने सिधै sort गर्नु उस्तै हो, बरु सजिलो पनि। Merge K Sorted Lists एउटा क्लासिक प्रयोग हो — हरेक list को अगाडिको नोड heap मा राख्ने, सबैभन्दा सानो pop गर्ने, अनि त्यही list को अर्को नोड heap मा थप्दै जाने — n लिस्टको merge log n मा। एउटा प्राविधिक पासो — heapq ले tuple हरू तुलना गर्दा पहिलो अङ्क बराबर भए दोस्रो हेर्छ — त्यो दोस्रो अङ्क तुलना नहुने object भयो भने crash हुन्छ, त्यसैले tuple मा सधैं तुलना हुने चीज नै दोस्रोमा राख्नुहोस्, वा index थपिदिनुहोस्। र अन्तिम — एउटै मात्र kth element चाहिएको हो भने heap भन्दा छिटो Quickselect भन्ने O(n) average technique पनि छ — त्यो नाम मात्र चिनेर राख्नुहोस्, पूरै top-K चाहिएको बेला भने heap नै जित्छ।',
    },
  ],
};
