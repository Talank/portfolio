/* One Piece Episodes — Blind 75 (+ roadmap-filler) problems retold as fully
   original short scenes: character dialogue, an animated prop board, and
   sound cues. All writing, character portraits (data/characters.js) and
   audio (js/audio-engine.js) are original work made for this site — no
   copyrighted OST, voice clips, or fan art are embedded anywhere.
   Consumed by js/episode-engine.js on episode.html. */

(function () {
  'use strict';

  const E = {};

  E['two-sum'] = {
    id: 'two-sum',
    epNumber: 1,
    title: 'The Twin-Chest Riddle',
    patternId: 'hashing-patterns',
    leetcode: { name: 'Two Sum', number: 1, difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
    problem: 'Given a list of numbers and a target value, return the indices of the two numbers that add up to the target exactly. Assume exactly one valid pair exists, and the same element can\'t be used twice.',
    example: 'nums = [3, 2, 4], target = 6  →  answer: [1, 2]  (2 + 4 = 6)',

    // Prop board: three treasure chests, laid out left to right.
    h: 210,
    props: [
      { id: 'c0', emoji: '🧰', label: '300k', x: 22, y: 40 },
      { id: 'c1', emoji: '🧰', label: '200k', x: 50, y: 40 },
      { id: 'c2', emoji: '🧰', label: '400k', x: 78, y: 40 }
    ],
    ledger: [
      { id: 'L0', x: 22, y: 78 },
      { id: 'L1', x: 50, y: 78 },
      { id: 'L2', x: 78, y: 78 }
    ],

    steps: [
      {
        speaker: 'luffy', pos: 'left',
        line: "The merchant wants exactly 600,000 Berries for the map piece — not a coin more, not a coin less — and he only accepts TWO chests at once!",
        sfx: null
      },
      {
        speaker: 'nami', pos: 'right',
        line: "There are only three chests here, so we could just try every pair by hand... but that gets ugly fast if there are hundreds of them.",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Then let's not check every pair. I'll remember every chest we've already opened — and for each new one, I only need to ask: 'have I already seen the amount that completes it?'",
        sfx: null
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Chest one: 300,000. I need 300,000 more to reach the target — nothing in my notes yet. I'll log it and move on.",
        p: { c0: 'lit', L0: 'lit' }, l: { L0: '300k seen' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Chest two: 200,000. I need 400,000 more — still nothing logged that matches. Log this one too.",
        p: { c0: 'dim', c1: 'lit', L1: 'lit' }, l: { L1: '200k seen' },
        sfx: 'chime'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "Chest three: 400,000. I need 200,000 more to complete it — and that's already in my notes, from chest two!",
        p: { c1: 'lit', c2: 'lit' },
        sfx: 'gong'
      },
      {
        speaker: 'nami', pos: 'right',
        line: "Chest two and chest three — 200,000 plus 400,000 is exactly 600,000. That's the pair.",
        p: { c1: 'good', c2: 'good', L1: 'good' },
        sfx: 'victory'
      },
      {
        speaker: 'luffy', pos: 'left',
        line: "SHISHISHI! And you never even touched chest one again! Meat time!",
        sfx: 'pop'
      },
      {
        speaker: 'robin', pos: 'right',
        line: "That's the whole trick: check the notes before you write anything new down, and you only ever look at each chest once. One pass, one pair — never re-comparing chests against each other directly.",
        sfx: null
      }
    ],

    complexity: 'Time: O(n) — a single pass, one hash-map lookup and one insert per chest. Space: O(n) for the ledger (hash map) in the worst case.',
    pitfall: 'Log the current chest AFTER checking for its complement, not before — otherwise a target that is exactly double one value (e.g. target=6, chest=3) would incorrectly pair a chest with itself.',
    solution: `def two_sum(nums, target):
    seen = {}  # value -> index, i.e. "chests already opened"
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i  # log AFTER checking, so a chest never pairs with itself
    return []`
  };

  window.EPISODES = E;
})();
