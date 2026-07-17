window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['sliding-window'] = {
  id: 'sliding-window',
  title: 'Sliding Window',
  titleNe: 'माइक्रोको झ्यालबाट हेरेजस्तै — सर्दै जाने झ्याल',
  intro: 'best contiguous run (subarray/substring) in O(n) by growing and shrinking a window',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'The answer is a <b>contiguous</b> subarray / substring — “longest…”, “shortest…”, “max sum of…”.',
        'A condition must hold inside the run: at most K distinct, no repeats, sum ≥ target…',
        'Both pointers move <b>forward only</b> — unlike converging two pointers.',
      ],
      narration: 'अब Sliding Window। प्रश्नमा longest substring, shortest subarray, at most K distinct — यस्ता शब्द देख्नु भयो भने घण्टी बज्नुपर्छ — उत्तर कुनै लगातारको टुक्रा हो। कथा यस्तो छ — काठमाडौंको micro मा सिट सीमित छ रे, मानौं बाह्र जना। नयाँ यात्रु पछाडिबाट चढ्दै जान्छन्। भरिएपछि के हुन्छ? अगाडिको यात्रु ओर्लन्छ, अनि मात्र नयाँ अटाउँछ। बस आफैं अगाडि बढिरहन्छ, तर भित्रको समूह — त्यो नै हाम्रो window हो — कहिले लामो, कहिले छोटो हुँदै सर्दै जान्छ। दुवै ढोका अगाडि मात्र सर्छन्, कहिल्यै पछाडि फर्कंदैनन् — यही कुराले यसलाई two pointers बाट छुट्याउँछ।',
    },
    {
      heading: 'कथा: Why it beats brute force',
      bullets: [
        'Brute force: check every (start, end) pair → O(n²) or worse.',
        'Sliding window: each element enters once, leaves once → O(n).',
        'The window “remembers” — you never rebuild the count from scratch.',
      ],
      narration: 'किन यो चाल O(n) मा सकिन्छ? किनकि हरेक यात्रु जम्मा एक पटक चढ्छ र एक पटक ओर्लन्छ — बस्, दुई घटना प्रति यात्रु। Brute force ले के गर्छ भने हरेक सम्भावित सुरु र अन्त्यको जोडी छुट्टाछुट्टै जाँच्छ — हरेक पटक शून्यबाट गन्ती। त्यो भनेको micro का यात्रु गन्न हरेक स्टपमा सबैलाई ओराेलेर फेरि चढाउनु जस्तै हो। Sliding window को जादु भनेको सम्झना हो — window भित्रको हिसाब, जस्तै हरेक अक्षरको गन्ती भएको एउटा dict, सधैं अद्यावधिक रहन्छ। एक जना चढ्दा एउटा थप्ने, एक जना ओर्लंदा एउटा घटाउने। पूरै हिसाब कहिल्यै दोहोऱ्याइँदैन।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“थप्दै जाऊ दाहिने, बिग्रे खुम्च्याऊ देब्रे।”',
      bullets: [
        'Grow: move <code>right</code> every step, add <code>nums[right]</code> into the window state.',
        'Shrink: <code>while</code> the condition breaks, remove <code>nums[left]</code>, move <code>left</code>.',
        'Record the answer after the window is valid again.',
      ],
      narration: 'सूत्र — थप्दै जाऊ दाहिने, बिग्रे खुम्च्याऊ देब्रे। दाहिने ढोका हरेक कदममा एक पाइला सर्छ र नयाँ element window भित्र पस्छ। जब नियम भङ्ग हुन्छ — मानौं distinct अक्षर K भन्दा बढी भयो — तब while loop ले देब्रेबाट निकाल्दै जान्छ, नियम फेरि नमिलुन्जेल। नियम मिलेपछि मात्र उत्तर टिप्ने। ध्यान दिनुहोस् — खुम्च्याउने काम if ले होइन, while ले गर्ने हो, किनकि एकै पटकमा धेरै जना ओराल्नुपर्ने पनि हुन सक्छ। यही सानो कुरामा धेरै bug लुक्छ।',
    },
    {
      heading: 'Python template (variable-size window)',
      code: 'def longest_ok_window(s, k):\n    count = {}\n    left = 0\n    best = 0\n    for right, ch in enumerate(s):\n        count[ch] = count.get(ch, 0) + 1        # थप्दै जाऊ दाहिने\n        while len(count) > k:                    # बिग्रियो?\n            count[s[left]] -= 1                  # खुम्च्याऊ देब्रे\n            if count[s[left]] == 0:\n                del count[s[left]]\n            left += 1\n        best = max(best, right - left + 1)       # valid भएपछि मात्र टिप्ने\n    return best',
      narration: 'Template हेर्नुहोस्। बाहिरको for loop ले right लाई हरेक पटक अगाडि सार्छ — यो कहिल्यै रोकिँदैन। भित्रको while ले नियम बिग्रिएका बेला मात्र left सार्छ। window को लम्बाइ right माइनस left प्लस one — यो सूत्र घोक्नै पर्छ, one जोड्न बिर्सने गल्ती असाध्यै धेरै हुन्छ। अनि count शून्य पुगेको चाबी dict बाट मेट्न नबिर्सनुहोस्, नत्र len of count ले गलत उत्तर दिन्छ। जम्मा complexity — time O(n), space O(k)।',
    },
    {
      heading: 'होसियार! Two flavours + pitfalls',
      bullets: [
        '<b>Fixed-size</b> window (size k given): slide by adding one, removing one — no while loop needed.',
        '<b>Variable-size</b>: the template above; “longest” records after shrinking, “shortest” records <i>inside</i> the shrink loop.',
        'Negative numbers break the sum-based shrink logic — that variant needs prefix sums instead.',
      ],
      narration: 'अन्त्यमा दुई स्वाद छुट्याऔं। Window को size प्रश्नले नै तोकिदिएको छ भने — मानौं ठीक k को — त्यहाँ while नै चाहिँदैन, एउटा थप्यो, एउटा हटायो, सरर स्लाइड। Size आफैं खोज्नुपर्ने भए माथिकै template। अनि एउटा मसिनो तर महत्वपूर्ण कुरा — longest खोज्दा उत्तर window साँघुरो पारिसकेपछि टिपिन्छ, तर shortest खोज्दा चाहिँ खुम्च्याउँदै गर्दा भित्रै टिप्नुपर्छ, किनकि खुम्चिएको window नै छोटो उत्तर हो। र सबैभन्दा ठूलो पासो — array मा negative number छन् भने sum घटाउँदै खुम्च्याउने तर्क नै भत्किन्छ, त्यस्तो प्रश्न sliding window ले होइन, prefix sum ले हल हुन्छ। त्यो pattern अलि पछि आउँदैछ।',
    },
  ],
};
