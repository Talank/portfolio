window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['hashing-patterns'] = {
  id: 'hashing-patterns',
  title: 'Hashing Patterns',
  titleNe: 'साँचो झुण्ड्याउने किला — नाम भन, ठाउँ पा',
  intro: 'trade O(n) space for O(1) lookups: complements, groups, seen-sets',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“Have I <b>seen</b> this before?” — duplicates, pairs, matching.',
        '“<b>Group</b> these by something” — anagrams, frequencies.',
        'Any O(n²) “for each element, scan for its partner” loop → hash map kills the inner scan.',
      ],
      narration: 'अब hashing — यो pattern भन्दा पनि महाशक्ति हो, किनकि आधा जसो प्रश्नमा यो कतै न कतै मिसिन्छ। कथा — पुरानो होटेलको counter मा साँचो झुण्ड्याउने किलाहरूको board हुन्छ, हरेक कोठाको आफ्नै किला। कोठा नम्बर भन्नुभयो, हात सीधै त्यही किलामा जान्छ — खोज्नै पर्दैन। यही हो hash map — नाम भन, ठाउँ पा, O(1) मा। कहिले चाहिन्छ? जब मनमा यो प्रश्न आउँछ — यो चीज मैले पहिले देखेको छु कि छैन? वा — यीनीहरूलाई कुनै गुण अनुसार समूहमा बाँड्नु छ। अनि जब तपाईंको code मा भित्री loop ले साथी खोज्दै फेरि पूरै array घुमिरहेको छ — त्यो भित्री loop लाई hash map ले एकै झट्कामा मेटिदिन्छ।',
    },
    {
      heading: 'कथा: Two Sum — ask the right question',
      bullets: [
        'Wrong question: “which pairs sum to target?” → all pairs, O(n²).',
        'Right question, per element: “<b>what do I need?</b> Is <code>target − x</code> already on the board?”',
        'One pass: check for the complement, then hang yourself on the board.',
      ],
      narration: 'Two Sum — संसारको सबैभन्दा प्रसिद्ध interview प्रश्न — hashing कै कथा हो। भोजमा हरेक मान्छेले आफ्नो जोडी खोज्दै पूरै हल चहार्ने हो भने O(n²) भयो। बाटो अर्कै छ — ढोकैमा एउटा board राखौं। हरेक पाहुना भित्र पस्दा पहिला सोध्छ — मलाई के चाहिन्छ? Target minus मेरो value। त्यो board मा झुण्डिएको छ? छ भने जोडी भेटियो, सकियो। छैन भने आफ्नो नाम board मा झुण्ड्याएर भित्र जान्छ। हरेक पाहुनाको काम O(1), जम्मा O(n)। सोच्ने तरिकाको फरक याद गर्नुहोस् — मसँग के छ भनेर होइन, मलाई के चाहिन्छ भनेर सोध्ने। यो complement को सोचाइ नै hashing pattern को मुटु हो।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“खोज्नुअघि सोध — मलाई के चाहिन्छ? अनि board मा झुण्ड्याऊ।”',
      bullets: [
        'Complement first, insert after — one pass, and no self-pairing bug.',
        'Group anagrams: the key is the <b>signature</b> — <code>"".join(sorted(word))</code>.',
        'Seen-set for duplicates; Counter for frequencies.',
      ],
      narration: 'सूत्र — खोज्नुअघि सोध, मलाई के चाहिन्छ, अनि मात्र आफूलाई board मा झुण्ड्याऊ। क्रम महत्वपूर्ण छ — पहिला जाँच, अनि थप — नत्र आफैंसँग आफ्नै जोडी बन्ने bug आउँछ, जस्तै target दश छ र value पाँच छ भने। समूह बनाउने प्रश्नमा चाहिँ अर्को सोच चाहिन्छ — signature। Anagram हरू — जस्तै listen र silent — फरक देखिन्छन् तर अक्षर sort गर्दा दुवै एउटै बन्छन्। त्यही sorted रूपलाई चाबी बनाएर एउटै किलामा झुण्ड्याइदिने। Signature भनेको नागरिकताको नम्बर जस्तै हो — रूप जति फेरिए पनि नम्बर एउटै।',
    },
    {
      heading: 'Python toolkit',
      code: 'def two_sum(nums, target):\n    seen = {}                        # value -> index\n    for i, x in enumerate(nums):\n        if target - x in seen:       # पहिला सोध: के चाहिन्छ?\n            return [seen[target - x], i]\n        seen[x] = i                  # अनि झुण्ड्याऊ\n    return []\n\nfrom collections import Counter, defaultdict\nCounter("dashain")                   # frequencies in one call\ngroups = defaultdict(list)\ngroups["".join(sorted(w))].append(w) # group anagrams by signature',
      narration: 'Python ले hashing लाई असाध्यै सजिलो बनाइदिन्छ। Two Sum माथि छ — सात लाइन। तल दुई साथी चिन्नुहोस्। Counter ले कुनै पनि list वा string को गन्ती एकै call मा गरिदिन्छ — अनि दुई Counter बराबर छन् कि भनेर सीधै दाँज्न पनि मिल्छ, anagram जाँच्ने सबैभन्दा छोटो बाटो यही हो। defaultdict of list ले चाबी नभएका बेला आफैं खाली list बनाइदिन्छ — if key not in dict भन्ने तीन लाइनको ceremony चाहिँदैन। यी दुई import interview मा खुलेआम प्रयोग गर्नुहोस् — यो cheating होइन, idiomatic Python हो, र प्रश्न सोध्नेहरू खुसी नै हुन्छन्।',
    },
    {
      heading: 'होसियार! Pitfalls',
      bullets: [
        'Keys must be immutable: <code>tuple(sorted(w))</code> ok, a list is not.',
        'Two Sum with duplicates: insert <i>after</i> checking handles <code>[5, 5], target 10</code> correctly.',
        'Hashing costs O(n) space — say the trade-off out loud.',
        'Subarray-sum questions are <i>not</i> plain hashing — that is prefix-sum + hashing, next module!',
      ],
      narration: 'होसियारीका चार बुँदा। एक — dict को चाबी अपरिवर्तनीय हुनुपर्छ — list चाबी बन्दैन, tuple बन्छ, त्यसैले कहिलेकाहीं tuple of sorted लेखिन्छ। दुई — duplicate values आउँदा डराउनु पर्दैन — पहिला जाँच्ने अनि थप्ने क्रमले पाँच-पाँच जोडी target दश जस्ता case आफैं मिलाउँछ, किनकि पहिलो पाँच board मा झुण्डिसकेको हुन्छ। तीन — hashing ले समय किन्छ तर space तिर्छ — O(n) memory। यो trade-off आफैं बोल्नुहोस् — समय र space साट्दैछु भनेर भन्ने candidate नै परिपक्व देखिन्छ। चार — subarray को sum सम्बन्धी प्रश्न देख्दा सीधै hashing नझिक्नुहोस् — त्यो prefix sum र hashing को जोडीले हल हुन्छ, जुन अर्को module मा आउँदैछ। जोडी मिलाएर मात्र त्यो ताला खुल्छ।',
    },
  ],
};
