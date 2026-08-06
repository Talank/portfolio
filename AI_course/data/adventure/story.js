/* Moominvalley — the hand-written half of the adventure game.
 *
 * Everything a person actually reads or hears lives here: the nine regions,
 * where each lesson stands in the valley, who teaches it, and what they say.
 * The other half — the questions — is not written here. Every lesson already
 * ships a quiz in data/lessons/<id>.js, and build_world.js merges the two into
 * data/adventure/world.js. Writing the questions a second time would mean two
 * copies to keep true.
 *
 * Shape of a region:
 *
 *   id, name, part   what it is called and which part of the course it holds
 *   seed             the map is GENERATED, not drawn — same seed, same valley
 *   w, h, base       size in tiles and the ground under everything
 *   water, paths     rectangles of water, polylines of trodden path
 *   props            houses, tents, boats, fires — placed by hand
 *   scatter          how thickly the generator sprinkles trees and flowers
 *   spawn            where you appear
 *   npcs             one per lesson, at a hand-picked spot
 *   exits            where the region joins its neighbours
 *
 * Maps are generated from a seed rather than drawn as ASCII because a drawn
 * 40x26 grid is a kilobyte of art that still looks like a grid. The generator
 * scatters organically, then js/adventure-worldgen.js flood-fills and carves
 * until every NPC and exit is provably reachable — so a pretty map can never
 * strand you.
 *
 * Line-writing rules, learned from the Dojo:
 *   - Every line here is SPOKEN. Keep them under about thirty words, and write
 *     them to be heard, not skimmed: no parentheses, no symbols, no "e.g.".
 *   - ’teach’ is the lesson, in the character's mouth, before any question is
 *     asked. This is where the course is actually taught. It should make sense
 *     to somebody who has not read the lesson page at all.
 *   - Nobody scolds you for a wrong answer. There is no timer and no failure.
 */
