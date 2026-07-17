window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['merge-intervals'] = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  titleNe: 'दशैंको टीका — समय जुधेका निम्ता जोड्ने',
  intro: 'sort by start, then sweep once, merging anything that overlaps',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Input is a list of <b>ranges</b>: <code>[start, end]</code> — times, bookings, reservations.',
        'Words like overlap, merge, conflict, “minimum rooms”, “free time”.',
        'Almost always step 1 is the same: <b>sort by start</b>.',
      ],
      narration: 'अब Merge Intervals — यो सबैभन्दा जीवनसँग जोडिएको pattern हो। दशैंको कथा सुनौं। टीका लगाउन पाँच घरको निम्ता आयो — मामाघर एघारदेखि एक बजेसम्म, ठूलोबुबाको बाह्रदेखि दुई, फुपूको साढे तीनदेखि पाँच। कति वटा छुट्टै trip चाहिन्छ? मामाघर र ठूलोबुबाको समय जुधेको छ — एउटै झमटमा भ्याइन्छ, एउटै लामो block बन्यो — एघारदेखि दुईसम्म। फुपूको चाहिँ अलग्गै। यही हो merging। प्रश्नमा ranges, booking, meeting, overlap, conflict — यस्ता शब्द देख्नासाथ यो pattern सम्झनुहोस्। र पहिलो कदम प्रायः सधैं उही — start time अनुसार sort।',
    },
    {
      heading: 'कथा: Why sorting first changes everything',
      bullets: [
        'Unsorted: any interval might clash with any other → O(n²) pairwise checks.',
        'Sorted by start: an overlap can <b>only</b> be with the interval right before you.',
        'So one linear sweep after sorting is enough.',
      ],
      narration: 'किन sort नै पहिलो कदम? Sort नगरी हेर्दा जुनसुकै निम्ताको समय जुनसुकैसँग जुध्न सक्छ — सबै जोडी जाँच्दा O(n²)। तर start अनुसार क्रम मिलाएपछि जादु हुन्छ — अब कुनै निम्ता जुध्छ भने आफूभन्दा ठीक अगाडिको block सँग मात्र जुध्न सक्छ। किनभने त्यसभन्दा अगाडिका सबै त झन् चाँडै सुरु भएका हुन् — तिनीहरूसँगको सम्बन्ध अघिल्लो block ले नै मिलाइसक्यो। त्यसैले sort गरेपछि एउटै सफाइ-यात्रा पुग्छ — हरेक नयाँ interval लाई सोध्ने: तिमी अघिल्लो block भित्रै पर्छौ कि अलग्गै हौ? जम्मा खर्च O(n log n) — sort कै खर्च।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“पहिले sort — अनि छोइए जोड, नछोइए छोड।”',
      bullets: [
        'Overlap test (after sorting): <code>new.start &lt;= current.end</code>',
        'Merge: <code>current.end = max(current.end, new.end)</code>',
        'Else: push current, start a fresh block.',
      ],
      narration: 'सूत्र — पहिले sort, अनि छोइए जोड, नछोइए छोड। छोएको कसरी थाहा पाउने? नयाँको सुरु, चलिरहेको block को अन्त्यभन्दा सानो वा बराबर छ भने छोयो। जोड्ने कसरी? अन्त्य लम्ब्याइदिने — तर होसियार — max लिनुपर्छ, किनकि नयाँ interval पुरानै भित्र पूरै डुबेको पनि हुन सक्छ, त्यस्तो बेला end फर्केर छोटिनु हुँदैन। यो max नै यस pattern को सबैभन्दा प्रसिद्ध bug हो। नछोएको भए चलिरहेको block लाई नतिजामा राखेर नयाँ block सुरु।',
    },
    {
      heading: 'Python template',
      code: 'def merge(intervals):\n    intervals.sort(key=lambda iv: iv[0])   # पहिले sort\n    merged = []\n    for iv in intervals:\n        if merged and iv[0] <= merged[-1][1]:          # छोइयो?\n            merged[-1][1] = max(merged[-1][1], iv[1])  # जोड (max!)\n        else:\n            merged.append(iv)                          # छोड — नयाँ block\n    return merged',
      narration: 'Template छोटो छ — sort, अनि एउटा for loop। merged को अन्तिम block सँग मात्र दाँज्ने, त्यति नै पुग्छ भन्ने प्रमाण अघिल्लो slide मा गरिसक्यौं। एउटा मसिनो प्रश्न interview मा आउँछ — छेउ मात्र छोएको, मानौं एउटा एक बजे सकिने र अर्को ठीक एक बजे सुरु हुने, जोड्ने कि नजोड्ने? प्रश्न अनुसार फरक पर्छ — booking मा प्रायः जोडिन्छ, अरूमा सोध्नुपर्छ। Code मा त्यो भनेको less than equal राख्ने कि strict less than राख्ने भन्ने एउटै अक्षरको निर्णय हो — सोधेर मात्र लेख्नुहोस्।',
    },
    {
      heading: 'होसियार! The famous variants',
      bullets: [
        '<b>Meeting Rooms II</b> (min rooms): don’t merge — sort starts and ends separately, sweep counting +1/−1.',
        '<b>Insert Interval</b>: list already sorted — before / overlapping / after, three phases.',
        '<b>Employee Free Time</b>: merge everything, then read the <i>gaps</i>.',
      ],
      narration: 'यो परिवारका तीन प्रख्यात प्रश्न चिनेर राख्नुहोस्। Meeting Rooms Two ले कति वटा कोठा चाहिन्छ भनेर सोध्छ — यहाँ जोड्ने होइन, गन्ने हो — हरेक सुरुमा plus one, हरेक अन्त्यमा minus one गर्दै सबैभन्दा ठूलो भीड कति पुग्यो हेर्ने। मानौं विवाहको party palace — कति टेबल चाहिन्छ भनेको एकै छिन सबैभन्दा धेरै पाहुना कति भन्ने हो। Insert Interval मा list पहिल्यै sorted हुन्छ — फेरि sort गरेर O(n log n) मा नझार्नुहोस्, तीन चरणमा O(n) मै मिल्छ — अगाडिका सार्ने, जुधेका जोड्ने, पछाडिका सार्ने। अनि Employee Free Time — सबै busy समय जोडिसकेपछि बीचका खाली प्वालहरू नै उत्तर हुन्। जोड्न जान्नु भयो भने खाली समय सित्तैमा आउँछ।',
    },
  ],
};
