window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['two-pointers'] = {
  id: 'two-pointers',
  title: 'Two Pointers',
  titleNe: 'दुई छेउबाट भेट्न आउने दुई साथी',
  intro: 'find a pair in a sorted array in O(n) by walking in from both ends',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Array is <b>sorted</b> (or you may sort it) and you need a <b>pair/triplet</b> matching a target.',
        'An O(1) extra-space constraint rules out the hash-map approach.',
        'Not sliding window: these pointers start at <i>opposite ends</i> and converge.',
      ],
      narration: 'ल, पहिलो pattern — Two Pointers। यो कहिले झिक्ने? जब array sorted छ, वा sort गर्न पाइन्छ, अनि कुनै जोडी खोज्नु छ जसको sum कुनै target सँग मिलोस्। एउटा कथाबाट सुरु गरौं। दुई गाउँका बीचमा बाटो खन्नु छ रे। एउटै टोलीले एक छेउबाट खन्दै जाँदा वर्षौं लाग्छ। तर दुई टोली, दुई छेउबाट, एकअर्कातिर खन्दै आए भने? बीचमा कतै भेट हुन्छ, र काम आधै समयमा सकिन्छ। Two pointers ठ्याक्कै यही हो — L देब्रे छेउबाट, R दाहिने छेउबाट, दुवै बीचतिर सर्दै आउँछन्। नोट गर्नुहोस् — sliding window मा चाहिँ दुवै pointer एकै दिशामा हिँड्छन्, यहाँ आमनेसामनेबाट आउँछन्। यो फरक interview मा सोधिन्छ।',
    },
    {
      heading: 'कथा: The sorted shelf',
      bullets: [
        'A sorted shelf of items, weakest → strongest.',
        'One hand on the weakest, one on the strongest; shout out the combined total.',
        'Too small? only the left hand moving right can help. Too big? only the right hand moving left can help.',
      ],
      narration: 'अब मुख्य कुरा — किन यो तरिका सही छ? कल्पना गर्नुहोस्, पसलको दराजमा तौल अनुसार मिलाएर राखिएका पोका छन्, सबैभन्दा हलुकादेखि सबैभन्दा गह्रुँगोसम्म। तपाईंलाई ठ्याक्कै पाँच किलो पुग्ने दुई पोका चाहियो। देब्रे हात सबैभन्दा हलुकामा, दाहिने हात सबैभन्दा गह्रुँगोमा राख्नुहोस्। जोड्दा कम भयो भने — दाहिने हातको पोका त पहिल्यै सबैभन्दा गह्रुँगो हो, उसले दिन सक्ने जति दिइसक्यो — त्यसैले आशा भनेको देब्रे हात दाहिनेतिर सार्नु मात्रै हो। जोड्दा बढी भयो भने उल्टो — देब्रे त पहिल्यै सबैभन्दा हलुका हो, त्यसैले दाहिने हात मात्र भित्र सर्नुपर्छ। हरेक कदममा एउटा हात किन सर्छ भन्ने प्रमाण छ — अनुमान होइन। त्यसैले कुनै जोडी दोहोऱ्याएर जाँच्नु पर्दैन, र O(n²) को काम O(n) मा सकिन्छ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“सानो भए Left सर्छ, ठूलो भए Right झर्छ।”',
      bullets: [
        'sum &lt; target → <code>L += 1</code> (need more)',
        'sum &gt; target → <code>R -= 1</code> (need less)',
        'sum == target → found; pointers cross → no answer exists',
      ],
      narration: 'सम्झने सूत्र यति हो — सानो भए Left सर्छ, ठूलो भए Right झर्छ। Sum सानो भयो भने ठूलो बनाउने एउटै उपाय — L लाई दाहिनेतिर सार्ने। Sum ठूलो भयो भने R लाई देब्रेतिर झार्ने। ठ्याक्कै मिल्यो भने उत्तर भेटियो। अनि दुई pointer एकअर्कालाई नाघे भने? भेटिएन — पूरै दराजमा त्यस्तो जोडी छैन भन्ने पक्का प्रमाणसहित। यो एक लाइनको सूत्र blank भएको बेला सम्झनुभयो भने पूरै algorithm फर्केर आउँछ।',
    },
    {
      heading: 'Python template',
      code: 'def two_sum_sorted(nums, target):\n    left, right = 0, len(nums) - 1\n    while left < right:\n        s = nums[left] + nums[right]\n        if s == target:\n            return [left, right]\n        if s < target:\n            left += 1      # सानो भए Left सर्छ\n        else:\n            right -= 1     # ठूलो भए Right झर्छ\n    return []',
      narration: 'Code हेर्नुहोस् — जम्मा दश लाइन। while loop चल्छ जबसम्म left, right भन्दा सानो छ। भित्र तीन वटा मात्र अवस्था — मिल्यो भने फर्काइदिने, सानो भए left बढाउने, ठूलो भए right घटाउने। यहाँ याद गर्नुपर्ने कुरा — हरेक iteration मा कुनै एउटा pointer पक्कै सर्छ, त्यसैले loop बढीमा n पटक मात्र चल्छ। Time complexity O(n), space O(1)। तर input sorted छैन र आफैं sort गर्नुपऱ्यो भने जम्मा खर्च O(n log n) हुन्छ — यो कुरा interview मा आफैं भन्नुभयो भने राम्रो छाप पर्छ।',
    },
    {
      heading: 'होसियार! Pitfalls + variants',
      bullets: [
        'Sorting destroys original indices — carry <code>(value, index)</code> pairs through the sort if indices are asked.',
        '3Sum = fix one index, two-pointer the rest — dedupe at <b>all three</b> positions.',
        'Container With Most Water: no target — always move the <b>shorter</b> wall.',
      ],
      narration: 'अन्त्यमा तीन वटा होसियारी। एक — sort गरेपछि पुरानो index हराउँछ। प्रश्नले original index मागेको छ भने value र index को जोडी बनाएर sort गर्नुहोस्, नत्र उत्तर नै गलत ठाउँ देखाउँछ — यो यस pattern को सबैभन्दा धेरै दोहोरिने गल्ती हो। दुई — 3Sum भन्ने प्रख्यात प्रश्न यही pattern को जेठो दाइ हो — एउटा number समातेर बाँकीमा two pointers चलाउने, तर दोहोरिएका triplet हटाउन तीनै ठाउँमा duplicate skip गर्नुपर्छ। तीन — Container With Most Water मा target नै छैन, त्यहाँ नियम फेरिन्छ — सधैं होचो पर्खाल भएको pointer सार्ने, किनकि पानीको सतह होचो पर्खालले नै तोक्छ। अग्लो सार्नु भनेको समय खेर फाल्नु मात्र हो।',
    },
  ],
};
