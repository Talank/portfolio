window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['fast-slow-pointers'] = {
  id: 'fast-slow-pointers',
  title: 'Fast & Slow Pointers',
  titleNe: 'खरायो र कछुवाको दौड',
  intro: 'detect cycles and find middles in linked structures with two speeds, O(1) space',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Linked list (or any “follow the next thing” chain) with <b>no random access</b>.',
        'Questions: is there a <b>cycle</b>? where is the <b>middle</b>? where does the cycle <b>start</b>?',
        'The killer constraint: O(1) extra space — no visited set allowed.',
      ],
      narration: 'अब मेरो सबैभन्दा मनपर्ने कथा भएको pattern — Fast and Slow Pointers। खरायो र कछुवाको दौड त सुन्नु भएकै छ। तर यहाँ twist छ — दौड सीधा बाटोमा होइन, गोलो track मा भयो भने के हुन्छ? खरायो अगाडि दौडँदै जान्छ, गोलो घुमेर फेरि कछुवाकै पछाडि आइपुग्छ, र एक दिन ठक्कर खान्छ! सीधा बाटो भए खरायोले अन्त्य भेट्छ र कहिल्यै भेट हुँदैन। यही एउटा observation बाट cycle छ कि छैन भन्ने प्रश्न हल हुन्छ — कुनै visited set नराखी, O(1) space मा। Linked list, वा जहाँ next पछ्याउँदै मात्र हिँड्न मिल्छ, त्यहाँ यो pattern झिक्ने।',
    },
    {
      heading: 'कथा: Floyd’s cycle detection',
      bullets: [
        '<code>slow</code> moves 1 step, <code>fast</code> moves 2 steps.',
        'Straight chain → <code>fast</code> hits <code>None</code>: no cycle.',
        'Loop → the gap shrinks by exactly 1 each step → they <b>must</b> meet.',
      ],
      narration: 'यसलाई Floyd को algorithm भनिन्छ। slow एक-एक पाइला, fast दुई-दुई पाइला। बाटो सीधा छ भने fast ले छेउ भेट्छ — None आयो, cycle छैन, सकियो। तर गोलो घेरा छ भने राम्ररी हेर्नुहोस् — घेराभित्र पसेपछि हरेक कदममा दुईको दूरी ठ्याक्कै एकले घट्छ। दूरी एक-एक गरेर घट्दै शून्य पुग्नै पर्छ — नाघेर जानै मिल्दैन। त्यसैले भेट पक्का हुन्छ, र भेट भयो भने cycle छ भन्ने प्रमाण भयो। यो कुनै जुक्ति मात्र होइन, गणितको प्रमाण हो — interview मा यो घट्दो-दूरीको तर्क बोलेर सुनाउनुभयो भने प्रश्न सोध्नेको अनुहार उज्यालो हुन्छ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“गोलो बाटोमा छिटो र ढिलो एक दिन पक्कै भेटिन्छन्।”',
      bullets: [
        'Meet ⇒ cycle exists.',
        'Middle of list: when <code>fast</code> reaches the end, <code>slow</code> is at the middle.',
        'Cycle start: after meeting, restart one pointer at head; both walk 1 step — they meet at the cycle’s entrance.',
      ],
      narration: 'सूत्र — गोलो बाटोमा छिटो र ढिलो एक दिन पक्कै भेटिन्छन्। यही जोडीले अरू दुई प्रश्न पनि सित्तैमा हल गरिदिन्छ। एक — list को बीच खोज्ने: fast अन्त्यमा पुग्दा slow ठीक बीचमा हुन्छ, किनकि उसले आधा दूरी मात्र हिँडेको छ। दुई — cycle कहाँबाट सुरु हुन्छ भन्ने अझ गहिरो प्रश्न: भेट भएपछि एउटा pointer लाई फेरि सुरुमा पठाउनुहोस्, अब दुवै एक-एक पाइला हिँड्छन्, र जहाँ फेरि भेट हुन्छ, त्यही नै घेराको मुख हो। यो गणितीय अचम्म हो — यसलाई derive गर्न गाह्रो छ तर याद राख्न सजिलो — भेटेपछि एउटालाई घर पठाऊ, दुवै बिस्तारै हिँड, ढोकैमा भेट।',
    },
    {
      heading: 'Python template',
      code: 'def has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next          # कछुवा: १ पाइला\n        fast = fast.next.next     # खरायो: २ पाइला\n        if slow is fast:\n            return True           # भेट भयो ⇒ cycle\n    return False                  # छेउ भेटियो ⇒ सीधा बाटो\n\ndef middle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    return slow                   # fast सकिँदा slow बीचमा',
      narration: 'Code मा दुई कुरामा ध्यान दिनुहोस्। पहिलो — while को शर्त: fast and fast dot next — दुवै जाँच्नुपर्छ, नत्र None मा next खोज्दा crash हुन्छ। यो नै यस pattern को नम्बर एक bug हो। दोस्रो — भेट जाँच्दा is प्रयोग गरिएको छ, double equals होइन — किनकि हामी एउटै node हो कि भनेर सोध्दैछौं, value बराबर छ कि भनेर होइन। value त फरक node मा पनि दोहोरिन सक्छ। Time O(n), space O(1) — यही O(1) space नै यो pattern को गहना हो।',
    },
    {
      heading: 'होसियार! Beyond linked lists',
      bullets: [
        'Happy Number: the “next node” is a <i>computation</i> (sum of squared digits) — cycle detection on numbers!',
        'Find the Duplicate Number: treat <code>i → nums[i]</code> as a linked list; the duplicate is the cycle entrance.',
        'If interviewer allows O(n) space, a visited set is simpler — say both options out loud.',
      ],
      narration: 'अन्तिम र सबैभन्दा चलाखीपूर्ण कुरा — यो pattern list मा मात्र सीमित छैन। जहाँ-जहाँ अर्को कदम भन्ने नियम छ, त्यहाँ-त्यहाँ यो चल्छ। Happy Number भन्ने प्रश्नमा अर्को node भनेको अङ्कहरूको वर्ग जोड्ने हिसाब हो — number बाट number मा उफ्रँदै जाँदा या त एकमा पुगिन्छ, या गोलो चक्करमा फसिन्छ — अनि cycle detection! Find the Duplicate मा झन् राम्रो जादु — index i बाट nums of i मा जाने बाटो बनाउँदा दोहोरिएको number नै cycle को मुख बनेर बस्छ। र एउटा व्यावहारिक सल्लाह — interviewer ले space को कुरा गरेकै छैन भने visited set पनि भन्दिनुहोस्, अनि O(1) space चाहिए Floyd भनेर थप्नुहोस् — दुवै जानेको देखाउनु नै बलियो जवाफ हो।',
    },
  ],
};
