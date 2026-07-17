window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['trie'] = {
  id: 'trie',
  title: 'Trie (Prefix Tree)',
  titleNe: 'शब्दकोशको साझा जरा',
  intro: 'words that share a prefix share the same path — turning “starts with” queries into O(length) walks',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Anything about <b>prefixes</b>: autocomplete, spell-check, “does any word start with…”.',
        'Word search on a grid, IP-routing-style longest-prefix-match, dictionary lookups at scale.',
        'A hash set answers “is this word in the dictionary?” — a trie also answers “is this a valid <i>prefix</i>?” in the same O(length).',
      ],
      narration: 'अब यो course को अन्तिम pattern — Trie, जसलाई prefix tree पनि भनिन्छ। कल्पना गर्नुहोस् — ठूलो शब्दकोश। “काठ”, “काठमाडौं”, “काठको” — तीनवटै शब्द “काठ” भन्ने उही जराबाट सुरु हुन्छन्। Trie भनेको ठ्याक्कै यही विचारमा बनेको रूख हो — उस्तै सुरुवात भएका शब्दहरूले बाटोको सुरुको भाग साझा गर्छन्, र जहाँ फरक पर्न थाल्छ त्यहीँबाट मात्र हाँगा छुट्टिन्छ। यो तब काम लाग्छ जब प्रश्नमा “prefix” शब्द नै आउँछ — autocomplete (टाइप गर्दै गर्दा सुझाव), spell-check, वा “कुनै शब्द यो अक्षरहरूबाट सुरु हुन्छ कि?” — Hash set ले त “यो पूरा शब्द शब्दकोशमा छ?” भन्ने मात्र चाँडो भन्न सक्छ, तर “यो अधुरो अक्षर-समूह कुनै शब्दको सुरुवात हो कि?” भन्ने प्रश्नको लागि trie नै चाहिन्छ, त्यो पनि उस्तै छोटो समयमा।',
    },
    {
      heading: 'कथा: The shared-root library',
      bullets: [
        'Each node = one character; a path from root to node = the prefix spelled so far.',
        'A node marks <b>end-of-word</b> separately from “has children” — “काठ” can be a word <i>and</i> a prefix of “काठमाडौं”.',
        'Insert/search cost = O(word length) — completely independent of how many other words are stored!',
      ],
      narration: 'पुस्तकालयको कथा सोच्नुहोस् — हजारौं किताब वर्णानुक्रमले दराजमा मिलाइएका छन्, तर विशेष तरिकाले — उस्तै पहिलो अक्षर भएका किताबहरू एउटै पहिलो दराजमा, त्यसभित्र उस्तै दोस्रो अक्षर भएकाहरू एउटै उपदराजमा — जति गहिरो जान्छ त्यति धेरै किताबले बाटो साझा गर्छन्। Trie मा हरेक नोड एउटा अक्षर हो, र जरादेखि कुनै नोडसम्मको बाटो नै अहिलेसम्म बनेको prefix हो। एउटा सूक्ष्म तर महत्वपूर्ण कुरा — कुनै नोडमा “यहाँ एउटा पूरा शब्द सकिन्छ” भन्ने झन्डा छुट्टै राख्नुपर्छ, किनकि “काठ” आफैंमा एउटा पूरा शब्द पनि हो, अनि “काठमाडौं” को अगाडिको भाग पनि — दुवै कुरा एकैचोटि सत्य हुन सक्छ। र सबैभन्दा राम्रो कुरा — शब्द खोज्न वा थप्न लाग्ने समय त्यो शब्दको लम्बाइमा मात्र भर पर्छ, शब्दकोशमा अरू कति हजार शब्द छन् भन्नेसँग कुनै सरोकार राख्दैन!',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“उस्तै सुरुवात, उस्तै बाटो — फरक परेकै ठाउँमा मात्र हाँगा छुट्टिन्छ।”',
      bullets: [
        'Node = <code>{children: {char: node}, is_end: bool}</code> — a dict of dicts, basically.',
        'Insert: walk/create one node per character, mark <code>is_end = True</code> at the last one.',
        'starts_with(prefix): walk the same path — if you fall off, the answer is no.',
      ],
      narration: 'सूत्र — उस्तै सुरुवात, उस्तै बाटो, फरक परेकै ठाउँमा मात्र हाँगा छुट्टिन्छ। संरचना हेर्दा trie साँच्चै जटिल छैन — हरेक नोड भनेको एउटा dictionary हो, जसमा अक्षरबाट अर्को नोडमा जाने बाटो राखिन्छ, र एउटा is_end भन्ने झन्डा। शब्द थप्दा — अक्षर-अक्षर हिँड्दै जाने, बाटो नभेटिए नयाँ नोड बनाउँदै, अन्तिम अक्षरमा पुगेर is_end लाई True बनाउने। Prefix जाँच्दा उस्तै बाटो हिँड्ने — कतै बाटो नै नभेटिए, त्यो prefix शब्दकोशमा कहीं पनि छैन भन्ने तुरुन्तै थाहा हुन्छ, बीचैमा रोकिन सकिन्छ।',
    },
    {
      heading: 'Python template',
      code: 'class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()   # नयाँ हाँगा\n            node = node.children[ch]\n        node.is_end = True                        # शब्द यहीं सकियो\n\n    def search(self, word):\n        node = self._walk(word)\n        return node is not None and node.is_end\n\n    def starts_with(self, prefix):\n        return self._walk(prefix) is not None\n\n    def _walk(self, s):\n        node = self.root\n        for ch in s:\n            if ch not in node.children:\n                return None                       # बाटो टुट्यो\n            node = node.children[ch]\n        return node',
      narration: 'Template मा चार function छन्। insert ले अक्षर-अक्षर हिँड्दै नभएको हाँगा बनाउँदै जान्छ, अन्त्यमा is_end बनाउँछ। search र starts_with दुवैले उही _walk helper प्रयोग गर्छन् — फरक एउटै हो — search ले अन्त्यमा is_end साँचो छ कि भनेर पनि जाँच्छ, किनकि बाटो भेटिनु मात्र प्रश्न पर्याप्त छैन — पूरा शब्दै सकिएको हुनुपर्छ। starts_with ले चाहिँ बाटो भेटियो कि भन्ने मात्र हेर्छ, is_end जाँच्दैन — किनकि prefix आफैं पूरा शब्द नहुन पनि सक्छ। _walk मा बाटो टुट्नासाथ None फर्काएर तुरुन्तै रोकिनु नै trie को छिटोपनको रहस्य हो — बाँकी अक्षर जाँच्नै पर्दैन।',
    },
    {
      heading: 'होसियार! Space cost and where it shows up',
      bullets: [
        'Space can balloon: many words with little shared prefix ≈ one node per character, no savings.',
        'Word Search II (grid + dictionary): build a trie of all words, DFS the grid, prune branches the trie says can’t lead anywhere.',
        'Autocomplete: reaching the end of a prefix, then DFS-collecting all <code>is_end</code> words in that subtree.',
        'For pure “is this word present” with no prefix queries, a plain hash set is simpler — don’t reach for a trie unless prefixes matter.',
      ],
      narration: 'अन्तिम होसियारी। यदि शब्दकोशका शब्दहरूले एक-अर्कासँग साझा गर्ने प्रिफिक्स थोरै छ भने, trie ले खासै ठाउँ बचत गर्दैन — लगभग हरेक अक्षरको आफ्नै नोड बन्छ, फाइदा हराउँछ — त्यसैले trie कहिले प्रयोग गर्ने भन्ने निर्णय शब्दहरू कति मिल्दाजुल्दा छन् भन्नेमा पनि भर पर्छ। Word Search Two जस्तो प्रश्नमा trie ले grid-DFS सँग मिलेर काम गर्छ — सबै शब्दको trie बनाइन्छ, अनि grid मा DFS गर्दा trie मा त्यो बाटो नभेटिए त्यहीं हाँगा काटिदिने (pruning) — नत्र प्रत्येक शब्द अलग-अलग grid मा खोज्दा धेरै समय लाग्थ्यो। Autocomplete मा टाइप गरिसकेको prefix सम्म trie मा हिँडेर, त्यहाँबाट तलको सम्पूर्ण उपरूखमा जति is_end भेटिन्छन् ती सबै DFS ले बटुल्ने — त्यही नै सुझाव-सूची हो। र अन्तिम सम्झना — यदि प्रश्नमा prefix को कुनै चासो नै छैन, केवल पूरा शब्द छ कि भन्ने मात्र हो भने, सादा hash set नै सरल र पर्याप्त हुन्छ — trie जबरजस्ती नझिक्नुहोस्। यसैसँग हाम्रो बीस pattern को यात्रा टुङ्गिन्छ — अब सबै अस्त्र तयार छन्, अभ्यास मात्र बाँकी छ!',
    },
  ],
};
