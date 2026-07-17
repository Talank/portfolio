window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['queue-deque'] = {
  id: 'queue-deque',
  title: 'Queue / Deque',
  titleNe: 'मन्दिरको लाइन र दुई-ढोके micro',
  intro: 'FIFO order for BFS, and the deque trick behind Sliding Window Maximum',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '<b>Queue (FIFO)</b>: process things in arrival order — the heart of BFS / level-order.',
        '<b>Deque</b>: push/pop at <i>both</i> ends in O(1) — powers Sliding Window Maximum.',
        'In Python: <code>collections.deque</code> for both — never <code>list.pop(0)</code>.',
      ],
      narration: 'अब Queue र Deque। Queue भनेको मन्दिरको लाइन — पहिले आउनेले पहिले दर्शन पाउँछ, first in first out। जहाँ-जहाँ आएकै क्रममा प्रशोधन गर्नु छ — विशेष गरी BFS, जुन अगाडि रूख र graph का module मा आउँछ — त्यहाँ queue नै मुटु हो। Deque चाहिँ अलि विशेष जन्तु हो — दुईतिरै ढोका भएको micro जस्तो — अगाडिबाट पनि चढ्न-ओर्लन मिल्ने, पछाडिबाट पनि, दुवै O(1) मा। Python मा दुवै कामका लागि एउटै भाँडो छ — collections dot deque। र एउटा कुरा अहिल्यै किलामा ठोकौं — list dot pop of zero कहिल्यै नगर्नुहोस् — अगाडिबाट निकाल्दा पछाडिका सबै element सर्नुपर्छ, O(n) — deque को popleft O(1) हो।',
    },
    {
      heading: 'कथा: Sliding Window Maximum',
      bullets: [
        'Window of size k slides; report the <b>max</b> at every stop — naive is O(nk).',
        'Think of a royal court: when a stronger newcomer arrives, everyone weaker <b>leaves for good</b>.',
        'They can never be the answer again — a weaker, older element is doubly useless.',
      ],
      narration: 'यो module को ताज — Sliding Window Maximum। Window सर्दै जान्छ, हरेक ठाउँमा भित्रको सबैभन्दा ठूलो भन्नु छ। हरेक पटक window भित्र खोज्दा O(n times k) — ठूलो input मा मर्छ। अब दरबारको कथा — दरबारमा योद्धाहरूको लाइन छ। नयाँ योद्धा भित्र पस्दा नियम — आफूभन्दा कमजोर जति लाइनबाट सधैंका लागि निस्कन्छन्। किन सधैंका लागि? सोच्नुहोस् — त्यो कमजोर योद्धा नयाँ भन्दा पहिले आएको हो, त्यसैले window बाट पनि पहिल्यै निस्कन्छ। जबसम्म ऊ भित्र छ, नयाँ बलियो पनि भित्रै छ — ऊ कहिल्यै, कुनै window मा, अधिकतम बन्नै सक्दैन। पुरानो पनि, कमजोर पनि — दोहोरो बेकार। यो प्रमाण नै deque trick को मुटु हो।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“बलियो आयो — कमजोर बिदा। बूढो भयो — अगाडिबाट बिदा।”',
      bullets: [
        'Back of deque: pop while smaller than the newcomer (kingmaking).',
        'Front of deque: pop when its index falls out of the window (retirement).',
        'The front is <i>always</i> the current maximum.',
      ],
      narration: 'सूत्र — बलियो आयो, कमजोर बिदा — बूढो भयो, अगाडिबाट बिदा। Deque का दुई ढोकाको दुई काम छुट्टाछुट्टै छ। पछाडिको ढोकाबाट कमजोरहरू निस्कन्छन् — नयाँ element भन्दा साना जति pop। अगाडिको ढोकाबाट बूढाहरू निस्कन्छन् — जसको index window भन्दा बाहिर पऱ्यो, ऊ retire। यी दुई नियम पालेपछि deque भित्र सधैं घट्दो क्रमको दरबार बाँकी रहन्छ, र अगाडिको ढोकामा उभिने योद्धा नै हरेक क्षणको महाराजा — current maximum। हरेक element एक पटक पस्छ, बढीमा एक पटक निस्कन्छ — जम्मा O(n)। अघिल्लो module को monotonic stack सँग नाता प्रस्टै छ — यो त monotonic deque हो — उही अग्लो-होचो नियम, तर दुई ढोका।',
    },
    {
      heading: 'Python template',
      code: 'from collections import deque\n\ndef max_sliding_window(nums, k):\n    dq = deque()          # indices; values decreasing\n    ans = []\n    for i, x in enumerate(nums):\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()                  # कमजोर बिदा (पछाडिबाट)\n        dq.append(i)\n        if dq[0] <= i - k:\n            dq.popleft()              # बूढो बिदा (अगाडिबाट)\n        if i >= k - 1:\n            ans.append(nums[dq[0]])   # अगाडिको = महाराजा\n    return ans',
      narration: 'Template मा तीन ब्लक छन् — कमजोर बिदा, बूढो बिदा, अनि उत्तर टिपाइ। ध्यान दिने ठाउँहरू — deque मा index राखिन्छ, value होइन — बूढो भयो कि भनेर जाँच्न index नै चाहिन्छ। उत्तर टिप्न i greater than equal k minus one पर्खनुपर्छ — पहिलो window पूरा नभई max भन्न मिल्दैन। अनि less than equal को धार — बराबर आउँदा पनि पुरानोलाई pop गरिदिने, किनकि नयाँ उही value को झन् जवान संस्करण हो — राख्नुको फाइदा छैन। Time O(n), space O(k)।',
    },
    {
      heading: 'होसियार! Where each shows up',
      bullets: [
        'Plain queue: BFS (graphs module), level-order traversal (trees module), task schedulers.',
        'Monotonic deque: Sliding Window Maximum/Minimum, Shortest Subarray with Sum ≥ K (with prefix sums).',
        'Two stacks can simulate a queue — a classic warm-up question worth knowing.',
        'Heap also gives window max but in O(n log n) — deque is strictly better here; say why.',
      ],
      narration: 'अन्त्यमा नक्सा हेरौं — कुन भाँडो कहाँ। सादा queue — BFS र level-order — अगाडिका module हरूको इन्जिन, त्यहाँ पुगेपछि यो लाइनकै कथा फेरि भेटिन्छ। Monotonic deque — window को max वा min सोधिने जहाँसुकै, र अझ कडा रूपमा Shortest Subarray with Sum at least K मा — त्यहाँ prefix sum सँग मिलेर चल्छ। एउटा प्रिय warm-up प्रश्न पनि चिनिराख्नुहोस् — दुई stack ले queue बनाउने — एउटा भर्ने भाँडो, अर्को खन्याएर उल्टो पारिएको झिक्ने भाँडो। र interview मा तुलनाको तयारी राख्नुहोस् — window max त heap ले पनि दिन्छ नि भनेर सोधे — दिन्छ, तर O(n log n) मा — deque ले O(n) मै दिन्छ, किनकि बेकार भइसकेकालाई उसले चिनेर फालिदिन्छ, heap ले बूढाहरूलाई पनि बोकेर हिँड्छ। यति भन्न सक्नु नै छुट्टिने ठाउँ हो।',
    },
  ],
};
