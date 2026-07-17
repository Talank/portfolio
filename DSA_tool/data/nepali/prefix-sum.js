window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['prefix-sum'] = {
  id: 'prefix-sum',
  title: 'Prefix Sum',
  titleNe: 'सडक किनारका किलोमिटर-ढुङ्गा',
  intro: 'precompute running totals so any range sum becomes one subtraction',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Many <b>range-sum</b> queries on the same array: “sum from i to j?”',
        '“How many <b>subarrays</b> sum to K?” — even with negative numbers.',
        'Sliding window fails on negatives — prefix sum is the tool that steps in.',
      ],
      narration: 'अब Prefix Sum — सरल तर गहिरो। कथा — पृथ्वी राजमार्गमा किलोमिटर-ढुङ्गा हुन्छन्, काठमाडौंबाट कति टाढा भनेर लेखिएको। नौबिसे छब्बीस किलोमिटरमा छ, मुग्लिन एक सय दशमा। नौबिसेदेखि मुग्लिनसम्म कति? एक सय दश minus छब्बीस — एउटै घटाउ! बाटो नापेर हिँड्नु परेन, किनकि हरेक ढुङ्गामा सुरुदेखिको जम्मा पहिल्यै लेखिएको छ। Prefix sum ठ्याक्कै यही हो — array को हरेक ठाउँसम्मको running total एक पटक बनाएर राख्ने, अनि जुनसुकै टुक्राको sum दुई ढुङ्गाको घटाउबाट O(1) मा निकाल्ने। धेरै पटक range sum सोधिने प्रश्न, अनि subarray sum equals K जस्ता प्रश्नमा यही झिक्ने।',
    },
    {
      heading: 'कथा: The subtraction trick',
      bullets: [
        '<code>P[i]</code> = sum of the first i elements; <code>P[0] = 0</code>.',
        'sum(i..j) = <code>P[j+1] − P[i]</code> — build O(n) once, answer O(1) forever.',
        'The empty prefix <code>P[0]=0</code> is what lets ranges starting at index 0 work.',
      ],
      narration: 'बनाउने तरिका — P of zero बराबर शून्यबाट सुरु गर्ने, अनि हरेक कदममा अघिल्लो जम्मामा नयाँ element थप्दै जाने। i देखि j सम्मको sum भनेको P of j plus one minus P of i। यहाँ एउटा मसिनो तर अति महत्वपूर्ण कुरा — त्यो सुरुको शून्य। काठमाडौंमै पनि शून्य किलोमिटरको ढुङ्गा गाडिएको हुन्छ नि — त्यो नभए काठमाडौंदेखि नौबिसेसम्मको दूरी घटाउबाट निकाल्नै मिल्दैन। त्यसैगरी P of zero equals zero नराखे index शून्यबाट सुरु हुने टुक्राहरूको हिसाब बिग्रिन्छ। यो खाली prefix नै यस pattern को सबैभन्दा बिर्सिने detail हो।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“जम्मा राख, घटाएर निकाल — र शून्यको ढुङ्गा नबिर्सी गाड।”',
      bullets: [
        'Range sum = difference of two milestones.',
        'Subarray sum == K ⇒ “have I seen milestone <code>P − K</code> before?” → hash map!',
        'Prefix idea generalizes: products, XOR, 2-D grids, counts of odd/even.',
      ],
      narration: 'सूत्र — जम्मा राख, घटाएर निकाल, र शून्यको ढुङ्गा नबिर्सी गाड। अब जादुको दोस्रो तह हेर्नुहोस् — subarray sum equals K कसरी निस्कन्छ? कुनै टुक्राको sum K हुनु भनेको दुई ढुङ्गाको फरक K हुनु हो। त्यसैले array मा हिँड्दै गर्दा हरेक नयाँ ढुङ्गा P मा पुगेर सोध्ने — P minus K को ढुङ्गा मैले पहिले देखेको छु? यो त अघिल्लो module को Two Sum कै प्रश्न भयो — मलाई के चाहिन्छ भनेर hash map मा सोध्ने! Prefix sum र hashing मिलेर negative number भएका array मा पनि काम गर्छ, जहाँ sliding window पूरै फेल हुन्छ। दुई pattern जोडिएर नयाँ शक्ति बन्ने यो पहिलो ठाउँ हो — याद गरिराख्नुहोस्।',
    },
    {
      heading: 'Python template',
      code: 'from itertools import accumulate\n\ndef range_sums(nums, queries):\n    P = [0, *accumulate(nums)]           # शून्यको ढुङ्गा + running totals\n    return [P[j + 1] - P[i] for i, j in queries]\n\ndef subarray_sum_equals_k(nums, k):\n    seen = {0: 1}                        # खाली prefix एक पटक देखियो\n    P = ans = 0\n    for x in nums:\n        P += x\n        ans += seen.get(P - k, 0)        # P−k का ढुङ्गा कति देखिए?\n        seen[P] = seen.get(P, 0) + 1\n    return ans',
      narration: 'माथिको function — accumulate ले running total एक लाइनमा बनाइदिन्छ, अगाडि शून्य थपेर ढुङ्गाको लहर तयार। तलको function चाहिँ प्रख्यात Subarray Sum Equals K हो — गन्नुपर्ने भएकाले hash map मा हरेक prefix कति पटक देखियो भनेर राखिन्छ। ध्यान दिनुहोस् — seen मा शून्य ढुङ्गा पहिल्यै एक पटक हालेर सुरु गरिएको छ — त्यो नहाले array कै सुरुदेखि K पुग्ने टुक्राहरू गनिनै छुट्छन्। अनि क्रम पनि उही — पहिला सोध्ने, अनि आफ्नो ढुङ्गा थप्ने — नत्र K शून्य भएको बेला आफैंलाई गनेर उत्तर बढी आउँछ। Time O(n), space O(n)।',
    },
    {
      heading: 'होसियार! Where it generalizes',
      bullets: [
        'Product of Array Except Self = prefix product × suffix product (no division).',
        '2-D grids: <code>P[r][c]</code> rectangle sums via inclusion–exclusion.',
        'Odd-count / parity questions: same trick with counts instead of sums.',
        'Don’t rebuild P per query — build once, that is the whole point!',
      ],
      narration: 'अन्त्यमा, यो सोच कहाँ-कहाँ फैलिन्छ हेरौं। Product of Array Except Self मा जोड होइन गुणन हो — देब्रेबाटको prefix product र दाहिनेबाटको suffix product जुधाएर division नै नगरी हल हुन्छ — division नगर्नु भन्ने शर्त नै प्रश्नको मुख्य twist हो। दुई-आयामिक grid मा पनि उही — कुनम्म-कुनासम्मको जम्मा राखेर जुनसुकै आयतको sum चार ढुङ्गाको जोड-घटाउबाट निस्कन्छ। जोड मात्र होइन — XOR, गन्ती, जोर-बिजोर — जुनसुकै जम्मा हुँदै जाने चीजमा यही चाल चल्छ। र एउटा अन्तिम चेतावनी — हरेक query मा P फेरि बनाउनु भयो भने पूरै फाइदा खेर गयो — ढुङ्गा एक पटक गाड्ने हो, बाटो बनेपछि जति पटक सोधे पनि सित्तैंमा।',
    },
  ],
};
