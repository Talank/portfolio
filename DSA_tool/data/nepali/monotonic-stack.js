window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['monotonic-stack'] = {
  id: 'monotonic-stack',
  title: 'Monotonic Stack',
  titleNe: 'अग्लो आयो, होचालाई पप!',
  intro: 'next-greater / next-smaller for every element in one pass',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        '“For each element, find the <b>next greater</b> (or smaller) element.”',
        'Daily Temperatures: “how many days until a warmer day?”',
        'Largest Rectangle in Histogram, stock spans, remove-digits problems.',
        'Naive answer is O(n²) look-ahead — the stack makes it O(n).',
      ],
      narration: 'अब Monotonic Stack — नाम डरलाग्दो, कुरा सजिलो। कहिले चाहिन्छ? जब प्रश्नले भन्छ — हरेक element को लागि, त्यसपछि आउने पहिलो ठूलो element कुन हो? Daily Temperatures प्रख्यात उदाहरण हो — आजभन्दा तातो दिन आउन कति दिन कुर्नुपर्छ? सोझो तरिकाले हरेक दिनबाट अगाडि हेर्दै जाँदा O(n²) लाग्छ। कथा यस्तो — सभा हलमा मान्छेहरू लाइनमा उभिँदै आउँदैछन्, र हरेकलाई जान्नु छ — मलाई छेक्ने पहिलो अग्लो मान्छे को हो? नयाँ अग्लो मान्छे भित्र पस्नासाथ उसले आफूभन्दा होचा जति सबैको उत्तर एकै झट्कामा दिइदिन्छ — तिमीहरू सबैलाई छेक्ने म हुँ! यही एक झट्काको हिसाबले O(n) बन्छ।',
    },
    {
      heading: 'कथा: Why the stack stays sorted',
      bullets: [
        'Stack holds indices still <b>waiting</b> for their answer.',
        'New element arrives: pop everyone shorter — <i>you are their answer</i>.',
        'What survives is always in decreasing order — monotonic, by construction.',
      ],
      narration: 'भित्री संयन्त्र हेरौं। Stack मा को बस्छ? — जसले आफ्नो उत्तर अझै पाएका छैनन्, तिनका index हरू। नयाँ element आउँदा नियम एउटै — stack को टुप्पोमा आफूभन्दा होचो जो-जो छन्, सबैलाई pop गर्दै भन्ने — तिम्रो उत्तर म हुँ। अनि आफू चाहिँ stack मा चढेर आफ्नै पालो कुर्ने। अब सोच्नुहोस् — pop भइसकेपछि stack मा को बाँकी रहन्छ? नयाँ भन्दा अग्ला मात्र। त्यसैले stack सधैं घट्दो क्रममा रहन्छ — कसैले जबरजस्ती मिलाएको होइन, नियमले आफैं मिलाइदिएको। र complexity को तर्क सुन्दर छ — हरेक element एक पटक stack मा चढ्छ, बढीमा एक पटक ओर्लन्छ — जम्मा O(n), भित्र while loop देखिए पनि।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“अग्लो आयो — होचालाई पप, उत्तर थमाऊ, आफू चढ।”',
      bullets: [
        'Next <b>greater</b> → pop while top is <b>smaller</b> (decreasing stack).',
        'Next <b>smaller</b> → pop while top is <b>bigger</b> (increasing stack).',
        'Store <b>indices</b>, not values — distances and originals need them.',
      ],
      narration: 'सूत्र — अग्लो आयो, होचालाई पप, उत्तर थमाऊ, आफू चढ। दिशा अलमलियो भने यो सम्झनुहोस् — जे खोजेको हो, त्यसको उल्टो चीज stack मा थुप्रिन्छ। Next greater खोज्दै हुनुहुन्छ भने stack मा घट्दो लाइन बस्छ, next smaller खोज्दा बढ्दो लाइन। अनि एउटा व्यावहारिक नियम — stack मा value होइन, index राख्नुहोस्। Daily Temperatures ले कति दिन भनेर सोध्छ — दूरी निकाल्न index नै चाहिन्छ। Value चाहिए nums of index ले जहिल्यै पाइन्छ, तर index फालियो भने फर्केर आउँदैन।',
    },
    {
      heading: 'Python template',
      code: 'def daily_temperatures(temps):\n    ans = [0] * len(temps)\n    stack = []                        # indices, temps decreasing\n    for i, t in enumerate(temps):\n        while stack and temps[stack[-1]] < t:\n            j = stack.pop()           # होचालाई पप\n            ans[j] = i - j            # उत्तर थमाऊ (कति दिन कुऱ्यो)\n        stack.append(i)               # आफू चढ\n    return ans',
      narration: 'Template दश लाइनको छ। for loop ले हरेक दिन हेर्छ, while ले आफूभन्दा चिसा दिनहरूलाई pop गर्दै उत्तर भरिदिन्छ — i minus j, अर्थात् कति दिन कुरेको। अनि आफ्नो index stack मा। Loop सकिँदा stack मा बाँकी रहेकाहरूको उत्तर आएन — तिनको भाग्यमा तातो दिन आएनछ, ans मा शून्य नै रहन्छ, जुन प्रश्नले मागे अनुसार ठीकै हो। कतिपय प्रश्नमा चाहिँ बाँकी रहेकालाई minus one वा list को लम्बाइ भर्नुपर्ने हुन्छ — प्रश्न पढेर छुट्याउनुहोस्। Equal value आउँदा pop गर्ने कि नगर्ने — strictly less राख्ने कि less than equal — यो पनि प्रश्नैपिच्छे फरक पर्ने धार हो, होस राख्नुहोस्।',
    },
    {
      heading: 'होसियार! The famous applications',
      bullets: [
        '<b>Largest Rectangle in Histogram</b>: increasing stack; a pop means “your rectangle just closed”.',
        '<b>Remove K Digits</b>: build the smallest number by popping bigger digits while you still may.',
        '<b>Stock Span / Online</b>: same trick arriving one element at a time.',
        'Circular arrays (Next Greater II): loop the array twice with <code>i % n</code>.',
      ],
      narration: 'यो pattern का हस्तीहरू चिनौं। Largest Rectangle in Histogram — interview को कठिन प्रश्नमध्ये एक — बढ्दो stack चलाइन्छ, र कुनै bar pop हुनु भनेको त्यही bar उचाइ भएको rectangle को दायाँ पर्खाल भेटियो भन्नु हो — pop हुँदा नै area हिसाब हुन्छ। Remove K Digits मा number सानो बनाउन अगाडिका ठूला अङ्कहरू pop गर्दै जाने — quota सकिनुअघि जति सक्यो। अनि array गोलो छ भने — Next Greater Element Two — array लाई दुई फन्को मार्ने, index मा modulo n लगाएर — code मा दुई अक्षरको फेरबदल मात्र। जहाँ-जहाँ पछि आउने पहिलो ठूलो वा सानो भन्ने वाक्य सुनिन्छ, त्यहाँ यो अग्लो-होचो नियम एकैछिन मनमा खेलाउनुहोस् — आधा जसो बेला यही नै उत्तरको ढोका हो।',
    },
  ],
};
