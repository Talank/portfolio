window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['bit-manipulation'] = {
  id: 'bit-manipulation',
  title: 'Bit Manipulation',
  titleNe: 'बत्ती बलेको-निभेको स्विचको खेल',
  intro: 'AND, OR, XOR, and shifts — O(1) tricks that replace loops once you see the binary pattern',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Anything about parity, uniqueness, or “without extra space”: single number, missing number, power of two.',
        'Bitmask as a compact set: use an int’s bits to represent “which of N items are included” — great with backtracking/DP.',
        '<code>&</code> (AND), <code>|</code> (OR), <code>^</code> (XOR), <code>~</code> (NOT), <code>&lt;&lt;</code>/<code>&gt;&gt;</code> (shift) — five tools, endless tricks.',
      ],
      narration: 'अब Bit Manipulation — संख्यालाई दशमलव होइन, बत्तीको लहरको रूपमा हेर्ने कला। कल्पना गर्नुहोस् — कोठाको भित्तामा बत्ती बाल्ने धेरै स्विच लहरै छन्, हरेक स्विच या बलेको (एक) या निभेको (शून्य)। हरेक संख्या यस्तै एउटा स्विच-लहर हो। यो module तब काम आउँछ जब प्रश्नमा “extra space बिना”, “जोर-बिजोर”, वा “एउटा अनौठो संख्या भेट्नु छ” जस्ता संकेत देखिन्छ — single number, missing number, power of two। र एउटा शक्तिशाली प्रयोग — bitmask — एउटै integer भित्र N वटा वस्तुमध्ये कुन-कुन समावेश छन् भनेर सम्झिने, अघिल्लो module हरूको backtracking र DP सँग मिलाएर state छोटो राख्न। पाँचवटा मात्र औजार छन् — AND, OR, XOR, NOT, अनि shift — तर यिनैबाट अनगिन्ती जुक्ति बन्छन्।',
    },
    {
      heading: 'कथा: XOR, the self-cancelling switch',
      bullets: [
        'XOR = “different?” — same bits cancel to 0, different bits give 1.',
        '<code>x ^ x = 0</code> and <code>x ^ 0 = x</code> — pair up and everything unpaired survives.',
        'Single Number: XOR the whole array — every paired value cancels, the lone survivor is the answer.',
      ],
      narration: 'XOR सबैभन्दा जादुई स्विच हो — यसको एउटै प्रश्न छ — दुई बत्ती फरक छन्? फरक भए बल्छ (एक), उस्तै भए निभ्छ (शून्य)। यसको दुई नतिजा मुख गर्नुहोस् — कुनै संख्यालाई आफैंसँग XOR गर्दा शून्य आउँछ — किनकि उस्तै-उस्तैलाई भेट्दा दुवै निभ्छन्। र कुनै संख्यालाई शून्यसँग XOR गर्दा त्यो संख्या जस्ताको तस्तै फर्कन्छ — शून्यसँग तुलना गर्दा केही परिवर्तन हुँदैन। यसको प्रख्यात प्रयोग — Single Number — array मा हरेक संख्या दुई-दुई पटक छ, एउटा मात्र एक पटक — कथा यस्तो सोच्नुहोस्, नृत्यशालामा जोडी-जोडी नाच्दै छन्, हरेक जोडी नाचेर हराउँछ (XOR ले रद्द गर्छ), अन्त्यमा एक्लै उभिने जो जोडी नपाएको हो — त्यही नै उत्तर। पूरै array लाई क्रमैसँग XOR गर्दा जोडी भएका सबै रद्द भएर, एक्लो बाँकी रहन्छ — O(n) time, O(1) space, extra array नै चाहिँदैन।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“XOR = फरक छौं? AND = दुवै बलेको छ? OR = कोहीचाहिँ बलेको छ?”',
      bullets: [
        '<code>n & (n-1)</code> clears the lowest set bit — count-set-bits and power-of-two both lean on this.',
        '<code>n & -n</code> isolates the lowest set bit — used in Fenwick trees and bitmask DP.',
        '<code>x &lt;&lt; k</code> = multiply by 2ᵏ, <code>x &gt;&gt; k</code> = divide by 2ᵏ (careful with negatives).',
      ],
      narration: 'सूत्र — XOR ले सोध्छ फरक छौं?, AND ले सोध्छ दुवै बलेको छ?, OR ले सोध्छ कोहीचाहिँ बलेको छ? अब दुई झट्किला जुक्ति सम्झनुहोस्। n AND (n minus one) — यसले n को सबैभन्दा तल्लो बलेको बत्ती निभाइदिन्छ, अरू जस्ताको तस्तै — किनकि n बाट एक घटाउँदा त्यो तल्लो एक बत्ती निभेर त्यसमुनिका सबै बत्ती बल्छन्, र AND ले ती दुवैलाई भेट्दा तल्लो मात्र हराउँछ। यो जुक्तिले “कति बत्ती बलेका छन् गन्ने” र “यो संख्या दुईको घात हो कि होइन” दुवै प्रश्न हल गर्छ — घात-दुई भएको संख्यामा त बत्ती एउटै मात्र बलेको हुन्छ, त्यसैले n AND (n-1) शून्य आयो भने power of two। n AND (सोझै -n) ले चाहिँ सबैभन्दा तल्लो बलेको बत्ती मात्र टिपेर बाँकी सबै निभाइदिन्छ — Fenwick tree जस्ता उन्नत संरचनामा प्रयोग हुन्छ। र shift त गुणन-भाग नै हो — देब्रे shift ले दुईले गुणन, दाहिने shift ले दुईले भाग, तर ऋणात्मक संख्यामा होसियार चाहिन्छ।',
    },
    {
      heading: 'Python template',
      code: 'def single_number(nums):\n    result = 0\n    for x in nums:\n        result ^= x          # जोडी रद्द, एक्लो बाँकी\n    return result\n\ndef count_set_bits(n):\n    count = 0\n    while n:\n        n &= (n - 1)          # तल्लो बलेको बत्ती निभाउने — यति पटक चल्यो, त्यति नै बत्ती थिए\n        count += 1\n    return count\n\ndef is_power_of_two(n):\n    return n > 0 and (n & (n - 1)) == 0\n\n# Bitmask as a set — subsets of {0..n-1}\ndef all_subsets_via_mask(items):\n    n = len(items)\n    res = []\n    for mask in range(1 << n):              # शून्यदेखि सबै-बलेकोसम्म\n        subset = [items[i] for i in range(n) if mask & (1 << i)]\n        res.append(subset)\n    return res',
      narration: 'चार function हेरौं। single_number मा एकै लाइनको loop — result ^= x — पूरै array दोहोऱ्याउँदा एक्लो बाँकी रहन्छ। count_set_bits मा n AND (n-1) लाई while loop मा दोहोऱ्याइन्छ — हरेक पटक एउटा बत्ती निभ्छ, त्यसैले loop जति पटक चल्यो त्यति नै बत्ती सुरुमा बलेका थिए। is_power_of_two त्यही चाललाई एक लाइनमा झिकेको हो। अनि अन्तिम — bitmask ले backtracking बिनै सबै subset निकाल्ने अर्को तरिका देखाउँछ — शून्यदेखि दुईको n घातसम्म हरेक mask हेर्ने, र mask को हरेक बलेको बत्तीले “यो item समावेश छ” भन्छ — one shift i ले i औं बत्ती छनोट गरेर जाँच्ने। यो सोझो for-loop ले नै अघिल्लो module को recursive backtracking जत्तिकै काम गर्छ, फरक शैलीमा।',
    },
    {
      heading: 'होसियार! Pitfalls and where it shows up',
      bullets: [
        'Python ints are arbitrary precision — no fixed 32-bit overflow, but LeetCode problems often assume 32-bit; mask with <code>& 0xFFFFFFFF</code> when needed.',
        'Negative numbers use two’s complement — right-shift behaves differently than in C/Java; be careful porting tricks.',
        'Bitmask DP: state = <code>(index, mask)</code> — classic for Traveling Salesman / “assign N tasks to N workers” at small N (≤ ~20).',
        'When bits feel unreadable, write out a small example in binary on paper — the pattern jumps out visually.',
      ],
      narration: 'अन्तिम होसियारी। Python को integer असीमित ठूलो हुन सक्छ — C वा Java जस्तो ३२-बिट पुगेपछि पल्टिने (overflow) समस्या Python मा हुँदैन — तर LeetCode का धेरै प्रश्नले ३२-बिट भएको मानेर उत्तर अपेक्षा गर्छन्, त्यसैले चाहिँदा AND 0xFFFFFFFF ले छाँट्नुपर्ने हुन्छ। ऋणात्मक संख्या भित्र two’s complement भन्ने विशेष तरिकाले भण्डारण हुन्छ — दाहिने shift को व्यवहार C वा Java भन्दा फरक हुन सक्छ, अर्को भाषाबाट जुक्ति सार्दा होसियार गर्नुहोस्। Bitmask DP भन्ने शक्तिशाली संयोजन पनि चिनेर राख्नुहोस् — state मा index र mask दुवै राखिन्छ — Traveling Salesman वा N कामदारलाई N काम बाँड्ने जस्ता प्रश्नमा, जहाँ N सानो (लगभग बीस भन्दा कम) हुन्छ। र अन्तिम व्यावहारिक सल्लाह — बत्तीको खेल दिमागमा नअलमलिँदा कागजमा सानो उदाहरण binary मा लेखेर हेर्नुहोस् — ढाँचा आँखैले देखिन्छ, सोचेर थाक्नु पर्दैन।',
    },
  ],
};
