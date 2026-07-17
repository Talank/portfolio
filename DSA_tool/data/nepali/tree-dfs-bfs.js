window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['tree-dfs-bfs'] = {
  id: 'tree-dfs-bfs',
  title: 'Tree DFS / BFS + Recursion Templates',
  titleNe: 'वंशावली घुम्ने दुई तरिका',
  intro: 'depth-first (recursion) vs level-by-level (queue) — and when each wins',
  slides: [
    {
      heading: 'When to reach for which',
      bullets: [
        '<b>DFS</b> (go deep): paths, depths, subtree properties, “does a path exist with sum X?”',
        '<b>BFS</b> (go wide): anything with <b>levels</b> — level-order, zigzag, right-side view, <i>shortest</i> path.',
        'The word “level” or “nearest/shortest” in the problem ⇒ BFS. Otherwise DFS is usually simpler.',
      ],
      narration: 'अब रूखहरूको संसारमा पस्यौं। रूख घुम्ने दुई तरिका छन्, र कथा वंशावलीकै राम्रो छ। कल्पना गर्नुहोस् — तपाईं आफ्नो कुलको वंशावली केलाउँदै हुनुहुन्छ। DFS भनेको — जेठो छोराको घर जाने, उसको जेठो छोराको घर, अनि उसको — पुस्ता-पुस्ता गहिराइसम्म ओर्लेर, त्यो हाँगो सकिएपछि मात्र फर्केर माइलो तिर लाग्ने। BFS भनेको — पहिला आफ्ना सबै छोराछोरी भेट्ने, अनि सबै नाति-नातिना, अनि सबै पनाति — पुस्तै-पिच्छे, तह-तह। कुन कहिले? प्रश्नमा level, तह, नजिकको, छोटो बाटो — यी शब्द आए BFS। बाटोको जोड, गहिराइ, subtree को गुण सोधिए DFS — र DFS प्रायः recursion ले लेख्दा तीन-चार लाइनमै सकिन्छ।',
    },
    {
      heading: 'कथा: Trust the recursion',
      bullets: [
        'The recursive leap of faith: “my helper <i>already works</i> for smaller trees.”',
        'Ask each child for its answer, combine, add yourself.',
        '<code>max_depth(node) = 1 + max(left_depth, right_depth)</code> — three lines, no simulation.',
      ],
      narration: 'Recursion मा धेरैलाई डर लाग्छ, किनकि दिमागले हरेक call भित्र पस्न खोज्छ र चक्कर लाग्छ। भरोसाको छलाङ सिक्नुहोस्। मालिकले नोकरलाई भन्छ — तिम्रो काम रूखको गहिराइ नाप्ने हो। नोकरको चाल — म आफैं नाप्दिनँ — देब्रे हाँगालाई नाप भन्छु, दाहिने हाँगालाई नाप भन्छु, दुईमध्ये ठूलोमा एक जोडेर मालिकलाई बुझाउँछु। तर देब्रे हाँगा कसले नाप्छ? — उसकै अर्को प्रति ले, उही चालले। तपाईंले विश्वास गर्ने एउटै कुरा — सानो रूखका लागि मेरो function ले सही काम गर्छ। Base case — रूख नै छैन भने गहिराइ शून्य। बस्। हरेक call trace गर्न नखोज्नुहोस् — छोराछोरीको उत्तर आइसक्यो भन्ने मानेर आफ्नो तह मात्र सोच्नुहोस्। यही एउटा बानीले रूखका आधा प्रश्न पग्लिन्छन्।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“DFS: गहिराइमा डुब (stack)। BFS: तह-तह तैरि (queue)।”',
      bullets: [
        'DFS = stack (or recursion, which <i>is</i> a stack).',
        'BFS = queue — मन्दिरको लाइन फेरि!',
        'Level trick: <code>for _ in range(len(queue))</code> drains exactly one level.',
      ],
      narration: 'सूत्र — DFS गहिराइमा डुब्छ, stack ले — BFS तह-तह तैरिन्छ, queue ले। डुब्ने र तैरिने — यही दुई शब्दले भाँडो पनि बताइदिन्छ। डुबेर फर्किन आउने बाटो सम्झनुपर्छ — त्यो stack हो, र recursion आफैंमा एउटा लुकेको stack हो। तैरिँदा पालो क्रमैले आउँछ — त्यो अघिल्लो module को मन्दिरको लाइन, queue। अनि BFS को एउटा सुनौलो जुक्ति घोक्नुहोस् — level छुट्याउने तरिका — loop सुरु हुँदा queue मा जति छन्, ठीक त्यति नै यो तहका हुन् — for underscore in range of len of queue ले ठ्याक्कै एक तह निकाल्छ, र भित्र थपिने जति अर्को तहका। यो तीन लाइनको ढाँचाले level-order, zigzag, right side view — सबै एकै साँचोबाट खुल्छन्।',
    },
    {
      heading: 'Python templates',
      code: '# DFS — three lines per idea\ndef max_depth(node):\n    if not node:\n        return 0\n    return 1 + max(max_depth(node.left), max_depth(node.right))\n\n# BFS — level by level\nfrom collections import deque\ndef level_order(root):\n    if not root:\n        return []\n    q, levels = deque([root]), []\n    while q:\n        level = []\n        for _ in range(len(q)):          # ठीक एक तह\n            node = q.popleft()\n            level.append(node.val)\n            if node.left: q.append(node.left)\n            if node.right: q.append(node.right)\n        levels.append(level)\n    return levels',
      narration: 'दुवै template हेर्नुहोस्। DFS — base case अनि एक लाइनको भरोसा — यही आकारमा path sum, same tree, invert tree, diameter — दर्जनौं प्रश्न लेखिन्छन्, फरक केवल के जोड्ने र के फर्काउने भन्नेमा हुन्छ। BFS — बाहिर while, भित्र त्यो जादुई for — level list बनाउँदै जाने। Zigzag चाहियो? — बिजोर तहलाई उल्टाइदिने मात्र। Right side view? — हरेक level को अन्तिम element टिप्ने मात्र। एउटा होसियारी — None छोराछोरीलाई queue मा नहाल्नुहोस्, हाल्ने बेलै जाँच्नुहोस् — नत्र popleft गर्दा crash। Time दुवैको O(n) — हरेक node एक पटक। Space — DFS मा रूखको उचाइ, BFS मा सबैभन्दा मोटो तह।',
    },
    {
      heading: 'होसियार! Traversal orders + pitfalls',
      bullets: [
        'Pre-order (node first), in-order (left-node-right), post-order (children first) — same DFS, different timing.',
        'Bottom-up answers (depth, diameter) are post-order; top-down (path so far) pass state as arguments.',
        'Diameter trap: the helper returns <b>height</b>, but the answer updates a separate best — two different quantities!',
        'Deep skewed trees can hit Python’s recursion limit — mention the iterative-stack rewrite.',
      ],
      narration: 'अन्तिम slide — तीन क्रम र दुई पासो। Pre-order, in-order, post-order — तीनै उही DFS हुन्, फरक यत्ति — आफ्नो काम कहिले गर्ने — छोराछोरीभन्दा पहिले, बीचमा, कि पछि। तलबाट माथि जम्मा हुँदै आउने उत्तर — गहिराइ, diameter — post-order हुन् — पहिला छोराछोरीको सुन, अनि आफ्नो भन। माथिबाट तल बग्ने कुरा — अहिलेसम्मको बाटो — argument मा बोकेर पठाइन्छ। Diameter को प्रख्यात पासो याद गर्नुहोस् — helper ले उचाइ फर्काउँछ, तर diameter चाहिँ छुट्टै best variable मा अद्यावधिक हुन्छ — दुई फरक कुरा एउटै function मा — यो छुट्याउन नजान्दा धेरै अन्तर्वार्ता चिप्लिएका छन्। र अन्तिम — हजारौं node को एकतर्फी लामो रूखमा Python को recursion limit ठोक्किन सक्छ — त्यस्तो अवस्थामा आफ्नै stack राखेर iterative लेखिन्छ भनेर एक वाक्य भनिदिनुहोस् — त्यति भने पुग्छ।',
    },
  ],
};