window.MOOMIN_STORY = {

  /* --- the cast ---------------------------------------------------------
     ’voice’ keys are cast in data/adventure/audio/build_adventure_audio.py.
     ’tint’ is the character's colour in the dialogue box and on the map;
     ’body’ picks which original drawing js/adventure-art.js uses. */
  cast: {
    narrator:    { name: 'Narrator',     body: 'none',   tint: '#dbe2ef' },
    moomintroll: { name: 'Moomintroll',  body: 'moomin', tint: '#e8eef7' },
    moominmamma: { name: 'Moominmamma',  body: 'mamma',  tint: '#f2c1d1' },
    moominpappa: { name: 'Moominpappa',  body: 'pappa',  tint: '#c9d8f0' },
    snufkin:     { name: 'Snufkin',      body: 'snufkin', tint: '#8fbf7f' },
    littlemy:    { name: 'Little My',    body: 'my',     tint: '#f6ad55' },
    sniff:       { name: 'Sniff',        body: 'sniff',  tint: '#d9b382' },
    snorkmaiden: { name: 'Snorkmaiden',  body: 'snork',  tint: '#f0d98a' },
    snork:       { name: 'The Snork',    body: 'snork',  tint: '#a8d8d0' },
    hemulen:     { name: 'The Hemulen',  body: 'hemulen', tint: '#c0b8e0' },
    tooticky:    { name: 'Too-Ticky',    body: 'tooticky', tint: '#7fc7d9' },
    groke:       { name: 'The Groke',    body: 'groke',  tint: '#8f8fc0' },
    fillyjonk:   { name: 'The Fillyjonk', body: 'filly', tint: '#d7a0c0' },
    stinky:      { name: 'Stinky',       body: 'stinky', tint: '#9a9a6a' },
  },

  /* Short reactions, drawn at random. These are content-addressed at build
     time, so the whole bank is a few dozen clips no matter how often it plays.
     Being wrong gets curiosity, never a telling-off. */
  reactions: {
    right: [
      'That is it exactly.',
      'Yes. You saw it.',
      'Right, and you did not even hesitate.',
      'Correct. Keep that one.',
      'That is the one.',
    ],
    wrong: [
      'Not quite. Listen, this one is worth getting properly.',
      'No, but that is the mistake everybody makes first.',
      'Not that one. Here is why.',
      'Close. The reason matters more than the answer, so listen.',
      'No. Good. Now you will remember it.',
    ],
  },

  regions: [
    /* ---------------------------------------------------------------- 0 */
    {
      id: 'valley', name: 'Moominvalley', part: 'Part 0 — Orientation',
      seed: 17, w: 42, h: 28, base: 'grass',
      intro: [
        'Moominvalley in early summer. The river is low, the veranda door is open, and nobody in this valley has ever been in a hurry.',
        'You have come here to learn how thinking machines work. That sounds like a thing you learn in a tower somewhere, with a lot of shouting.',
        'It is not. It is learned the way anything is learned here. You walk about, you talk to whoever is sitting on a rock, and one day you notice you understand.',
        'There is no clock in this valley. Wander.',
      ],
      water: [{ x: 0, y: 23, w: 42, h: 5 }],
      paths: [[[8, 24], [8, 14], [21, 14], [21, 9]], [[21, 14], [36, 14]]],
      props: [
        { t: 'house', x: 18, y: 4 },
        { t: 'bridge', x: 7, y: 23, w: 3, h: 5 },
        { t: 'well', x: 27, y: 17 },
        { t: 'sign', x: 12, y: 14, text: 'Moominvalley' },
      ],
      scatter: { tree: 0.05, flower: 0.07, rock: 0.012 },
      spawn: [8, 25],
      npcs: [
        { lesson: 'how-ai-fits-together', who: 'moominmamma', spot: 'the Kitchen Table', x: 20, y: 9 },
      ],
      exits: [{ to: 'mountains', x: 40, y: 14, label: 'The Lonely Mountains' }],
    },

    /* ---------------------------------------------------------------- 1 */
    {
      id: 'mountains', name: 'The Lonely Mountains', part: 'Part 1 — Math Prerequisites',
      seed: 3, w: 46, h: 30, base: 'stone',
      intro: [
        'The Lonely Mountains. Grey rock, thin grass, and a wind that has opinions.',
        'People skip this part. They hear the word mathematics and they go around the mountains instead of over them, and then everything afterwards looks like magic to them.',
        'It is not magic. Up here there are seven things to understand, and every one of them is something you can see with your eyes.',
        'Take your time. The mountains are not going anywhere.',
      ],
      water: [{ x: 18, y: 26, w: 10, h: 4 }],
      paths: [[[1, 15], [10, 15], [10, 8], [22, 8], [22, 20], [34, 20], [34, 11], [44, 11]]],
      props: [
        { t: 'cave', x: 33, y: 4 },
        { t: 'fire', x: 41, y: 22 },
        { t: 'sign', x: 3, y: 15, text: 'The Lonely Mountains' },
      ],
      scatter: { tree: 0.02, flower: 0.01, rock: 0.09 },
      spawn: [2, 15],
      npcs: [
        { lesson: 'vectors-cosine', who: 'snorkmaiden', spot: 'the Compass Rock', x: 10, y: 12, trial: 'cosine' },
        { lesson: 'matrices', who: 'snork', spot: 'the Folding Bridge', x: 15, y: 8, trial: 'matrix' },
        { lesson: 'eigen-svd', who: 'moominpappa', spot: 'the Cave of Echoes', x: 33, y: 6, trial: 'eigen' },
        { lesson: 'calculus-gradients', who: 'snufkin', spot: 'the Foggy Slope', x: 22, y: 15, trial: 'gradient' },
        { lesson: 'probability', who: 'littlemy', spot: 'the Berry Gamble', x: 27, y: 20, trial: 'bayes' },
        { lesson: 'statistics-mle', who: 'hemulen', spot: 'the Butterfly Census', x: 34, y: 16, trial: 'mle' },
        { lesson: 'information-theory', who: 'tooticky', spot: 'the Signal Fire', x: 41, y: 20, trial: 'entropy' },
      ],
      exits: [
        { to: 'valley', x: 0, y: 15, label: 'Moominvalley' },
        { to: 'meadow', x: 45, y: 11, label: 'The Meadow' },
      ],
    },

    /* ---------------------------------------------------------------- 2 */
    {
      id: 'meadow', name: 'The Meadow and Mushroom Wood', part: 'Part 2 — Classical ML',
      seed: 29, w: 46, h: 28, base: 'grass',
      intro: [
        'Down out of the rock and into long grass. This is the part of the valley where things grow in patterns, if you are the sort of person who looks.',
        'Everything here learns the same way. You show it a great many examples, it finds the shape they have in common, and then it guesses about an example it has never seen.',
        'That is the whole of machine learning, and it was working long before anybody built a language model.',
      ],
      water: [{ x: 0, y: 0, w: 46, h: 3 }],
      paths: [[[1, 12], [12, 12], [12, 20], [26, 20], [26, 9], [40, 9], [40, 18], [45, 18]]],
      props: [
        { t: 'cellar', x: 6, y: 16 },
        { t: 'sign', x: 3, y: 12, text: 'The Meadow' },
        { t: 'shed', x: 30, y: 5 },
      ],
      scatter: { tree: 0.07, flower: 0.09, mushroom: 0.04, rock: 0.01 },
      spawn: [2, 12],
      npcs: [
        { lesson: 'ml-fundamentals', who: 'moominmamma', spot: 'the Jam Cellar', x: 7, y: 19, trial: 'overfit' },
        { lesson: 'linear-regression', who: 'snork', spot: 'the Beanpole Field', x: 12, y: 8, trial: 'fitline' },
        { lesson: 'logistic-regression', who: 'hemulen', spot: 'the Mushroom Gate', x: 18, y: 20, trial: null },
        { lesson: 'text-as-numbers', who: 'moominpappa', spot: 'the Library Shed', x: 31, y: 7, trial: null },
        { lesson: 'knn-trees-forests', who: 'fillyjonk', spot: 'the Hedge Maze', x: 26, y: 14, trial: null },
        { lesson: 'clustering-pca', who: 'snorkmaiden', spot: 'the Wildflower Bank', x: 38, y: 12, trial: 'cluster' },
        { lesson: 'model-evaluation', who: 'littlemy', spot: 'the Judging Table', x: 41, y: 21, trial: null },
      ],
      exits: [
        { to: 'mountains', x: 0, y: 12, label: 'The Lonely Mountains' },
        { to: 'river', x: 45, y: 18, label: 'The River' },
      ],
    },

    /* ---------------------------------------------------------------- 3 */
    {
      id: 'river', name: 'The River and the Old Mill', part: 'Part 3 — Deep Learning',
      seed: 41, w: 44, h: 30, base: 'grass',
      intro: [
        'The river comes down out of the meadow here, and somebody long ago put a mill on it.',
        'A mill is a good thing to stand next to while you learn about neural networks, because a mill is the same idea. Water goes in at the top. It turns one wheel, which turns another, which turns a stone, and flour comes out at the bottom.',
        'Nobody ever taught the water what flour is. The shape of the machine did that.',
      ],
      water: [{ x: 20, y: 0, w: 5, h: 30 }],
      paths: [[[1, 20], [18, 20], [18, 12]], [[26, 12], [40, 12], [40, 24]]],
      props: [
        { t: 'mill', x: 15, y: 9 },
        { t: 'bridge', x: 20, y: 19, w: 5, h: 2 },
        { t: 'fire', x: 33, y: 22 },
        { t: 'shed', x: 36, y: 6 },
      ],
      scatter: { tree: 0.08, flower: 0.05, rock: 0.02 },
      spawn: [2, 20],
      npcs: [
        { lesson: 'neural-networks', who: 'snork', spot: 'the Mill Wheel', x: 16, y: 13, trial: 'neuron' },
        { lesson: 'backpropagation', who: 'tooticky', spot: 'the Weir', x: 18, y: 25, trial: 'blame' },
        { lesson: 'training-neural-nets', who: 'snufkin', spot: 'the Campfire by the Ford', x: 32, y: 21, trial: null },
        { lesson: 'pytorch-fundamentals', who: 'snork', spot: 'the Toolshed', x: 37, y: 8, trial: null },
        { lesson: 'cnn-rnn-tour', who: 'tooticky', spot: "the Otter's Bend", x: 27, y: 4, trial: null },
      ],
      exits: [
        { to: 'meadow', x: 0, y: 20, label: 'The Meadow' },
        { to: 'harbour', x: 43, y: 24, label: 'The Harbour' },
      ],
    },

    /* ---------------------------------------------------------------- 4 */
    {
      id: 'harbour', name: 'The Harbour', part: 'Part 4 — Natural Language',
      seed: 55, w: 44, h: 26, base: 'sand',
      intro: [
        'The harbour, and the smell of tar and fish. Boats knock against the jetty all night here and nobody minds.',
        'This is where language gets loaded onto machines, and the first thing you learn at a harbour is that nothing goes aboard whole. It goes aboard in pieces, in crates of a size the crane can lift.',
        'Words are the same. A machine has never once read a word. It reads pieces.',
      ],
      water: [{ x: 0, y: 18, w: 44, h: 8 }],
      paths: [[[1, 12], [16, 12], [16, 17], [30, 17], [30, 8], [42, 8]]],
      props: [
        { t: 'jetty', x: 20, y: 18, w: 3, h: 6 },
        { t: 'boat', x: 26, y: 21 },
        { t: 'stall', x: 8, y: 9 },
        { t: 'shed', x: 34, y: 12 },
      ],
      scatter: { tree: 0.02, flower: 0.02, rock: 0.03 },
      spawn: [2, 12],
      npcs: [
        { lesson: 'tokenization', who: 'tooticky', spot: 'the Fish Market', x: 9, y: 12, trial: 'token' },
        { lesson: 'word-embeddings', who: 'snorkmaiden', spot: 'the Net Loft', x: 21, y: 13, trial: 'analogy' },
        { lesson: 'seq2seq-attention', who: 'moominpappa', spot: "the Ferryman's Jetty", x: 21, y: 22, trial: null },
        { lesson: 'classic-nlp-tasks', who: 'sniff', spot: 'the Curiosity Stall', x: 35, y: 13, trial: null },
      ],
      exits: [
        { to: 'river', x: 0, y: 12, label: 'The River' },
        { to: 'lighthouse', x: 43, y: 8, label: 'The Lighthouse' },
      ],
    },

    /* ---------------------------------------------------------------- 5 */
    {
      id: 'lighthouse', name: 'The Lighthouse', part: 'Part 5 — Transformers',
      seed: 67, w: 38, h: 28, base: 'stone',
      intro: [
        'A rock in the sea with a lighthouse on it, and a light that has not been lit in years.',
        'Everything you have learned so far walks in one direction. Words go in one end and come out the other, and by the time the machine reaches the end of a long sentence it has forgotten the beginning.',
        'The lighthouse does not work like that. The lamp turns, and in one sweep it sees everything at once. That is what happens in this tower, and it is the single idea the whole modern world of language models is built on.',
      ],
      water: [{ x: 0, y: 0, w: 38, h: 6 }, { x: 0, y: 23, w: 38, h: 5 }],
      paths: [[[2, 14], [14, 14], [14, 9], [24, 9], [24, 18], [36, 18]]],
      props: [
        { t: 'lighthouse', x: 17, y: 11 },
        { t: 'boat', x: 5, y: 24 },
        { t: 'sign', x: 4, y: 14, text: 'The Lighthouse' },
      ],
      scatter: { tree: 0.01, flower: 0.01, rock: 0.07 },
      spawn: [2, 14],
      npcs: [
        { lesson: 'self-attention', who: 'moominpappa', spot: 'the Lamp Room', x: 18, y: 9, trial: 'attention' },
        { lesson: 'transformer-architecture', who: 'snork', spot: 'the Spiral Stair', x: 24, y: 13, trial: null },
        { lesson: 'bert-vs-gpt', who: 'tooticky', spot: 'the Two Windows', x: 11, y: 19, trial: null },
        { lesson: 'minigpt-code', who: 'stinky', spot: "the Keeper's Desk", x: 31, y: 20, trial: null },
      ],
      exits: [
        { to: 'harbour', x: 0, y: 14, label: 'The Harbour' },
        { to: 'yard', x: 37, y: 18, label: "The Snork's Yard" },
      ],
    },

    /* ---------------------------------------------------------------- 6 */
    {
      id: 'yard', name: "The Snork's Yard", part: 'Part 6 — LLM Engineering',
      seed: 83, w: 46, h: 28, base: 'grass',
      intro: [
        'The Snork has been building a flying ship for eleven years. It has never flown. He does not mind, because the building is the part he likes.',
        'This is where a model stops being an idea and becomes a thing that costs money, takes weeks, and has to be fed.',
        'Nothing here is clever. It is all shipwright work. But this is the yard where a language model is actually made.',
      ],
      water: [{ x: 38, y: 0, w: 6, h: 19 }],
      paths: [[[1, 14], [12, 14], [12, 6], [26, 6], [26, 22], [40, 22]]],
      props: [
        { t: 'ship', x: 28, y: 10 },
        { t: 'shed', x: 6, y: 18 },
        { t: 'fire', x: 18, y: 20 },
        { t: 'stall', x: 15, y: 4 },
      ],
      scatter: { tree: 0.05, flower: 0.04, rock: 0.02 },
      spawn: [2, 14],
      npcs: [
        { lesson: 'llm-pretraining', who: 'snork', spot: 'the Slipway', x: 29, y: 15, trial: 'scaling' },
        { lesson: 'finetuning-lora', who: 'moominmamma', spot: 'the Sewing Room', x: 7, y: 21, trial: 'lora' },
        { lesson: 'rlhf-alignment', who: 'groke', spot: 'the Cold Pond', x: 22, y: 25, trial: null },
        { lesson: 'inference-sampling', who: 'snufkin', spot: 'the Long Road Out', x: 18, y: 19, trial: 'sampling' },
        { lesson: 'using-models-apis', who: 'sniff', spot: 'the Trading Post', x: 16, y: 5, trial: null },
      ],
      exits: [
        { to: 'lighthouse', x: 0, y: 14, label: 'The Lighthouse' },
        { to: 'island', x: 45, y: 22, label: 'Hattifattener Island' },
      ],
    },

    /* ---------------------------------------------------------------- 7 */
    {
      id: 'island', name: 'Hattifattener Island', part: 'Part 7 — Retrieval and Agents',
      seed: 97, w: 40, h: 28, base: 'sand',
      intro: [
        'An island, low and pale, covered in Hattifatteners. They never speak. They go where the weather sends them, all night, every night, and they are looking for something none of them could name.',
        'That is the closest thing in the valley to an agent. Something that acts on its own, in a loop, towards a goal.',
        'The difference between a Hattifattener and a useful agent is one thing only. The useful one can stop, look at what it just did, and choose the next thing on purpose.',
      ],
      water: [{ x: 0, y: 0, w: 40, h: 4 }, { x: 0, y: 24, w: 40, h: 4 },
              { x: 0, y: 0, w: 2, h: 28 }, { x: 38, y: 0, w: 2, h: 28 }],
      paths: [[[4, 14], [14, 14], [14, 8], [26, 8], [26, 20], [35, 20]]],
      props: [
        { t: 'tower', x: 30, y: 12 },
        { t: 'tent', x: 9, y: 18 },
        { t: 'jetty', x: 4, y: 24, w: 2, h: 4 },
        { t: 'stall', x: 20, y: 17 },
      ],
      scatter: { tree: 0.03, flower: 0.02, rock: 0.04 },
      spawn: [4, 14],
      npcs: [
        { lesson: 'embeddings-rag', who: 'hemulen', spot: 'the Herbarium', x: 14, y: 11, trial: 'rag' },
        { lesson: 'agents-from-scratch', who: 'snufkin', spot: 'the Hattifattener Camp', x: 10, y: 19, trial: 'react' },
        { lesson: 'langchain-langgraph', who: 'snork', spot: 'the Rope Bridge Network', x: 26, y: 10, trial: null },
        { lesson: 'multi-framework-agents', who: 'sniff', spot: 'the Bazaar of Boxes', x: 21, y: 18, trial: null },
        { lesson: 'agent-memory-eval-safety', who: 'fillyjonk', spot: 'the Watchtower', x: 31, y: 15, trial: null },
      ],
      exits: [
        { to: 'yard', x: 2, y: 14, label: "The Snork's Yard" },
        { to: 'winter', x: 37, y: 20, label: 'The Winter Valley' },
      ],
    },

    /* ---------------------------------------------------------------- 8 */
    {
      id: 'winter', name: 'The Winter Valley', part: 'Part 8 — Interviews and Career',
      seed: 101, w: 40, h: 26, base: 'snow',
      intro: [
        'Winter, and the valley is the same valley, and you would not know it. Everything soft is under snow and everything you thought you knew has to be found again by shape alone.',
        'This is the last region, and it asks a different kind of question. Not what is a transformer. Something harder. Design me a system, out loud, for a person who is deciding whether to hire you.',
        'The Groke is here. She sits where the pond used to be, and she is not the enemy. She is only the part of the work that is cold, and everybody has to walk past her.',
      ],
      ice: [{ x: 14, y: 18, w: 12, h: 6 }],
      paths: [[[1, 12], [16, 12], [16, 6], [30, 6], [30, 16], [38, 16]]],
      props: [
        { t: 'palace', x: 22, y: 8 },
        { t: 'fire', x: 6, y: 16 },
        { t: 'sign', x: 3, y: 12, text: 'The Winter Valley' },
      ],
      scatter: { tree: 0.06, flower: 0.0, rock: 0.03 },
      spawn: [2, 12],
      npcs: [
        { lesson: 'ml-system-design', who: 'moominpappa', spot: 'the Ice Palace', x: 23, y: 12, trial: null },
        { lesson: '@groke', who: 'groke', spot: "the Groke's Circle", x: 20, y: 21, trial: null },
      ],
      exits: [{ to: 'island', x: 1, y: 12, label: 'Hattifattener Island' }],
    },
  ],

  /* --- what each lesson's keeper says ------------------------------------
     hook  : what they say when you walk up, before anything is taught
     teach : the lesson itself, one spoken line per array entry
     done  : what they say when you have answered everything they have
     Keyed by lesson id. ’@groke’ is the endgame and has no lesson page. */
  scenes: {

    /* ---- Part 0 --------------------------------------------------------- */
    'how-ai-fits-together': {
      hook: 'There you are. Sit down, you have walked a long way. Have something first and we will talk about your machines afterwards.',
      teach: [
        'People use four or five words for this and they use them as though they were the same word. They are not. They fit inside each other, like my mixing bowls.',
        'The biggest bowl is artificial intelligence. That only means a machine doing something we would call clever if a person did it. That is all. It is a very old idea.',
        'Inside it sits machine learning, which is the part where nobody writes the rules down. You show the machine examples and it works the rule out for itself.',
        'Inside that sits deep learning, which is machine learning done with layers stacked on layers. And inside that sit the language models, which are deep learning pointed at words.',
        'So when somebody says artificial intelligence, ask them which bowl they mean. Half the time they do not know, and it is not rude to ask.',
      ],
      done: 'Good. Now you know what the words mean, which is more than most of the people who use them. Go and see the mountains next.',
    },

    /* ---- Part 1: the mountains ------------------------------------------ */
    'vectors-cosine': {
      hook: 'Oh, it is you. Look at this rock. If you stand exactly here and look along the crack, it points at the sea. Isn’t that lovely?',
      teach: [
        'A vector is only a list of numbers, but it is easier to think of it as an arrow. It has a direction, and it has a length, and those two are different things.',
        'The dot product is what you get by multiplying the two lists together, position by position, and adding it all up. If the arrows point the same way, it is big. If they point opposite ways, it is negative. If they are at right angles, it is zero.',
        'But the dot product is unfair, because a long arrow wins just for being long. So we divide by both lengths, and that is cosine similarity.',
        'Cosine forgets about size and asks only one question. Are these two pointing the same way? One means yes, exactly. Zero means they have nothing to do with each other. Minus one means opposite.',
        'Remember this one properly, because it comes back. Every search that finds the right answer, and every bit of attention inside a language model, is this same little sum.',
      ],
      done: 'There. You will meet that arrow again at the lighthouse, and you will recognise it, and that is a very good feeling.',
    },
    matrices: {
      hook: 'Careful on the planks. I built this bridge so it folds, and if you stand in the wrong place it folds while you are on it.',
      teach: [
        'A matrix is a grid of numbers, and multiplying by one is not arithmetic. It is a thing you do to space itself.',
        'Take a sheet of graph paper. A matrix stretches it, squashes it, turns it, or tips it over. Every point moves, but the lines stay straight and evenly spaced, and the corner stays where it is.',
        'That is what linear means. No bending. That is the whole rule.',
        'And a matrix times a vector is just the same thing done to one single arrow. You are asking, where does this arrow land after the paper is stretched?',
        'Every layer of every neural network you will ever meet is one of these, followed by a bend. Stretch, bend, stretch, bend. That is the machine.',
      ],
      done: 'Good. Mind the third plank on your way off. It is the one that folds.',
    },
    'eigen-svd': {
      hook: 'Shout something into the cave. Go on. You will hear it come back changed, but not changed in every direction equally. That is the whole lesson, and the cave is telling it better than I can.',
      teach: [
        'When a matrix stretches the paper, most arrows get turned as well as stretched. But a few special arrows do not turn at all. They only get longer or shorter.',
        'Those are the eigenvectors. How much longer they get is the eigenvalue. They are the grain of the wood. Every transformation has a grain, and if you find it you understand the transformation.',
        'Now, most grids are not neat squares, and for those there is the singular value decomposition, which people call the S V D.',
        'It says that any transformation at all, however peculiar, is only three things in a row. A turn, then a stretch along the new axes, then another turn.',
        'And the stretches come out in order, biggest first. Keep the first few and throw the rest away, and you have compressed the thing while keeping almost all of what it did. That is how a picture, or a meaning, gets squeezed into fewer numbers.',
      ],
      done: 'The cave has been doing that for ten thousand years and has never once been thanked. Say something kind to it on the way out.',
    },
    'calculus-gradients': {
      hook: 'I cannot see a thing in this fog. But I can still get down, because I can feel which way the ground tilts under my feet.',
      teach: [
        'That is a derivative. It is the steepness of the ground where you are standing, right now, in one direction.',
        'The gradient is the same thing but greedier. It is the direction of steepest uphill, all directions considered at once. So the way down is simply the opposite of the gradient.',
        'And that is how every model in this course learns. It stands somewhere on a landscape of wrongness, feels which way is downhill, and takes one small step. Then it does it again.',
        'The size of the step is called the learning rate, and it is the thing people get wrong. Too small and you are still on the mountain at midnight. Too big and you leap straight over the valley to the far slope.',
        'The chain rule is what lets you feel the slope through several layers of machine at once. If A pushes B and B pushes C, then to know how A moves C, you multiply the two pushes together. That is all backpropagation is, and we will do it properly at the weir.',
      ],
      done: 'Downhill, one step, feel again. If you only ever remember one sentence about training, remember that one.',
    },
    probability: {
      hook: 'I will bet you three berries you get this wrong. I usually win. That is not because I am lucky, it is because I know something you do not.',
      teach: [
        'Probability is not about what will happen. It is about how much you believe, and belief is allowed to change when something new happens.',
        'Here is the thing nobody tells you. A rare disease, a test that is right ninety nine times out of a hundred, and a person who tests positive. Most people say that person is almost certainly ill. Most people are badly wrong.',
        'Because if the disease is one in ten thousand, then in ten thousand people you get one real case and about a hundred false alarms. The person who tested positive is one of a hundred and one, and probably fine.',
        'That is Bayes. Your new belief is your old belief, nudged by the evidence. And if your old belief was tiny, the evidence has to be enormous to move it.',
        'People who forget the old belief lose berries to me constantly. I encourage it.',
      ],
      done: 'Keep your berries. You worked for them. But I want you remembering me the next time somebody quotes you a percentage.',
    },
    'statistics-mle': {
      hook: 'Do not move. There is a specimen on your shoulder and I have been after it since Tuesday.',
      teach: [
        'I count butterflies. I have never once counted all of them, because there are always more butterflies than Hemulen. So I count some, and I say something about all of them, and that is the whole of statistics.',
        'The some is the sample. The all is the population. Everything that goes wrong in statistics goes wrong in the gap between those two words.',
        'Now, maximum likelihood. Suppose I do not know how common the blue ones are. I catch ten and three are blue. Which guess about the true rate would have made that catch least surprising?',
        'Three in ten. Of course three in ten. That is maximum likelihood. Pick the setting of the world that makes what you actually saw the least astonishing.',
        'And here is why an engineer should care. Every loss function you will ever minimise is that idea wearing a coat. Squared error is maximum likelihood if you assume the noise is a bell curve. Cross entropy is maximum likelihood for choosing between categories. They were never arbitrary.',
      ],
      done: 'That is a properly satisfying fact, and there are not many of those. Write it in your notebook.',
    },
    'information-theory': {
      hook: 'Sit by the fire. It is the only warm rock on this mountain and I am not moving off it, so you will have to share.',
      teach: [
        'Information is surprise. That is the whole of it. A thing you already knew tells you nothing. A thing you did not expect tells you a great deal.',
        'So we measure a message by how surprised we should be by it. Something certain carries no information at all. Something rare carries a lot.',
        'Entropy is the average surprise of a source. A coin that always lands heads has an entropy of nothing. A fair coin has one bit. A language has rather more.',
        'Cross entropy is what you get when you use the wrong expectations. If you thought heads was rare and it keeps coming up, you are constantly surprised, and your cross entropy is high. Training a model is nothing but pushing that number down.',
        'And perplexity, which you will see quoted about language models, is only cross entropy dressed up. It means, roughly, how many words the model felt it was choosing between. Lower is a model that is less lost.',
      ],
      done: 'Now go on before you fall asleep here. People who fall asleep on this mountain wake up somewhere else.',
    },

    /* ---- Part 2: the meadow --------------------------------------------- */
    'ml-fundamentals': {
      hook: 'Mind your head on the shelf. Every jar down here is last summer, and I know which ones are good by looking at them, and I could not tell you how.',
      teach: [
        'That is learning. Not being told the rule. Seeing enough jars.',
        'But there is a trap, and it is the trap. A machine can learn the examples instead of the lesson. It gets every jar in this cellar right and then it is useless in anybody else’s cellar. That is overfitting.',
        'The opposite is just as bad. Something too simple to notice anything, which is wrong here and wrong everywhere else too. That is underfitting.',
        'So you never judge a model on the examples it studied. You keep some back that it has never seen, and you judge it on those. Anyone who does not do this is lying to themselves, usually cheerfully.',
        'And the trade off is real. More flexibility catches more of the pattern and more of the accident. The whole craft is finding the middle.',
      ],
      done: 'Take a jar with you. The raspberry. And remember, if it works only on the jars you already have, it does not work.',
    },
    'linear-regression': {
      hook: 'Every bean pole in this row is a different height and I want to know how much sunlight each one gets. There is a straight line in this somewhere.',
      teach: [
        'Linear regression is the simplest honest model there is. You draw a straight line through your points and you use it to guess.',
        'The line has a slope and a starting height, and those are the only two things the machine has to learn.',
        'How does it know which line is right? It measures how far every point sits off the line, squares those distances, and adds them up. That is the cost. The best line is the one with the smallest cost.',
        'Why squared? Because it makes being badly wrong hurt much more than being slightly wrong, and because it gives the landscape one single valley with no false bottoms.',
        'And that valley is why gradient descent works here. Feel downhill, step, repeat, exactly as you learned in the fog. A line is a small thing to fit, but it is the same machinery that trains a model with a hundred billion numbers in it.',
      ],
      done: 'One line, two numbers, and it is the ancestor of everything in the yard by the sea. Not bad for a bean field.',
    },
    'logistic-regression': {
      hook: 'Nobody passes this gate until they tell me whether that mushroom is edible. It is a simple question. It has exactly two answers.',
      teach: [
        'A straight line predicts a number. But some questions are not numbers. Edible or not. Spam or not. That needs a different ending.',
        'So you do the straight line part exactly as before, and then you squash the answer through a curve that bends everything into the space between zero and one. That curve is the sigmoid, and now your answer is a probability.',
        'Which means the model can say I am ninety percent sure, and that is worth far more than a bare yes.',
        'You cannot use squared error here, because it makes the landscape lumpy and gradient descent gets stuck. You use cross entropy instead, which punishes confident wrong answers savagely and is gentle about unsure ones. That is exactly the behaviour you want from anything guarding a gate.',
        'And the last step is yours, not the model’s. Somebody has to pick the line where a probability becomes a decision. Point five is a habit, not a law. If the mushroom is deadly, move it.',
      ],
      done: 'Correct, it was edible. I would not have let you eat it either way. I only wanted to see how you decided.',
    },
    'text-as-numbers': {
      hook: 'I am writing my memoirs, and I have written the word remarkable four hundred times. I only know that because I counted. Counting turns out to be the beginning of everything.',
      teach: [
        'A machine cannot hold a word. It holds numbers. So the very first trick anybody thought of was simply counting.',
        'Take every word that exists in your library, give it a slot, and describe a document by how many times each word appears in it. That is the bag of words. It throws away the order entirely, which sounds fatal and mostly is not.',
        'But raw counts are foolish, because the word the wins every contest. So you weight each word by how rare it is across all documents. Common everywhere, worth nothing. Common here but rare elsewhere, worth a great deal. That is T F I D F.',
        'Now every document is an arrow in a very large space, and you already know what to do with two arrows. Cosine similarity. The angle between them is how alike they are.',
        'That is a working search engine and it is a hundred percent explainable. Nothing here is a neural network. Do not let anybody tell you it is old fashioned to reach for it first.',
      ],
      done: 'Four hundred remarkables. I shall change some of them to notable. That is a kind of compression too.',
    },
    'knn-trees-forests': {
      hook: 'Do not go left. I have measured this hedge maze and left is where people are found weeping. Take my method, it is systematic.',
      teach: [
        'There are three old classifiers and they are all still worth knowing, because they are honest and you can see inside them.',
        'Nearest neighbours does no learning at all. It keeps every example, and when something new arrives it looks up the nearest ones it has already seen and copies their answer. Lazy, effective, and slow when the collection gets big.',
        'A decision tree asks one question at a time. Is the stalk thicker than this? Then, are the gills white? Each question splits the crowd into purer groups, and you follow the branches down to an answer you can read out loud.',
        'One tree is fussy though. It memorises. So you grow hundreds of them, each shown a random part of the data and a random subset of the questions, and you let them vote. That is a random forest.',
        'Their mistakes are random and different, so the mistakes cancel and what they agree on is the signal. It is the single most reliable thing you can reach for on ordinary table shaped data, and it needs almost no tuning.',
      ],
      done: 'Systematic. That is what I always say. Now, out through the gap in the yew, and please do not go left.',
    },
    'clustering-pca': {
      hook: 'I have been sorting these flowers all morning and nobody told me what the sorts are. I am just putting the ones that look alike together.',
      teach: [
        'That is unsupervised learning. No labels. No right answers given. Only the shape of the data itself.',
        'K means is the simple one. You decide there are, say, three sorts. You drop three pins at random, put every flower with its nearest pin, then move each pin to the middle of its flowers. Repeat until nothing moves.',
        'It is almost embarrassingly simple and it works beautifully, as long as the true groups are roughly round blobs of similar size. It is bad at long thin shapes, and you have to tell it the number of sorts, which is often the very thing you wanted to know.',
        'Then there is P C A, which is not sorting but squeezing. It finds the direction in which your data varies most, then the next, and so on, and lets you throw away the rest.',
        'And you have already met it. Those directions are the eigenvectors from the cave. P C A is the S V D put to work on a table of measurements.',
      ],
      done: 'Look, they did sort themselves in the end. I only had to keep moving the pins. That is very restful, actually.',
    },
    'model-evaluation': {
      hook: 'Accuracy. Somebody says accuracy to me one more time and I shall put a frog in their boot.',
      teach: [
        'Here is why. Suppose one berry in a thousand is poisonous. I build a machine that says every berry is safe. It is right nine hundred and ninety nine times out of a thousand. Ninety nine point nine percent accurate. It will also kill you.',
        'So we use two better words. Precision asks, of everything you flagged, how much was really poison? Recall asks, of all the real poison out there, how much did you catch?',
        'And they fight. Flag everything and your recall is perfect and your precision is rubbish. Flag nothing and the opposite. F one is the number that squashes both into one, and it only goes up if both go up.',
        'Which one matters depends entirely on what happens when you are wrong. Poison berries, screening for illness, fraud, you want recall, because a miss is a disaster. A spam filter that eats a job offer, you want precision.',
        'And test on data the model has never seen. Then do it several times over different slices, which is cross validation, so you know your good score was not a lucky slice.',
      ],
      done: 'Right. You may say accuracy in front of me exactly once more, and only if you say what the base rate was.',
    },

    /* ---- Part 3: the river ---------------------------------------------- */
    'neural-networks': {
      hook: 'Watch the wheel. Water hits a paddle, the paddle turns the axle, the axle turns the stone. Nothing in the chain understands bread.',
      teach: [
        'A neuron is smaller than people think. It multiplies each of its inputs by a weight, adds them up, adds one more number called the bias, and then bends the result.',
        'That bend is the whole reason any of this works. Without it, a stack of layers collapses into one single straight line, no matter how many layers you build. Bend, and the stack can make any shape at all.',
        'The usual bend nowadays is called relu, and it is almost insultingly simple. Negative becomes zero, positive stays as it is. That is it. That one kink is enough.',
        'Put a row of neurons side by side and you have a layer. Feed one layer into the next and you have a multilayer perceptron, which is the plainest neural network there is.',
        'Early layers learn crude things, edges and blobs and rough hints. Later layers combine those into ideas. Nobody instructs them to divide the work that way. It falls out of the arrangement, exactly like the mill.',
      ],
      done: 'Eleven years I have been oiling this wheel. It has taught me more about layers than any book.',
    },
    backpropagation: {
      hook: 'Look at the weir. If the water is wrong at the bottom, something is wrong further up, and you have to walk back up the stream to find out which gate.',
      teach: [
        'That walk back up the stream is backpropagation, and it is the one piece of deep learning that is genuinely worth doing slowly.',
        'Forwards, the numbers flow in and a guess comes out. You compare the guess to the truth and get one single number, the loss, which is how wrong you were.',
        'Now you want to know, for every weight in the whole machine, would nudging it up have made that number better or worse? Asking each one separately would take a thousand years.',
        'So instead you walk backwards, one layer at a time, carrying the blame with you. Each layer receives how much it contributed to the error, keeps its own share, and passes the rest back. That sharing out is the chain rule from the foggy slope.',
        'One forward pass, one backward pass, and every weight in the machine knows which way to move. Then you take one small step downhill, and you do the whole thing again. Millions of times. That is training. There is nothing else in it.',
      ],
      done: 'People are frightened of that one and they should not be. It is only asking who is to blame, politely, going backwards.',
    },
    'training-neural-nets': {
      hook: 'Sit down. The fire is doing the work now, I only started it. Training is a bit like that. Most of the skill is in the setting up, and then you leave it alone.',
      teach: [
        'You do not feed a model everything at once. You feed it in mouthfuls, called batches. Small batches are noisy and jittery and often end up somewhere better. Enormous batches are smooth and fast and sometimes settle for the first flat place they find.',
        'Plain gradient descent takes the same size step whatever the ground is like. Momentum lets it roll, so it keeps going through the little dips. Adam goes further and gives every single weight its own step size. Adam is what you use when you do not want to think about it, and that is most of the time.',
        'The learning rate is the one knob that matters more than all the others. The usual practice is to start warm and cool down slowly, so you cover ground early and settle gently at the end.',
        'Then there is dropout, which is deliberate sabotage. During training you switch off a random handful of neurons every pass. The network cannot lean on any one of them, so it learns the idea in several places instead of memorising in one.',
        'And batch normalisation, which keeps the numbers flowing between layers at a sensible scale, so nothing quietly explodes or fades to nothing halfway up the stack.',
      ],
      done: 'That is enough for one fire. If your loss goes up and stays up, it is your learning rate. It is nearly always your learning rate.',
    },
    'pytorch-fundamentals': {
      hook: 'Everything in this shed is a tool for one of the things you already understand. That is all a library is. Somebody else got tired of doing it by hand.',
      teach: [
        'A tensor is an array of numbers that knows how to live on a graphics card. One dimension is a list, two is a table, three is a stack of tables. That is the entire mystery.',
        'The clever part is autograd. As you do arithmetic on tensors, PyTorch quietly writes down what you did. Then you say backward, and it walks that record in reverse and fills in every gradient for you.',
        'So the backpropagation you did by hand at the weir is one word. It is worth having done it by hand once, so you know what the word is buying you.',
        'The training loop is five lines and it never changes. Clear the old gradients. Run the batch forwards. Work out the loss. Call backward. Tell the optimiser to step.',
        'Forget to clear the gradients and they pile up from the last batch and your training goes strange in a way that will not throw an error. Everybody does it once. Now you have done it in advance.',
      ],
      done: 'Take the small spanner. And remember, five lines, in that order, forever.',
    },
    'cnn-rnn-tour': {
      hook: 'The otters here read the river by feel. They do not look at the whole river. They notice one swirl, and then the next, and that is two different ways of paying attention.',
      teach: [
        'For pictures we use convolutional networks. A small window slides across the image looking for one thing, an edge, a corner, a curve, and it looks for that same thing everywhere.',
        'That is the trick that made vision work. A cat is a cat in the corner of the photograph too, so the same detector should be reused all over the image instead of learned again in every position.',
        'Sequences are different, because order is the meaning. So recurrent networks read one item at a time and carry a memory forward, updating it as they go.',
        'And they choke on long things. The memory is one fixed bundle of numbers, so by the end of a long paragraph the beginning has been squeezed out of it. Worse, the gradient has to travel back through every single step, and it fades to nothing on the way.',
        'L S T Ms patched that with gates that choose what to keep. It helped. It did not fix the real problem, which is that reading one word at a time cannot be done in parallel. That is why the lighthouse exists.',
      ],
      done: 'Everything before the lighthouse is people being ingenious about a problem that turned out to have a different answer. It is still worth knowing why they were stuck.',
    },

    /* ---- Part 4: the harbour -------------------------------------------- */
    tokenization: {
      hook: 'Nothing goes on a boat whole. Look at the crates. Every one is a size the crane can lift, and the fish had no say in it.',
      teach: [
        'A model has never seen a word. It sees numbers, and something has to do the cutting up first. That is tokenization, and it is the least glamorous and most consequential step in the whole pipeline.',
        'You could split on words, but then every new word in the world is a stranger the model has no slot for. You could split on letters, which never fails but makes sequences enormous and throws away all the meaning a word carries.',
        'So we do neither. We start from letters and repeatedly glue together whichever pair turns up most often. Do that a few thousand times and the common words end up whole, while rare ones survive as recognisable pieces. That is byte pair encoding.',
        'It is why a model can handle a word it has never met. It arrives in parts the model already knows.',
        'And it explains the strange failures. A model is bad at counting the letters in a word because it cannot see letters, only crates. And you pay by the token, so an unusual language can cost several times more to say the same thing.',
      ],
      done: 'Fish in crates, words in tokens. The crane does not care what is inside. Remember that when the bill comes.',
    },
    'word-embeddings': {
      hook: 'Up here we mend nets, and every knot is only useful because of the knots around it. A knot on its own is a bit of string.',
      teach: [
        'Numbering the words is not enough. Number them and the machine knows they are different and nothing else. Word four hundred and word four hundred and one are neighbours by accident.',
        'So instead we give each word a whole arrow of numbers, and we learn those arrows from how the word is used. A word is known by the company it keeps.',
        'Do that over enough text and something remarkable happens by itself. Words that mean similar things end up pointing in similar directions, and you already know how to measure that. Cosine, from the Compass Rock.',
        'And the directions carry meaning. The step from king to queen turns out to be nearly the same step as from man to woman. Nobody built that in. It fell out of the counting.',
        'Two warnings. Older embeddings give a word one arrow forever, so bank at a river and bank with money share it. And the arrows learn our prejudices exactly as faithfully as they learn our grammar, because both are in the text.',
      ],
      done: 'Meaning as a direction. That is the idea the whole harbour floats on, and it is the same idea the vector database uses on the island.',
    },
    'seq2seq-attention': {
      hook: 'The ferryman used to carry one message across in his head. If it was a long message, he arrived with the end of it and the beginning had fallen in the water.',
      teach: [
        'That was the state of translation. One network read the whole sentence and squeezed it into a single fixed bundle of numbers. Another network read that bundle and wrote the answer.',
        'It worked for short sentences and fell apart on long ones, for exactly the reason you would guess. One bundle is one bundle, whether the sentence is four words or forty.',
        'Attention was the fix, and it is a beautifully simple one. Do not squeeze. Keep every word’s numbers from the reading, and let the writer look back at all of them.',
        'At each word it writes, the writer scores how relevant each source word is right now, turns those scores into weights that add up to one, and takes a weighted blend. It looks where it needs to look.',
        'And it made the machine legible. You can draw the attention weights and see the model looking at the French word for cat while it writes cat. That was 2015, and it was the beginning of the end for reading one word at a time.',
      ],
      done: 'Do not squeeze, look back. Four words, and the lighthouse is built out of them.',
    },
    'classic-nlp-tasks': {
      hook: 'Everything on this stall is second hand and everything on it works. That is my whole business. Why would you build one?',
      teach: [
        'Before you train anything, know what already exists, because most language jobs are old jobs with old solutions that are extremely good.',
        'Classification, is this review happy or cross. Named entity recognition, which words are people and places. Question answering, find the answer inside this passage. Summarisation. Translation. All solved, all downloadable.',
        'Hugging Face pipelines make each of those about three lines. Say the task, say the model, hand it a string. That is the entire code.',
        'The judgement is in the choosing. A small model that runs on your own laptop will beat a large one you cannot afford to call a million times, and it keeps your data at home.',
        'So the real skill here is not building. It is knowing the name of the task you have got, so you can find out that somebody already did it in 2019.',
      ],
      done: 'Second hand and it works. Take it. No, take it, I have four more.',
    },

    /* ---- Part 5: the lighthouse ----------------------------------------- */
    'self-attention': {
      hook: 'Climb up. Mind the rail. Now watch the lamp turn. In one sweep it lights every rock in the bay, and it does not need to visit them one at a time.',
      teach: [
        'Self attention is that sweep. Every word looks at every other word in the sentence, all at once, and decides who matters to it.',
        'Each word makes three things out of itself. A query, which is what am I looking for. A key, which is what I can offer. And a value, which is what I actually hand over if you pick me.',
        'To find out how much word A should care about word B, you take A’s query and B’s key and do a dot product. The same little sum from the Compass Rock. Big means relevant.',
        'Then you divide by the square root of the size, which sounds fussy and is not. Without it the numbers grow large, the softmax goes to a spike, and the gradients die. Then softmax turns the scores into weights that add to one, and you take that blend of the values.',
        'And because there is no walking along the sentence, there is nothing to do in order. The whole thing is one matrix multiplication, which a graphics card eats for breakfast. That is the actual reason large language models exist. Not cleverness. Parallelism.',
      ],
      done: 'Query, key, value. Dot, scale, softmax, blend. Say it walking down the stairs and you will have it by the bottom.',
    },
    'transformer-architecture': {
      hook: 'The stair is the interesting part of a lighthouse, not the lamp. It is the same step, over and over, and it gets you all the way up.',
      teach: [
        'A transformer block is only two ideas, and then that block is stacked.',
        'First, multi head attention. You do not do one sweep, you do several at the same time, each with its own smaller set of queries and keys. One head follows grammar, another tracks who is being talked about, another watches the punctuation. Then their findings are joined back together.',
        'Second, a small ordinary network applied to each position by itself, which is where a lot of the model’s actual knowledge is kept.',
        'Around both of those you wrap two pieces of plumbing. A residual connection, which adds the input back onto the output so the original signal always has a clear road through, and layer normalisation, which keeps the numbers at a sane scale.',
        'And one more thing, because attention has no sense of order at all. Shuffle the words and it gives the same answer. So the position of each word is added into it at the start. Without that, the machine cannot tell the dog bit the man from the man bit the dog.',
      ],
      done: 'Stack that block ninety six times and you have something that can hold a conversation. It really is that repetitive.',
    },
    'bert-vs-gpt': {
      hook: 'Two windows. One faces the whole bay, and one faces only the way you came. You use different windows for different jobs.',
      teach: [
        'Same block, two ways of letting it look, and they became two families.',
        'B E R T looks both ways. Every word sees the words before it and after it. It is trained by hiding words and making the model guess them from both sides.',
        'That makes it excellent at understanding a piece of text you already have. Sorting it, tagging it, finding the answer inside it, turning the whole thing into one arrow for search. It cannot write, because it was never made to continue anything.',
        'G P T looks only backwards. Each word may see what came before and nothing after, and it is trained on the plainest task there is. Guess the next token. Forever.',
        'That mask is the whole difference. It means the same model can generate, because it never needs to see the future. Understanding a fixed text, reach for the encoder. Producing text, or doing almost anything by being asked nicely, reach for the decoder.',
      ],
      done: 'Both windows are still useful. People forget the first one because the second one got famous.',
    },
    'minigpt-code': {
      hook: 'I nicked this off the lighthouse keeper. I cannot read a word of it, but it is thin and it looks expensive, so it is probably worth something.',
      teach: [
        'You can write a working language model in about three hundred lines, and doing it once removes the mystery permanently.',
        'It is six pieces. A token embedding table, a position embedding table, a stack of blocks, a final normalisation, and a last layer that turns the numbers back into a score for every token in the vocabulary.',
        'The one piece that must be exactly right is the mask. Inside attention you blank out every position ahead of the current one before the softmax, so that a word can never see its own answer. Get that wrong and your loss looks wonderful and your model is worthless.',
        'Training is the loop you already know. Take a chunk of text, ask it to predict the same chunk shifted along by one, measure cross entropy, step downhill.',
        'And generating is a loop too. Feed in what you have, take the scores for the next token, pick one, stick it on the end, and go round again.',
        'The difference between that notebook and a model that costs a hundred million pounds is data, size and patience. Not ideas. You will have all the ideas by the time you finish this page.',
      ],
      done: 'Take it. Go on. I only steal things that look important, and this one turned out to be important in a way I cannot spend.',
    },

    /* ---- Part 6: the yard ----------------------------------------------- */
    'llm-pretraining': {
      hook: 'Eleven years on this hull. People ask when it will fly. That is not the interesting question. The interesting question is how much timber it needs before it can.',
      teach: [
        'Pretraining is the enormous first stage. One task, guess the next token, over a truly vast amount of text, and everything the model knows about the world arrives as a side effect of getting good at that.',
        'The data work is most of the job and nobody writes about it. Removing duplicates matters more than almost anything else, because a paragraph that appears a thousand times gets memorised instead of learned, and it quietly poisons your evaluation if it also sits in your test set.',
        'The scaling laws are the useful part. Loss falls smoothly and predictably as you add parameters, data and compute, which means you can measure two small runs and forecast the big one before you spend the money.',
        'And the correction that changed the field. Everybody was building models far too large for the amount of text they were fed. For a fixed budget, a smaller model trained on much more data wins. That is why a good seven billion model today embarrasses a hundred and seventy five billion model from a few years ago.',
        'One model does not fit on one card, so the work is split. Copies of the model on many cards each taking different data. Or the layers themselves cut up and dealt out across machines. Mostly both at once.',
      ],
      done: 'Timber, patience, and knowing the shape of the curve before you start cutting. It is shipbuilding.',
    },
    'finetuning-lora': {
      hook: 'I am not making you a new coat. I am taking in the one you have. It is a perfectly good coat and it took somebody a year.',
      teach: [
        'Fine tuning is that. Somebody already spent millions teaching a model to speak. You are only teaching it your particular job.',
        'Supervised fine tuning is the plain version. A few thousand examples of the input and the answer you wanted, and a little more training. That is often all anybody needs.',
        'But updating every number in a seven billion parameter model needs more memory than most people have, and it gives you a whole new copy of the model per job.',
        'So there is a much nicer way. Freeze the original entirely, and beside each big weight matrix put two very small ones whose product is the adjustment. Train only those. That is L o R A, and it can be under one percent of the numbers.',
        'Which means your fine tune is a few megabytes instead of many gigabytes, you can keep a dozen of them for a dozen jobs, and swap them on the same base model like sleeves. Q L o R A goes further and squashes the frozen base to four bits, so the whole thing fits on one ordinary card.',
      ],
      done: 'Taken in at the shoulders, and nobody will know it was not made for you. Off you go.',
    },
    'rlhf-alignment': {
      hook: 'You came anyway. Everybody else goes around the pond. Sit down, if you can bear it, and I will tell you the coldest true thing in this course.',
      teach: [
        'A model trained only to guess the next token is not trying to help you. It is trying to continue the text. Those are not the same, and the gap between them is where I live.',
        'So after pretraining they teach it what people prefer. Show two answers to a person, ask which is better. Do that many thousands of times.',
        'Then train a second model whose only job is to predict that judgement, and use it as a score. Now the language model can be improved against a reward without a human reading every attempt.',
        'That is reinforcement learning from human feedback. It is fiddly, it needs three models at once, and it can go wrong in a particular way. The model finds answers the reward model loves and people do not. It games the judge.',
        'D P O is the newer, quieter method. It skips the reward model and trains directly on the pairs, pushing up the preferred answer and pushing down the other. Far less machinery, usually just as good.',
        'And none of it makes a model honest. It makes it agreeable. Remember which one you are getting.',
      ],
      done: 'You may go. I am not going to thank you. But you did not run, and I noticed that.',
    },
    'inference-sampling': {
      hook: 'I am leaving in the morning. Not because anything is wrong. Because the road only shows you the next bit, and you choose again at every fork.',
      teach: [
        'Generation is that. At each step the model gives you a score for every possible next token, and something has to choose one.',
        'Always take the highest and you get flat, repetitive text that walks in circles. Temperature is the dial. Low is cautious and predictable, high is adventurous and eventually nonsense.',
        'Top p is the better habit. Keep only the most likely tokens that together make up, say, ninety percent of the probability, and choose among those. When the model is certain, that is two or three words. When it is genuinely unsure, it is fifty. The dial adjusts itself.',
        'Now the speed of it. Generating a hundred tokens without help means re running the whole sentence a hundred times. So the model keeps the keys and values it already computed, and reuses them. That is the K V cache, and it is the difference between usable and useless.',
        'And quantization. The weights are stored in fewer bits, eight or four instead of sixteen. The model gets several times smaller and faster and loses very little. It is why a decent model runs on your own machine at all.',
      ],
      done: 'Choose again at every fork, and do not always choose the most likely thing. It is true of text and it is true of the rest of it.',
    },
    'using-models-apis': {
      hook: 'Buying, my friend, is a skill. Anybody can want things. Knowing what a thing is worth, that is rare, and I am extremely good at it.',
      teach: [
        'There are three ways to run a model and the choice is money and privacy, not cleverness.',
        'An A P I is somebody else’s machine. Best models, nothing to install, you pay per token and your text leaves the building. Open weights on your own hardware is free per call, private, and yours to fine tune, and you pay for it in setup and in the card. And a local runner like Ollama sits in the middle, which is where most people should start.',
        'Now the part people get wrong. They reach for the largest model for everything. Most of what an application does is easy. Sorting, extracting, rewriting. A small cheap model does that perfectly at a fraction of the cost and a fraction of the wait.',
        'So build a ladder. The small model does the ordinary work, and only the genuinely hard requests are passed up. That one decision routinely saves ninety percent of the bill.',
        'And write your code against an interface, not a company. Model names change every few months. If swapping providers means rewriting your application, you have bought a cage.',
      ],
      done: 'Pleasure doing business. Come back when you know what you want, that is when the good prices happen.',
    },

    /* ---- Part 7: the island --------------------------------------------- */
    'embeddings-rag': {
      hook: 'Nine thousand specimens, every one labelled, every one findable in under a minute. People call it a hobby. It is an index.',
      teach: [
        'A model knows what was in its training text and nothing else. Not your documents, not last week, and when it does not know it will often invent something rather than stop.',
        'Retrieval augmented generation fixes that without any training at all. Before answering, go and find the relevant pages, and put them in front of the model with the question.',
        'The finding is done with embeddings. Cut your documents into chunks, turn each chunk into an arrow, and store the arrows. A question becomes an arrow too, and the nearest chunks by cosine are the ones worth reading.',
        'A vector database is only a shelf built for that one question, nearest neighbours in a very large space, answered fast and approximately rather than slowly and perfectly.',
        'Where it goes wrong is nearly always the chunking. Too small and a chunk has no context and means nothing. Too large and the real sentence is buried in noise. Overlap them a little so a thought is never cut in half.',
        'And search on meaning misses exact things. Part numbers, names, error codes. So the good systems do both, keyword and vector, and combine the results. That is hybrid search, and it is not a compromise, it is simply better.',
      ],
      done: 'Nine thousand specimens. Ask me for the pale blue one from the north ridge. Go on. Twelve seconds. Every time.',
    },
    'agents-from-scratch': {
      hook: 'Watch them go by. All night, every night, and not one of them has ever decided anything. They only drift where the weather puts them.',
      teach: [
        'An agent is the opposite of that, and it is much less mysterious than the word suggests. It is a loop with tools.',
        'The model thinks about what to do. It picks a tool and says what to give it. Your code, not the model, actually runs the tool. The result comes back, and round it goes until the job is done.',
        'That is the whole pattern, and it is called react. Reason, act, observe, repeat. Everything else is decoration on those four words.',
        'A tool is just a function with a description the model can read. The description is the part that matters. A vague description gets a vague call, and most agent failures are documentation failures.',
        'And you must build the fence yourself. A maximum number of steps, so it cannot spin forever. Nothing destructive without a check. And never, ever hand the model’s output straight to something that executes it.',
        'Write it against a plain interface and you can change which model is thinking without touching the loop. Do that. The models will keep changing.',
      ],
      done: 'They are still going. They will still be going in the morning. That is the difference between motion and purpose.',
    },
    'langchain-langgraph': {
      hook: 'I built the bridges. Every one is a joint between two things that were not going to meet otherwise. That is the entire trade.',
      teach: [
        'LangChain is the box of joints. Model wrappers, prompt templates, document loaders, splitters, vector store adapters, and a great many tool integrations already written.',
        'It is worth it for the loaders and the integrations. It is not worth hiding your prompts behind three layers of abstraction, and plenty of people have regretted that.',
        'LangGraph is the more interesting one, and it came from a real problem. Chains go in a straight line. Real work loops back. Try, check, fail, try differently.',
        'So you describe your application as a graph. Nodes do things, edges say what happens next, and an edge is allowed to point backwards. Shared state travels through, and every node can read and write it.',
        'That gives you the things a straight chain cannot. Loops with a condition to stop, branching on what actually happened, a place to pause for a human to approve, and the ability to resume from a saved state instead of starting again.',
        'Use the small pieces, keep your own control flow. That is the honest advice about every framework in this bazaar.',
      ],
      done: 'A joint between two things. Nothing more. Do not let anybody sell you a bridge as though it were the river.',
    },
    'multi-framework-agents': {
      hook: 'Boxes! Every box a different company, every company says theirs is the only box. I have opened all of them. Would you like to know what is inside?',
      teach: [
        'The same loop is inside all of them. Learn the loop, and every framework becomes an afternoon.',
        'Google’s A D K is the tidy corporate one, strong on typed tools and deployment. CrewAI gives each agent a role and lets a small team divide the work, which reads beautifully and can be hard to debug.',
        'Autogen is built around agents talking to each other in a conversation. And the code first ones, like the smaller agent libraries, keep the loop visible and ask you to write more yourself, which is often what you actually want.',
        'The thing that matters more than any of them is M C P, the model context protocol. It is a standard way to describe a tool so that any model can use it.',
        'Before it, every tool had to be re written for every framework. After it, you write the tool server once and everything can call it. That is not a fashion. That is plumbing, and plumbing outlives fashion.',
        'So choose by what you are building, not by what is trending. Prototype fast, one clever loop, a team with roles, or full control. Four different answers.',
      ],
      done: 'Take the M C P one. No, really, take it. It is the only box in the bazaar that will still be here next year.',
    },
    'agent-memory-eval-safety': {
      hook: 'I have made a list of everything that could go wrong. It runs to nine pages. I would like to read you the important ones, because nobody else will.',
      teach: [
        'An agent with no memory is a stranger every morning. So you give it three kinds, and they are not the same thing.',
        'Short term is the conversation in the window, and windows fill. Long term is facts saved somewhere and fetched when relevant, which is retrieval again. And episodic is a record of what it tried before, so it stops repeating the same failed attempt.',
        'Evaluating an agent is harder than evaluating a model, because the final answer can be right by luck. So you score the path as well. Did it choose the correct tool? Did it call it properly? How many steps? What did it cost?',
        'Now the dangerous one. Prompt injection. Your agent reads a web page, and the page contains an instruction, and the agent cannot tell the difference between the page and you. Everything it reads is a possible attacker.',
        'So you never trust retrieved text as instruction. You give the agent the smallest permissions that let it work, not the ones that are convenient. Anything irreversible waits for a human. And you keep a log of every tool call, because you cannot investigate what you did not record.',
        'It is not pessimism. It is the same care you would take with a very fast, very literal assistant who has never once been suspicious of anybody.',
      ],
      done: 'Nine pages. You have had five of them. I shall save the rest for when you are building something that matters.',
    },

    /* ---- Part 8: the winter --------------------------------------------- */
    'ml-system-design': {
      hook: 'In here, please, and speak up. The ballroom has an echo and an echo is useful. It tells you when you are mumbling, which is the commonest fault in these conversations.',
      teach: [
        'A system design interview is not a quiz. It is a rehearsal of a real meeting, and the thing being examined is how you think out loud.',
        'Never start designing. Start narrowing. How many users, how fast must it answer, what does success actually mean in numbers, what is the budget. A candidate who asks those four questions has already outperformed most of the room.',
        'Then say the shape before the detail. Where does the data come from, what is computed in advance and what at the moment of asking, what is stored, what is served, what is watched afterwards.',
        'For anything with a language model in it, they are listening for particular decisions. Retrieval before fine tuning, because retrieval is cheaper and updates instantly. A small model for the easy traffic. A cache. A cost per request you have actually estimated out loud.',
        'And always finish with what happens when it goes wrong. What you monitor, how you know the world has drifted away from your training data, and how you roll back. Saying that unprompted is the strongest signal there is.',
        'State your assumptions, give the numbers, name the trade off, and choose. Then stop talking and let them push.',
      ],
      done: 'Better. The echo has stopped arguing with you. That means you have found your voice, and you may need it sooner than you think.',
    },
    '@groke': {
      hook: 'You have walked the whole valley. Sit in the circle. I will ask you anything, from anywhere, and there is no order to it and no warning.',
      teach: [
        'This is not a lesson. It is the cold part.',
        'Everything you learned, you learned somewhere pleasant, next to somebody who liked you. That is how it should be learned. But it is not how it will be asked.',
        'So here it is asked coldly, out of order, with nothing to remind you which region you are in. If you still know it here, you know it.',
        'Stay as long as you like. Leave whenever you like. I will be here either way.',
      ],
      done: 'You are still sitting here. Most people do not. The pond has thawed a little, which has not happened before.',
    },
  },
};
