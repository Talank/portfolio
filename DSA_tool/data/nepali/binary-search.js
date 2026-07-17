window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['binary-search'] = {
  id: 'binary-search',
  title: 'Binary Search & Search Space Reduction',
  titleNe: 'शब्दकोश बीचबाट खोल्ने बानी',
  intro: 'halve a sorted (or monotonic) search space every step — O(log n)',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Sorted array — obviously. But the real signal is subtler:',
        'Any <b>monotonic</b> yes/no question: “all False … then all True” — find the boundary.',
        '“Minimize the maximum / maximize the minimum” → binary search <i>on the answer</i>.',
      ],
      narration: 'Binary Search — नाम त सबैले सुनेकै हो, तर interview मा यसको असली रूप अर्कै छ। पहिला कथा — शब्दकोशमा शब्द खोज्दा तपाईं पहिलो पानादेखि पल्टाउनु हुन्न, बीचबाट खोल्नुहुन्छ। खोजेको शब्द अगाडि पर्छ भने पछाडिको आधा किताब एकै झट्कामा फ्याँकियो। हरेक हेराइमा आधा-आधा फ्याँक्दै जाँदा हजार पानाको किताब जम्मा दश हेराइमा सकिन्छ — यही हो O(log n) को शक्ति। तर असली संकेत यो हो — जहाँ-जहाँ कुनै प्रश्नको उत्तर पहिले सबै होइन-होइन अनि एकै ठाउँबाट सबै हो-हो हुन्छ, त्यहाँ त्यो सिमाना binary search ले भेटिन्छ — array sorted नभए पनि!',
    },
    {
      heading: 'कथा: The boundary, not the needle',
      bullets: [
        'Old picture: find a needle equal to target.',
        'Better picture: a row of answers <code>F F F F T T T</code> — find the <b>first T</b>.',
        'First-bad-version, first index ≥ target (bisect_left), min in rotated array — all “first T”.',
      ],
      narration: 'यहाँ सोच फेर्ने बेला आयो। स्कुलमा सिकेको binary search भनेको बराबरको number खोज्ने थियो। Interview को binary search प्रायः सिमाना खोज्ने हो। कल्पना गर्नुहोस् — एक लाइन मान्छे उभिएका छन्, देब्रेपट्टिका सबैले होइन भन्छन्, दाहिनेपट्टिका सबैले हो भन्छन्। तपाईंको काम — पहिलो हो भन्ने मान्छे भेट्टाउने। बीचको मान्छेलाई सोध्नुहोस् — होइन भन्यो भने ऊ र उसका देब्रेतिरका सबै बेकार, दाहिने आधामा जाऊ। हो भन्यो भने ऊ नै उत्तर हुन सक्छ, तर अझ देब्रेमा पनि हो हुन सक्छ। First Bad Version, bisect underscore left, rotated array को minimum — सबै यही एउटै खेल हुन् — पहिलो T खोज।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“बीच हेर, आधा फ्याँक।”',
      bullets: [
        'Template: <code>while lo &lt; hi</code>, answer converges to <code>lo</code>.',
        '“T” (condition true) → <code>hi = mid</code> (mid might be the answer, keep it).',
        '“F” → <code>lo = mid + 1</code> (mid is ruled out, skip it).',
      ],
      narration: 'सूत्र — बीच हेर, आधा फ्याँक। अनि boundary-style template मा दुई नियम याद राख्नुहोस्। शर्त मिल्यो — अर्थात् T आयो — भने hi equals mid — mid लाई नफ्याँक्नुहोस्, ऊ आफैं उत्तर हुन सक्छ। शर्त मिलेन भने lo equals mid plus one — mid पक्का उत्तर होइन, नाघेर जाऊ। while lo less than hi चलाउनुहोस्, loop सकिँदा lo र hi एकै ठाउँमा उभिन्छन् — त्यही पहिलो T हो। यो एउटै template घोक्नुभयो भने off-by-one को जङ्गलबाट सधैंका लागि मुक्ति — infinite loop पनि हुँदैन, किनकि hi equals mid ले range साँच्चै साँघुरिन्छ।',
    },
    {
      heading: 'Python template (boundary form)',
      code: 'def first_true(lo, hi, ok):\n    # ok(x): F F F F T T T — पहिलो T खोज्ने\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if ok(mid):\n            hi = mid          # T: mid उत्तर हुनसक्छ — राख\n        else:\n            lo = mid + 1      # F: mid फ्याँक\n    return lo\n\n# Classic lookup is just a special case:\n# ok(i) = nums[i] >= target, then check nums[lo] == target',
      narration: 'Template हेर्नुहोस् — जम्मा सात लाइन, तर यसले दर्जनौं प्रश्न खान्छ। ok भन्ने function लाई प्रश्न अनुसार फेर्ने मात्र हो। सामान्य खोजी पनि यसैको सानो रूप हो — ok of i भनेको nums of i greater than equal target, अनि अन्त्यमा भेटिएको ठाउँमा साँच्चै target छ कि छैन एक पटक जाँच्ने। एउटा जिज्ञासा मेट्ने कुरा — अरू भाषामा lo plus hi ले overflow गर्न सक्छ, त्यसैले mid equals lo plus hi minus lo divided by two लेखिन्छ — Python मा integer जति ठूलो पनि हुन्छ, चिन्ता छैन, तर interview मा यो बोलेर देखाउनु राम्रो।',
    },
    {
      heading: 'होसियार! Binary search on the answer',
      bullets: [
        'Koko Eating Bananas: search over <i>speeds</i> — “can she finish at speed s?” is monotonic.',
        'Split Array / Capacity to Ship Packages: search over the answer value, greedy-check feasibility.',
        'The array was never sorted — the <b>yes/no question</b> was.',
      ],
      narration: 'अब सबैभन्दा शक्तिशाली रूप — उत्तरमाथि नै binary search। Koko Eating Bananas भन्ने प्रश्नमा कुनै array sort गरिएको छैन — search गरिने चीज त speed हो। Speed s मा भ्याइन्छ? — बिस्तारो speed मा भ्याइँदैन, कुनै speed देखि माथि सबैमा भ्याइन्छ — फेरि उही F F T T! त्यसैले सम्भावित उत्तरहरूको दायरामा बीच हेर, आधा फ्याँक। ship को capacity, array split गर्दाको ठूलो टुक्रा घटाउने — minimize the maximum देख्नासाथ यही घण्टी बजोस्। जाँच्ने function प्रायः एउटा सोझो greedy loop हुन्छ। Sorted array देखेर मात्र binary search सम्झने बानीबाट माथि उठ्नुभयो भने यो pattern तपाईंको सबैभन्दा धारिलो हतियार बन्छ।',
    },
  ],
};
