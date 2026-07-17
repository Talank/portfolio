window.NEPALI_DECKS = window.NEPALI_DECKS || {};
window.NEPALI_DECKS['graphs-bfs-dfs-topo-union'] = {
  id: 'graphs-bfs-dfs-topo-union',
  title: 'Graphs: BFS/DFS, Topological Sort, Union-Find',
  titleNe: 'सडकको जाल — को कोसँग जोडिएको',
  intro: 'trees generalize to graphs — but now cycles exist, so visited-tracking becomes non-negotiable',
  slides: [
    {
      heading: 'When to reach for it',
      bullets: [
        'Anything with “connections”, “dependencies”, “islands”, “shortest path”, “can I reach X from Y?”',
        'A graph is just a tree that <b>allows cycles</b> — same DFS/BFS toolkit, plus a mandatory <code>visited</code> set.',
        'Three extra tools graphs bring: topological sort (ordering), union-find (grouping), Dijkstra (weighted shortest path).',
      ],
      narration: 'अब Graph — अघिल्लो module को रूखकै ठूलो दाजु। रूखमा एउटै बुबाबाट मात्र आइन्छ, कहिल्यै घुम्दै फर्केर उही ठाउँमा पुगिँदैन। Graph मा भने सडकको जाल जस्तै — एउटा शहरबाट अर्को शहर जाने धेरै बाटो हुन सक्छ, र घुम्दै-घुम्दै फेरि सुरुकै शहरमा फर्किन पनि सकिन्छ — यसलाई cycle भनिन्छ। यसैले अघिल्लो module कै DFS र BFS यहाँ पनि उस्तै काम गर्छन्, तर एउटा नयाँ नियम अनिवार्य हुन्छ — visited भन्ने डायरी राख्नैपर्छ, नत्र एउटै शहरमा घुम्दै-घुम्दै अनन्तकाल अड्किनुहुन्छ। यो module मा तीन नयाँ हतियार पनि थपिन्छन् — topological sort (कस्को पहिले, कस्को पछि), union-find (कुन-कुन समूहमा जोडिएका छन्), अनि तौल भएको बाटोमा Dijkstra।',
    },
    {
      heading: 'कथा: Why visited is non-negotiable',
      bullets: [
        'Without <code>visited</code>, a cycle sends DFS/BFS into an infinite loop.',
        'Mark a node visited <b>the moment you enqueue/push it</b>, not when you process it — or duplicates flood the queue.',
        'Two representations: adjacency list (usual) vs. matrix (dense graphs, O(1) edge check).',
      ],
      narration: 'कथा — तपाईं अपरिचित शहरको गल्लीमा घुम्दै हुनुहुन्छ, कुनै नक्सा छैन। यदि तपाईंले कुन-कुन घर पहिले नै देखिसक्नुभयो भनेर मनमा नराख्नुभयो भने, गोलाकार गल्लीमा घुम्दै-घुम्दै तिनै घरहरू पटक-पटक देख्दै जानुहुन्छ, कहिल्यै अन्त्य हुँदैन। त्यसैले visited डायरी अनिवार्य — जुन घर देख्नुभयो, तुरुन्त डायरीमा लेख्नुहोस्। तर एउटा सूक्ष्म तर महत्वपूर्ण समय-मिलान छ — घर देख्नासाथ (queue मा हाल्नासाथ) लेख्ने, कि पुगेर भित्र पसेपछि (process गरेपछि) लेख्ने? BFS मा पहिलो नियम पाल्नुपर्छ — नत्र उही छिमेकी घर धेरै मान्छेले एकैचोटि देखेर queue मा धेरै पटक थपिदिन्छन्, र भीड बढ्छ। Graph दुई तरिकाले बनाइन्छ — adjacency list (प्रायः प्रयोग हुने, हल्का) वा matrix (घना जालमा, दुई नोड जोडिएका छन् कि छैनन् भन्ने प्रश्नको उत्तर O(1) मै)।',
    },
    {
      heading: 'सम्झने सूत्र (mnemonic)',
      big: '“visited मा लेखेपछि मात्र पस — नत्र गोलचक्करमा अड्किन्छौं।”',
      bullets: [
        'Topological sort = “course prerequisites” ordering — only possible on a <b>DAG</b> (no cycles).',
        'Union-Find = “which group am I in?” — near-O(1) with path compression + union by rank.',
        'Cycle detection: DFS with a <b>recursion-stack</b> set (directed) or parent-tracking (undirected).',
      ],
      narration: 'सूत्र — visited मा लेखेपछि मात्र पस, नत्र गोलचक्करमा अड्किन्छौं। अब तीन विशेष हतियार छिट्टै चिनौं। Topological Sort — यो त कलेजको prerequisite तालिका जस्तै हो — कुन विषय पढ्नुअघि कुन पढिसक्नुपर्छ भन्ने क्रम निकाल्ने — तर यो तब मात्र सम्भव छ जब graph मा cycle छैन (DAG भनिन्छ) — नत्र A ले B चाहियो, B ले A चाहियो भने कहिल्यै दुवै पूरा हुँदैनन्। Union-Find चाहिँ “म कुन समूहमा छु?” भन्ने प्रश्नको लागि हो — साथीहरूको मित्रता-समूह छुट्याउने जस्तै — path compression र union by rank भन्ने दुई जुक्तिले यसलाई लगभग O(1) सम्म छिटो बनाइदिन्छ। र cycle पत्ता लगाउने — directed graph मा अहिलेको recursion बाटोमा नै फेरि त्यही नोड आयो कि भनेर जाँच्ने, undirected मा जहाँबाट आयो त्यो बुबालाई मात्र छोडेर अरू सबैतिर visited भेटिए cycle।',
    },
    {
      heading: 'Python templates',
      code: 'from collections import deque, defaultdict\n\ndef bfs(graph, start):\n    visited, order = {start}, []\n    q = deque([start])\n    while q:\n        node = q.popleft()\n        order.append(node)\n        for nb in graph[node]:\n            if nb not in visited:\n                visited.add(nb)          # queue मा हाल्नासाथ लेख्ने\n                q.append(nb)\n    return order\n\ndef topo_sort(graph, n):\n    indegree = [0] * n\n    for u in graph:\n        for v in graph[u]:\n            indegree[v] += 1\n    q = deque([i for i in range(n) if indegree[i] == 0])\n    order = []\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in graph[u]:\n            indegree[v] -= 1\n            if indegree[v] == 0:\n                q.append(v)\n    return order if len(order) == n else []   # खाली भए cycle छ\n\nclass UnionFind:\n    def __init__(self, n):\n        self.parent = list(range(n))\n    def find(self, x):\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])  # path compression\n        return self.parent[x]\n    def union(self, a, b):\n        ra, rb = self.find(a), self.find(b)\n        if ra != rb:\n            self.parent[ra] = rb',
      narration: 'तीन template हेरौं। BFS — visited मा add हुने ठाउँ हेर्नुहोस् — queue मा append गर्ने लाइनमै, popleft गरेर process गर्दा होइन — यही अघिल्लो slide को नियम हो। Topo sort ले Kahn’s algorithm प्रयोग गर्छ — indegree शून्य भएका (कुनै prerequisite नचाहिने) बाट सुरु गर्ने, प्रशोधन गर्दै अरूको indegree घटाउँदै जाने, शून्य पुगेकालाई थप्दै — अन्त्यमा order को लम्बाइ n भन्दा कम भयो भने cycle छ भन्ने प्रमाण। UnionFind मा find function ले recursion गर्दै जाँदा बाटोमा भेटिएका सबैलाई सिधै जरामा टाँसिदिन्छ — path compression — यसले पछिल्ला query हरू झन्-झन् छिटो बनाउँदै जान्छ।',
    },
    {
      heading: 'होसियार! Where each shows up',
      bullets: [
        'Number of Islands / Connected Components: DFS or BFS flood-fill, or Union-Find — all three work.',
        'Course Schedule (I/II): topological sort — “can all courses finish?” = “is the graph a DAG?”',
        'Redundant Connection, Accounts Merge: scream Union-Find — “which items belong together?”',
        'Weighted shortest path: BFS fails (assumes equal edges) — reach for Dijkstra (heap-based) instead.',
      ],
      narration: 'अन्त्यमा कहाँ-कुन प्रयोग हुन्छ भन्ने नक्सा। Number of Islands वा Connected Components जस्ता प्रश्नमा DFS, BFS, वा Union-Find — तीनै औजारले काम गर्छन् — कुनचाहिँ रोज्ने भन्ने प्रायः स्वादको कुरा हो। Course Schedule प्रश्नले सोझै सोध्छ — के सबै कोर्स सकिन्छ? — यो त graph मा cycle छैन कि भन्ने प्रश्न नै हो, topo sort ले उत्तर दिन्छ। Redundant Connection वा Accounts Merge जस्ता प्रश्नले “कुन-कुन वस्तु सँगै हुन्छन्” भनेर करायो भने त्यो सिधै Union-Find को आवाज हो। र अन्तिम सावधानी — बाटोको तौल फरक-फरक छ भने (weighted graph) BFS ले गलत उत्तर दिन्छ, किनकि त्यसले सबै बाटो बराबर लामो मान्छ — त्यहाँ heap प्रयोग गर्ने Dijkstra चाहिन्छ, जुन अघिल्लो module को heap ज्ञानसँग सिधै जोडिन्छ।',
    },
  ],
};
