window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['linked-list-reversal'] = {
  id: 'linked-list-reversal',
  title: 'Linked List In-Place Reversal',
  titleNe: 'तीन औंलाले साङ्लो उल्टाउने',
  intro: 'flip the arrows one node at a time with prev / curr / next — O(1) space',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Reverse a linked list — whole, a sub-range, or in groups of k.',
        'The constraint that matters: <b>in place</b>, O(1) extra space.',
        'Also hiding inside: palindrome check, reorder list, swap pairs.',
      ],
      narration: 'अब linked list उल्टाउने कला। प्रश्न सोझै आउन सक्छ — यो list उल्टाइदेऊ — वा लुकेर आउन सक्छ — list palindrome हो कि होइन जाँच, बीचदेखि उल्टाएर दाँज्नुपर्ने। शर्त सधैं उही हुन्छ — नयाँ list बनाउन पाइँदैन, भएकै साङ्लो in place उल्टाउनुपर्छ, O(1) space मा। कथा यस्तो सोच्नुहोस् — रेलका डिब्बाहरू एक-अर्कासँग कुण्डीले जोडिएका छन्, हरेक कुण्डीले अगाडिको डिब्बा देखाउँछ। उल्टाउनु भनेको डिब्बा सार्नु होइन — कुण्डी मात्र फर्काउनु हो — हरेक डिब्बाले अब अगाडिको होइन, पछाडिको देखाओस्। तर होसियार — कुण्डी फुकाल्ने क्रम बिग्रियो भने बाँकी रेल हात्तै छुट्छ।',
    },
    {
      heading: 'कथा: The three fingers',
      bullets: [
        'Three fingers on the chain: <code>prev</code> (behind), <code>curr</code> (here), <code>nxt</code> (ahead).',
        'Save <code>nxt</code> <b>first</b> — or the rest of the chain is lost forever.',
        'Flip <code>curr.next</code> to <code>prev</code>, then both fingers step forward.',
      ],
      narration: 'तरिका — तीन औंला। एउटा औंला पछाडिको डिब्बामा — prev। एउटा अहिलेकोमा — curr। अनि तेस्रो औंला — यो नै जीवनरक्षक हो — अगाडिकोमा — next। किन? किनभने जुन बेला तपाईं curr को कुण्डी फर्काउनुहुन्छ, त्यही कुण्डी नै अगाडिको बाँकी रेलसम्म पुग्ने एक मात्र डोरी थियो। पहिला तेस्रो औंलाले अगाडिको डिब्बा समात्नुहोस्, अनि मात्र कुण्डी फर्काउनुहोस्। त्यसपछि तीनै औंला एक-एक डिब्बा अगाडि सर्छन् — prev, curr मा; curr, next मा। यही चार-चालको नाच list नसकुन्जेल दोहोरिन्छ। सकिँदा prev नै नयाँ इन्जिन हो — त्यही फर्काउने।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“समात next, फर्काऊ तीर, सार दुई पाइला।”',
      bullets: [
        '1. <code>nxt = curr.next</code> (समात)',
        '2. <code>curr.next = prev</code> (फर्काऊ)',
        '3. <code>prev, curr = curr, nxt</code> (सार)',
        'Loop while <code>curr</code>; answer is <code>prev</code>.',
      ],
      narration: 'सूत्र — समात next, फर्काऊ तीर, सार दुई पाइला। तीन काम, यही क्रममा। समात्नु पहिला — नत्र रेल छुट्छ। फर्काउनु दोस्रो। सार्नु तेस्रो। Whiteboard मा अड्किनुभयो भने हातैले नाच्नुहोस् — बायाँ हात prev, दायाँ हात curr, आँखा next मा। र अन्तिम प्रश्न सधैं आउँछ — के फर्काउने? curr त None भएर सकियो — उत्तर prev हो, ऊ नै अन्तिम डिब्बामा उभिएको छ। यो pattern पूरै muscle memory बनाउने चीज हो — आज नै Python file खोलेर नहेरी तीन पटक लेख्नुहोस्, त्यसपछि जीवनभर आउँछ।',
    },
    {
      heading: 'Python template',
      code: 'def reverse_list(head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next          # समात next\n        curr.next = prev         # फर्काऊ तीर\n        prev, curr = curr, nxt   # सार दुई पाइला\n    return prev                  # नयाँ head\n\n# Recursive flavour (know it, but iterative is safer in interviews):\ndef reverse_rec(head):\n    if not head or not head.next:\n        return head\n    new_head = reverse_rec(head.next)\n    head.next.next = head\n    head.next = None\n    return new_head',
      narration: 'Iterative रूप — पाँच लाइन, O(n) time, O(1) space — यही नै interview को मुख्य हतियार हो। Recursive रूप पनि चिनेर राख्नुहोस् — राम्रो देखिन्छ, तर हरेक call ले stack मा ठाउँ लिन्छ, त्यसैले space O(n) भइहाल्छ — O(1) space भन्ने शर्तै हो भने recursive ले शर्त नै तोड्छ। यो कुरा आफैं भन्न सक्नुभयो भने प्रश्न सोध्नेले तपाईंलाई एक तह माथि राख्छ। अनि Python को जोडी-assignment — prev comma curr equals curr comma nxt — एकै लाइनमा दुवै सार्ने सफा तरिका हो, बीचको temporary variable चाहिँदैन।',
    },
    {
      heading: 'होसियार! The harder variants',
      bullets: [
        '<b>Reverse between positions m and n</b>: walk to m−1, reverse the window, stitch both ends back.',
        '<b>Reverse in k-groups</b>: count k nodes first; fewer than k left → leave them (usually).',
        '<b>Dummy node</b> trick: a fake head makes “reversal starts at position 1” a non-special case.',
        'Palindrome list: fast/slow to middle + reverse second half — two patterns shake hands.',
      ],
      narration: 'कठिन रूपहरू। बीचको m देखि n सम्म मात्र उल्टाउने प्रश्नमा उल्टाउने काम त उही हो — गाह्रो भनेको दुई छेउ फेरि जोड्ने सिलाइ हो — उल्टिएको टुक्राको अगाडि र पछाडि कसले कसलाई समात्ने, कागजमा चित्र नकोरी नलेख्नुहोस्। K-group reversal ले पहिला गनेर k जना पुग्छन् कि हेर्छ — नपुगे प्रायः जस्ताको तस्तै छोड्ने हुन्छ। अनि dummy node भन्ने सानो जुक्ति — नक्कली टाउको एउटा अगाडि झुण्ड्याइदिने — जसले position one बाटै उल्टाउनुपर्ने जस्ता edge case लाई सामान्य case बनाइदिन्छ। head फेरिने जुनसुकै list प्रश्नमा dummy झिक्ने बानी बसाल्नुहोस्। र सबैभन्दा सुन्दर जोडी — palindrome जाँच्न खरायो-कछुवाले बीच भेट्टाउने, अनि दोस्रो आधा उल्टाएर दाँज्ने — दुई pattern ले हात मिलाएको ठाउँ।',
    },
  ],
};
