window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['binary-search-trees'] = {
  id: 'binary-search-trees',
  title: 'Binary Search Trees',
  titleNe: 'देब्रे सानो, दाहिने ठूलो',
  intro: 'the one invariant — left < node < right — that makes search, insert, and in-order all fall out for free',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'One rule holds at <b>every single node</b>: everything in the left subtree is smaller, everything in the right is bigger.',
        'Search / insert / delete in O(height) — O(log n) if balanced, O(n) if it degenerates into a line.',
        'Validate BST, kth smallest, closest value, range sum — all lean on the same invariant.',
      ],
      narration: 'अब Binary Search Tree — छोटकरीमा BST। यसमा एउटै नियम छ, तर त्यो नियम हरेक नोडमा, जताततै लागू हुन्छ — देब्रेपट्टि जति छन् सबै साना, दाहिनेपट्टि जति छन् सबै ठूला। कल्पना गर्नुहोस् — गाउँको एउटा अनौठो घर-नम्बरिङ प्रणाली — हरेक घरको आँगनको देब्रेतिर सानो नम्बरका घर मात्र बस्छन्, दाहिनेतिर ठूलो नम्बरका मात्र — र यो नियम गाउँको हरेक घरमा, हरेक तहमा दोहोरिन्छ। यसैले कुनै नम्बर खोज्दा हरेक घरमा एउटै प्रश्न सोध्नुपर्छ — म खोजेको नम्बर यो भन्दा सानो कि ठूलो? सानो भए देब्रे जाऊ, ठूलो भए दाहिने — बाँकी आधा गाउँ एकै झट्कामा हट्छ। रूख सन्तुलित भए height log n हुन्छ, तर बिग्रेर एउटै लहरमा बस्यो भने n नै लाग्छ — यो कुरा सधैं याद राख्नुहोस्।',
    },
    {
      heading: 'कथा: In-order is the sorted line',
      bullets: [
        'In-order traversal (left → node → right) of a BST visits nodes in <b>sorted order</b> — always, no exception.',
        'This one fact answers “kth smallest”, “validate BST”, and “convert to sorted array” all at once.',
        'Validating a BST by only checking parent-vs-child is a classic trap — you need the full ancestor range.',
      ],
      narration: 'एउटा जादुई तथ्य सम्झनुहोस् — यो गाउँमा घर-घर हिँड्दा, देब्रे-आफू-दाहिने क्रमले हिँड्ने हो भने, तपाईं ठ्याक्कै सानोदेखि ठूलो क्रममा हिँड्दै जानुहुन्छ — जहिल्यै, अपवाद बिनै। यही एउटा तथ्यले तीन प्रश्नको ढोका खोलिदिन्छ — kth smallest खोज्नु छ? in-order हिँडेर k औं मान्छे टिप। BST लाई sorted array मा बदल्नु छ? in-order हिँड्दा नै क्रम बनिहाल्छ। र validate गर्ने प्रश्नमा एउटा प्रख्यात पासो छ — धेरैले सोच्छन् बुबा र छोरा मात्र दाँज्दा पुग्छ, तर होइन — कुनै नाति आफ्नो हजुरबुबाभन्दा ठूलो भइदियो भने पनि नियम भत्किन्छ, जबकि आफ्नो सिधा बुबासँग त ठीकै देखिन्छ। त्यसैले जाँच गर्दा हरेक नोडलाई पुर्खा-पुर्खाले तोकेको सिमाना — न्यूनतम र अधिकतम दुवै — बोकेर लैजानुपर्छ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“देब्रे सानो, दाहिने ठूलो — in-order हिँड्दा क्रमैसँग भेटौंला।”',
      bullets: [
        'Search/insert: at each node, compare and step left or right — never both.',
        'Delete has three cases: leaf (just remove), one child (splice), two children (swap with in-order successor).',
        'In-order successor of a node = leftmost node of its right subtree.',
      ],
      narration: 'सूत्र — देब्रे सानो, दाहिने ठूलो, in-order हिँड्दा क्रमैसँग भेटौंला। Search वा insert मा हरेक नोडमा एउटै छनोट — देब्रे कि दाहिने, दुवैतिर कहिल्यै जानु पर्दैन, त्यसैले height जति चरण। Delete चाहिँ अलि रमाइलो छ — तीन अवस्था। पात जस्तो नोड — कुनै सन्तान छैन — सिधै हटाइदिने। एउटा मात्र छोरा भएको नोड — त्यो छोरालाई सिधै बुबाको ठाउँमा टाँस्ने। दुई छोरा भएको नोड — यहाँ जुक्ति चाहिन्छ — त्यो नोडको ठाउँमा त्यसको in-order successor राख्ने, अर्थात् दाहिने सन्तानको सबैभन्दा देब्रेतिरको नोड — किनकि त्यही नै रूखको क्रममा त्यो नोडपछि तुरुन्तै आउने सानोभन्दा सानो-मध्ये-ठूलो मान्छे हो।',
    },
    {
      heading: 'Python template',
      code: 'class Node:\n    def __init__(self, val):\n        self.val, self.left, self.right = val, None, None\n\ndef search(root, target):\n    node = root\n    while node:\n        if node.val == target:\n            return node\n        node = node.left if target < node.val else node.right\n    return None\n\ndef insert(root, val):\n    if not root:\n        return Node(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root\n\ndef is_valid_bst(node, lo=float("-inf"), hi=float("inf")):\n    if not node:\n        return True\n    if not (lo < node.val < hi):\n        return False\n    return is_valid_bst(node.left, lo, node.val) and is_valid_bst(node.right, node.val, hi)',
    narration: 'Search सजिलो — while loop ले जहिल्यै एकतिर मात्र सर्छ। Insert recursive रूपमा लेख्दा सफा हुन्छ — सानो भए देब्रेतिर पठाऊ, अनि त्यहाँबाट आएको जवाफ नै आफ्नो नयाँ देब्रे बनाऊ — यसले None ठाउँमा नयाँ Node सिर्जना गरिदिन्छ। is_valid_bst मा अघिल्लो slide को ट्रिक कोड भएर देखियो — lo र hi दुई सिमाना बोकेर हिँड्ने, देब्रे जाँदा hi लाई अहिलेको value ले साँघुऱ्याउने, दाहिने जाँदा lo लाई। यसरी हरेक नोडले आफ्नो सबै पुर्खाले तोकेको साँघुरो सिमाना भित्रै छ कि छैन जाँचिन्छ, एक्लो बुबासँगको तुलनाले मात्र होइन।',
    },
    {
      heading: 'होसियार! Pitfalls and when NOT to use',
      bullets: [
        'Unbalanced insert order (e.g. sorted input) degenerates to a linked list — O(n) everything.',
        'Self-balancing trees (AVL, Red-Black) fix this — know the name, rarely need to implement in an interview.',
        'Duplicate values: decide the rule up front (go left? go right? not allowed?) and state it.',
        'For pure “top-k” or “kth largest” questions, a heap is often simpler than a BST — don’t over-reach for BST.',
      ],
      narration: 'अन्तिम होसियारी। यदि नम्बरहरू क्रमैसँग (पहिले नै sorted) insert गर्नुभयो भने रूख बिग्रेर सिधा लहर बन्छ — height n नै हुन्छ, अनि BST को सबै फाइदा हराउँछ — त्यसैले insert गर्ने क्रम पनि प्रश्नको भाग हो। यो समस्या समाधान गर्न AVL वा Red-Black Tree जस्ता आफैं सन्तुलित हुने रूखहरू छन् — नाम चिनेर राख्नुहोस्, तर interview मा प्रायः पूरै implement गर्न भनिँदैन, बुझेको देखाए पुग्छ। Duplicate value आयो भने के गर्ने भन्ने नियम पहिल्यै टुङ्ग्याएर बोल्नुहोस् — देब्रे पठाउने कि दाहिने कि allow नै नगर्ने। र अन्तिम सुझाव — कतिपयले kth largest वा top-k खोज्दा सिधै BST तिर दौडन्छन्, तर त्यहाँ heap प्रायः सरल र छिटो हुन्छ — औजार छान्दा प्रश्नले साँच्चै के खोजेको हो भनेर एक क्षण सोच्नुहोस्।',
    },
  ],
};
