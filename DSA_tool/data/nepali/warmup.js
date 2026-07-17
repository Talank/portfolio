window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['warmup'] = {
  id: 'warmup',
  title: 'Big-O Refresher + Pythonic Idioms',
  titleNe: 'Big-O भनेको के हो? + Python का जुक्तिहरू',
  intro: 'Big-O without fear, plus the five Python idioms every later pattern leans on',
  slides: [
    {
      heading: 'What Big-O actually asks',
      bullets: [
        'Big-O answers one question: <b>if the input gets bigger, how much more work do I do?</b>',
        'It ignores constants and small inputs — it is about the <i>shape</i> of growth, not exact seconds.',
        'Interviewers ask it on every single problem; it is the vocabulary of the whole course.',
      ],
      narration: 'नमस्ते, ल सुरु गरौं है। Big-O भन्ने बित्तिकै धेरैलाई गणितको डर लाग्छ, तर यसले सोध्ने प्रश्न एउटै मात्र हो — input ठूलो हुँदै गयो भने मेरो काम कति बढ्छ? एउटा कथा सुन्नुहोस्। तपाईं असनको भीडमा साथी खोज्दै हुनुहुन्छ। भीडमा दश जना छन् भने सजिलो, तर दश हजार भए? तपाईंको खोज्ने तरिका उही भए पनि, भीड बढ्दा दुःख कति बढ्छ भन्ने कुरा नै Big-O हो। त्यसैले Big-O लाई यसरी सम्झनुहोस् — ओहो! n दोब्बर भयो भने के हुन्छ? यही एउटा प्रश्न मनमा राख्नुभयो भने आधा कुरा बुझियो।',
    },
    {
      heading: 'The growth ladder',
      bullets: [
        '<code>O(1)</code> — same work no matter the size (dict lookup)',
        '<code>O(log n)</code> — halve the problem each step (binary search)',
        '<code>O(n)</code> — touch everything once (a single loop)',
        '<code>O(n log n)</code> — sorting',
        '<code>O(n²)</code> — every pair (nested loops)',
        '<code>O(2ⁿ)</code> — every subset (danger zone)',
      ],
      narration: 'अब भर्‍याङ हेरौं। O(1) भनेको किराना पसलेलाई चिनी भन्नुभयो, उसले सिधै झिकिदियो — भीड जति भए पनि उही समय। O(log n) भनेको शब्दकोश बीचबाट खोल्ने बानी — हरेक पटक आधा फ्याँक्दै जाने। O(n) भनेको सिङ्गो लाइनमा एक-एक गरेर सोध्दै हिँड्ने। O(n log n) भनेको sort गर्ने खर्च — यो प्रायः स्वीकार्य मानिन्छ। O(n²) चाहिँ खतराको घण्टी — हरेक जोडी जाँच्ने nested loop, भीड दोब्बर हुँदा काम चार गुणा। अनि O(2ⁿ) त डढेलो जस्तै हो — हरेक subset जाँच्ने, सानै n मा पनि computer थला पर्छ। Interview मा तपाईंको काम प्रायः O(n²) लाई O(n) वा O(n log n) मा झार्ने नै हुन्छ।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“O भनेको — ओहो! n दोब्बर भयो भने?”',
      bullets: [
        'O(1): same — पसलेले सिधै दिने',
        'O(log n): halve — शब्दकोश आधा-आधा',
        'O(n): once each — लाइनमा एक-एक',
        'O(n²): every pair — सबैले सबैसँग हात मिलाउने',
      ],
      narration: 'सम्झने सूत्र यही हो — O भनेको ओहो! n दोब्बर भयो भने? O(1) मा केही फरक पर्दैन। O(log n) मा एउटा मात्र थप कदम लाग्छ — किनकि दोब्बर भीडलाई एकै काटमा आधा बनाइन्छ। O(n) मा काम पनि दोब्बर। O(n²) मा काम चार गुणा — भोजमा सबैले सबैसँग हात मिलाए जस्तै, मान्छे दोब्बर हुँदा हात मिलाइ चार गुणा। यो चित्र मनमा बस्यो भने complexity को प्रश्नमा कहिल्यै अलमल हुनुहुन्न।',
    },
    {
      heading: 'The five Python idioms this course leans on',
      code: 'for i, x in enumerate(nums):      # index + value together\nfor a, b in zip(xs, ys):          # walk two lists in step\ncount[x] = count.get(x, 0) + 1    # dict with a default\nsquares = [x*x for x in nums]     # build a list in one line\npairs.sort(key=lambda p: p[0])    # sort by a chosen field',
      narration: 'अब Python का पाँच जुक्ति, जुन पछिका सबै pattern मा बारम्बार आउँछन्। enumerate ले index र value सँगै दिन्छ — आफैं counter चलाउने झन्झट सकियो। zip ले दुई लिस्टलाई सँगसँगै हिँडाउँछ, दुई साथी हात समातेर हिँडे जस्तै। dict dot get ले चाबी नभेटिए पनि नरिसाई default फर्काउँछ — गन्ती गर्दा यो नभई हुँदैन। List comprehension ले चार लाइनको loop लाई एक लाइनमा खुम्च्याउँछ। अनि sort को key argument ले कुन हिसाबले क्रम मिलाउने भनेर तपाईं आफैं तोक्न पाउनुहुन्छ। यी पाँच जुक्ति औंलामा बसे भने code लेख्दा हात आफैं चल्छ।',
    },
    {
      heading: 'होसियार! Common Big-O traps in Python',
      bullets: [
        '<code>x in my_list</code> is O(n); <code>x in my_set</code> is O(1) — build a set first!',
        'String concatenation in a loop (<code>s += ch</code>) is O(n²) — collect in a list, <code>"".join()</code> once.',
        '<code>list.pop(0)</code> is O(n) — use <code>collections.deque</code> for front-removal.',
        'Sorting inside a loop turns O(n log n) into O(n² log n).',
      ],
      narration: 'अन्त्यमा, चार वटा गुप्त खाडल — Python मा code सफा देखिन्छ तर भित्रभित्रै ढिलो भइरहेको हुन्छ। पहिलो — in operator list मा O(n) हो तर set मा O(1), त्यसैले खोजी धेरै पटक गर्नुछ भने पहिला set बनाउनुहोस्। दोस्रो — loop भित्र string जोड्दै जानु भनेको हरेक पटक पूरै string फेरि सार्नु हो, त्यो O(n²) बन्छ — बरु list मा थुपारेर अन्त्यमा एकै पटक join गर्नुहोस्। तेस्रो — list को अगाडिबाट pop गर्दा सबै element सर्नुपर्छ, त्यसका लागि deque भन्ने भाँडो छ। चौथो — loop भित्र sort नगर्नुहोस्। यति याद राखे warm-up सकियो — अब पहिलो pattern तिर लागौं।',
    },
  ],
};
