window.LESSONS = window.LESSONS || {};
window.LESSONS['strings-equals-hashcode'] = {
  id: 'strings-equals-hashcode',
  title: 'Strings, Immutability & the equals/hashCode Contract',
  category: 'Part 1 — Core Java',
  timeMin: 55,
  summary: 'The pair of topics that quietly underpins every collection you will ever use: how String\'s immutability enables the string pool, safe sharing, and safe hash keys — and the equals/hashCode contract that decides whether your own objects behave correctly as map keys and set members. Plus == versus equals (the single most common Java bug), why overriding one without the other silently breaks HashMap, StringBuilder for efficient mutation, and how all of this connects forward to the collections in Part 3 and the semantic search in LogPose.',
  goals: [
    'Explain why String is immutable and what that buys — the pool, thread-safety, safe sharing, and safe hash keys',
    'Never confuse == (reference identity) with equals (logical equality) again, and predict which the Integer/String pools make surprising',
    'State the equals/hashCode contract in full and implement both correctly and together for a value class',
    'Predict exactly what breaks when you override equals but not hashCode, and demonstrate the lost-in-a-HashMap bug',
    'Use StringBuilder for accumulation, and know why + in a loop is the classic performance trap'
  ],
  concept: [
    {
      h: 'String is immutable — and that is a feature, not a limitation',
      p: [
        'A <code>String</code>\'s characters can never change after construction. Every method that seems to mutate — <code>toUpperCase()</code>, <code>strip()</code>, <code>replace()</code>, <code>substring()</code>, <code>concat()</code> — returns a BRAND-NEW String and leaves the original untouched. <code>s.toUpperCase();</code> on its own line does nothing useful: you must capture the return, <code>s = s.toUpperCase();</code>. This trips up nearly every beginner once, and the fix is to internalise that String objects are frozen the moment they exist.',
        'Immutability is a deliberate design choice that pays off four ways. <b>The string pool:</b> because a literal can never change, the JVM keeps a single shared pool of literal Strings — every <code>"logpose"</code> in your source points at the SAME object, saving memory (this is also why literal comparison with == sometimes "works" and lulls you into a bug, below). <b>Thread-safety for free:</b> an object that never changes can be shared across threads with zero synchronization — a property Part 5 will make you grateful for. <b>Safe sharing:</b> you can hand a String to any method without defensively copying it, because the callee cannot alter it behind your back (contrast the leaked-mutable-reference bug from the encapsulation lesson — with String there is nothing to leak). <b>Safe hash keys:</b> a hash-based collection assumes a key\'s hash never changes while it\'s stored; an immutable String guarantees exactly that, which is why String is the ideal, ubiquitous map key. <code>final</code> on the class seals it — nobody can subclass String to sneak in mutability — tying back to the inheritance lesson\'s "String is final" note.'
      ]
    },
    {
      h: '== versus equals: identity versus equality',
      p: [
        'This is the single most common Java bug, and the mental model from the types lesson resolves it exactly. <code>==</code> compares the two REFERENCES — are these the same object, the same chest? <code>equals()</code> compares the CONTENTS — do these two objects mean the same thing? For objects you almost always want <code>equals</code>: <code>"logpose".equals(userInput)</code> asks "same text?", while <code>"logpose" == userInput</code> asks "same object in memory?" — usually false even when the text matches, because <code>userInput</code> built at runtime is a different object from the pooled literal.',
        'The pools make this treacherous by sometimes making <code>==</code> accidentally succeed. Two identical String LITERALS share a pooled object, so <code>"hi" == "hi"</code> is true — but <code>"hi" == new String("hi")</code> is false (the <code>new</code> forces a distinct object), and <code>"hi" == someRuntimeBuiltString</code> is false. The Integer cache from the types lesson is the exact same trap: <code>Integer a = 127, b = 127; a == b</code> is true (cached), but at 128 it\'s false. The lesson is absolute: <b>compare object contents with <code>equals</code>, never <code>==</code></b> — reserve <code>==</code> for primitives and for deliberate identity checks (including <code>== null</code>, the one case you MUST use it). Modern defensive habit: call <code>equals</code> on the thing that can\'t be null — <code>"logpose".equals(input)</code> or <code>Objects.equals(a, b)</code> — so a null input yields false instead of an NPE.'
      ]
    },
    {
      h: 'The equals/hashCode contract',
      p: [
        'Every object inherits <code>equals</code> and <code>hashCode</code> from <code>Object</code>, where the defaults compare by IDENTITY (equals is ==, hashCode derives from the address). That\'s wrong for VALUE objects — two <code>LogEntry</code>s with identical fields should be "equal" — so you override <code>equals</code>. But <code>equals</code> and <code>hashCode</code> are bound by a CONTRACT you must honour together, or hash-based collections silently misbehave:',
        '<div class="math">1. reflexive: x.equals(x) is true<br>2. symmetric: x.equals(y) ⇔ y.equals(x)<br>3. transitive: x.equals(y) &amp; y.equals(z) ⇒ x.equals(z)<br>4. consistent: repeated calls give the same result (no random/mutable-field basis)<br>5. x.equals(null) is false<span class="mnote">and the linking clause that binds the two methods:</span></div>',
        'The clause that ties them: <b>if two objects are equal by <code>equals</code>, they MUST have the same <code>hashCode</code>.</b> (The reverse is not required — unequal objects MAY share a hashCode; that\'s just a collision, which HashMap handles.) The reason is mechanical: a HashMap finds a key by first jumping to the BUCKET its hashCode points to, THEN checking equals within that bucket. If two equal objects report different hashCodes, they land in different buckets, and the map looks in the wrong one — your key is stored but unfindable. Hence the iron rule: <b>override <code>equals</code> and <code>hashCode</code> together, always, using the SAME fields in both.</b>'
      ]
    },
    {
      h: 'Implementing them right — and StringBuilder for the mutation you actually need',
      p: [
        'A correct <code>equals</code> checks identity first (fast path), rejects null and wrong types, then compares the fields that define logical equality; the matching <code>hashCode</code> combines those SAME fields — <code>Objects.hash(field1, field2)</code> is the one-line idiom, and <code>Objects.equals(a, b)</code> null-safely compares each field. Even better, when the class is a pure carrier of values, a <b>record</b> (Part 4) generates a correct equals, hashCode, and toString for you from the components — but you must understand the hand-written version to know what the record is doing and to handle the cases records don\'t cover. Choose the fields deliberately: they should be the ones that define identity for your domain (usually not every field — a cached or derived field shouldn\'t participate), and ideally immutable, because a field that changes while the object sits in a HashSet changes its hashCode and loses it exactly like the mismatch bug.',
        'Finally, when you genuinely need to build a string piece by piece — a loop assembling a report — do NOT use <code>+</code> repeatedly. Because String is immutable, <code>result = result + piece</code> in a loop allocates a whole new String every iteration, copying all prior characters each time: O(n²) work and a heap full of garbage. <b>StringBuilder</b> is the mutable companion: <code>append()</code> into one growable buffer, <code>toString()</code> once at the end — O(n), the idiom for any accumulation. (The compiler optimizes a single <code>a + b + c</code> expression into a StringBuilder for you; it\'s the LOOP that defeats it.) This is the same immutable-value / mutable-builder split you\'ll see again with the collections API, and it closes the loop on why immutability is a feature you design AROUND, not against.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'A poneglyph never changes — and that is its whole power',
      text: 'The poneglyphs of One Piece are indestructible stone blocks carved with the true history, and their defining property is the entire point: what is written on them can NEVER be altered. Not by the World Government, not by time, not by anyone — immutable by design. And look at everything that flows FROM that immutability, because it maps exactly onto String. Because a poneglyph can\'t change, copies of the same inscription are perfectly interchangeable — you can reference "the Rio Poneglyph text" as one shared truth without worrying that reading it here changes it there (the string pool: identical literals share one frozen object). Because it can\'t change, Robin can carry its meaning to allies without any fear that they\'ll tamper with what she "handed" them — the knowledge is safe to share, no defensive copy needed (immutable objects pass safely between methods and threads). And here\'s the equals-vs-== beat, which the story tells beautifully: there are TWO copies of a critical poneglyph — a Road Poneglyph on one island and its rubbing on Robin\'s parchment. Ask "are these the SAME physical stone?" (==) and the answer is no — different objects, different islands. Ask "do they SAY the same thing?" (equals) and the answer is yes — identical content, which is the only thing that matters for reading the map. Confuse the two questions and you sail to the wrong island. Now the equals/hashCode contract, in Grand Line terms: the Log Pose — the crew\'s navigation device the whole app is named for — files each island by its magnetic "fingerprint". The contract is: two islands the crew considers the SAME destination must produce the SAME magnetic reading, or the Log Pose files them in different drawers and can never navigate back to one it already recorded. Give two "equal" islands different fingerprints and your destination is stored yet permanently unreachable — logged, but lost. That is precisely the override-equals-but-not-hashCode bug: the entry exists in the map and the map looks in the wrong drawer forever. And when the crew needs to ASSEMBLE something new and changing — a running battle log, appended blow by blow — they don\'t re-carve a fresh poneglyph each line (immutable, ruinously wasteful); they use a growable log book, writing entry after entry into one volume. Poneglyph for the frozen truth; log book for the accumulating draft. String and StringBuilder.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s two questions: "the same" versus "the same"',
      text: 'Sheldon Cooper is the human embodiment of the ==-versus-equals distinction, and one storyline makes it unforgettable. His treasured, mint-condition first-edition comic — call it the pooled literal — is a specific physical object, and Sheldon is fanatical about identity: when a duplicate copy of the exact same issue exists, Sheldon will tell you at length that they are NOT "the same comic" (== is false: two different objects) even though they are indisputably "the same issue" (equals is true: identical content). He needs both concepts and never conflates them — which is more than most engineers manage. The immutability beat is pure Sheldon too: his comics live in mylar bags, sealed, unchangeable, precisely BECAUSE their value depends on never being altered — an immutable asset you can display, share the sight of, even lend the READING of, without any fear the content changes. Alter it and it\'s ruined; freeze it and it\'s safe to share. The equals/hashCode contract has a perfect Sheldon analogue in his obsessive filing: Sheldon organizes his comics into long boxes by a strict rule, and the rule that makes retrieval possible is that two comics he considers "the same category" MUST be filed in the same box. If he ever judged two issues equal but filed them by different rules into different boxes, he could own a comic and be structurally unable to find it — present in the collection, lost to the index. That is the override-equals-without-hashCode bug wearing a Green Lantern t-shirt: the object is in the HashMap, but the map computes the wrong box and searches there forever. And the string-vs-StringBuilder lesson? Watch Sheldon write his "Fun with Flags" episodes: he doesn\'t re-transcribe the entire script from scratch each time he adds a line (immutable String, recopying everything every time — even Sheldon\'s patience has limits); he keeps a working document and appends. When the thing is DONE and must never change — the aired, canonical version — it\'s frozen. Draft in a builder; freeze the final. Sheldon files, freezes, and appends by exactly the rules the JVM does.',
    },
    why: 'A poneglyph (and Sheldon\'s sealed comic) is immutable by design, and everything good flows from that: identical copies share safely (the string pool), the content passes between hands without tampering (safe sharing, thread-safety), and it makes a stable key. "Same physical stone?" is == (identity); "says the same thing?" is equals (content) — confuse them and you sail to the wrong island. The Log Pose files islands by fingerprint: two islands judged equal MUST share a fingerprint or the destination is stored-but-unreachable — exactly the override-equals-without-hashCode bug. And to assemble something changing (a running battle log, Sheldon\'s script) you append into a log book (StringBuilder), not re-carve a poneglyph each line.'
  },
  storyAnim: {
    title: 'Identity vs equality, and the key that gets lost',
    h: 300,
    props: [
      { id: 'stone', emoji: '🪨', label: 'poneglyph: immutable — content frozen forever', x: 14, y: 12 },
      { id: 'pool', emoji: '♻️', label: 'identical inscriptions share one copy (pool)', x: 50, y: 12 },
      { id: 'rubbing', emoji: '📜', label: 'Robin\'s rubbing: different object…', x: 82, y: 12 },
      { id: 'same', emoji: '🟰', label: '…but equals: SAME text', x: 30, y: 46 },
      { id: 'notsame', emoji: '❌', label: '== : NOT the same stone', x: 66, y: 46 },
      { id: 'logpose', emoji: '🧭', label: 'Log Pose files islands by fingerprint (hashCode)', x: 24, y: 80 },
      { id: 'lost', emoji: '🫥', label: 'equal islands, different fingerprints → LOST', x: 68, y: 80 }
    ],
    actors: [
      { id: 'robin', emoji: '🕵️‍♀️', label: 'Robin', x: 14, y: 30 }
    ],
    steps: [
      { c: 'A poneglyph is immutable — its carving can never change. That single property is the source of everything else.', p: { stone: 'lit' } },
      { c: 'Because it can\'t change, identical inscriptions are safely shared as one copy — the string pool: every "logpose" literal points at the same frozen object.', p: { pool: 'good' } },
      { c: 'Robin takes a rubbing. It is a DIFFERENT physical object from the stone on the island…', p: { rubbing: 'good' }, a: { robin: [50, 30] } },
      { c: '…yet ask "does it SAY the same thing?" — equals — and the answer is yes. Content matches. For reading the map, that\'s all that matters.', p: { same: 'good' } },
      { c: 'Ask instead "is it the SAME physical stone?" — == — and the answer is no. Confuse these two questions and you sail to the wrong island.', p: { notsame: 'bad' } },
      { c: 'The Log Pose files each island by a magnetic fingerprint — a hashCode. To navigate back, it jumps to the fingerprint\'s drawer, THEN checks the island.', p: { logpose: 'lit' } },
      { c: 'The contract: two islands judged the SAME destination must share a fingerprint. Give equal islands different fingerprints and the destination is filed in the wrong drawer — stored, yet permanently unreachable. Override equals, you MUST override hashCode.', p: { lost: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'Looking up a key in a HashMap — where equals and hashCode both fire',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'The put',
        nodes: [
          { id: 'hashput', text: 'map.put(key, v)\ncompute key.hashCode()' },
          { id: 'bucket', text: 'pick bucket from hash\nstore key+value there' }
        ]
      },
      {
        label: 'The get',
        nodes: [
          { id: 'hashget', text: 'map.get(lookup)\ncompute lookup.hashCode()' },
          { id: 'jump', text: 'jump to THAT bucket\n(hash decides which)' },
          { id: 'eq', text: 'within the bucket:\nequals() to find the match' }
        ]
      },
      {
        label: 'The bug',
        nodes: [
          { id: 'mismatch', text: 'equals overridden,\nhashCode NOT' },
          { id: 'lost', text: 'wrong bucket searched\nkey stored but unfindable' }
        ]
      },
      {
        label: 'The fix',
        nodes: [
          { id: 'together', text: 'override BOTH,\nsame fields in each' },
          { id: 'immutable', text: 'key fields immutable\nhash never drifts' }
        ]
      }
    ],
    steps: [
      { active: ['hashput'], note: 'put starts by computing the key\'s hashCode — a fast integer fingerprint that decides where the entry lives.' },
      { active: ['bucket'], note: 'The hash selects a bucket; the key and value are stored there. Storage location is entirely hash-driven — this is why the hash must be stable.' },
      { active: ['hashget'], note: 'get computes the LOOKUP key\'s hashCode the same way. For the lookup to work, an equal key MUST produce the same hash it did at put time.' },
      { active: ['jump'], note: 'The map jumps straight to the bucket that hash points to — O(1), not a scan of every entry. The hash is the whole reason lookup is fast.' },
      { active: ['eq'], note: 'Within that one bucket (which may hold a few colliding keys), the map uses equals() to find the exact match. So BOTH methods fire: hashCode to locate the bucket, equals to confirm the key.' },
      { active: ['mismatch'], note: 'Now the bug: you overrode equals (so two value-equal keys ARE equal) but left the default identity-based hashCode. The two equal keys now report DIFFERENT hashes.' },
      { active: ['lost'], note: 'At get time, the lookup key hashes to a different bucket than the stored key did — the map searches the wrong bucket, finds nothing, and returns null. The key is in the map, provably, yet unfindable. Stored but lost — the Log Pose filing to the wrong drawer.' },
      { active: ['together'], note: 'The fix is the iron rule: override equals and hashCode TOGETHER, deriving both from the SAME fields, so equal objects always share a bucket. Objects.hash(...) and Objects.equals(...) make it a two-line job.' },
      { active: ['immutable'], note: 'And choose immutable fields for the key: a field that changes while the key sits in the map changes its hash, and the key is lost exactly as before. This is why immutable Strings are the perfect map key.' }
    ]
  },
  tech: [
    {
      q: 'Why is String immutable, and what concrete benefits fall out of it?',
      a: 'Immutability is a deliberate design decision, and at least four major benefits fall out of it. (1) The string pool / interning: because a literal can never change, the JVM safely maintains ONE shared instance per distinct literal — every "logpose" in your codebase is the same object, saving substantial memory in string-heavy programs, and String.intern() lets you opt runtime strings into the pool. This is only sound because the shared object can never be mutated out from under another holder. (2) Thread-safety for free: an immutable object has no writable state, so it can be shared across any number of threads with zero synchronization and zero risk of a data race — a property that becomes precious in Part 5 and is why so many concurrent designs lean on immutable value objects. (3) Safe sharing / no defensive copies: you can pass a String into any method, store it in any field, return it from any getter, without the defensive copying the encapsulation lesson required for mutable fields — nothing the callee does can alter your String, so the leaked-mutable-reference bug simply cannot occur. (4) Safe, stable hash keys: hash-based collections require that a stored key\'s hashCode never changes; an immutable String guarantees this, and as a bonus String CACHES its hashCode after first computation (a private field), making repeated map lookups by String key extremely cheap. There\'s also a security dimension: because Strings are used pervasively for file paths, URLs, and class names, immutability prevents a caller from passing a validated String and then mutating it after the check but before use (a time-of-check-to-time-of-use attack). The cost is that transformations allocate new objects, which is exactly why StringBuilder exists for accumulation — but the trade is heavily favourable, and the class being final seals it so no subclass can reintroduce mutability.'
    },
    {
      q: 'Explain == vs equals precisely, and why the String and Integer pools make == a trap.',
      a: '== on reference types compares the two REFERENCES — do both variables point at the same object in memory (the same chest, in the types-lesson model)? equals() is a method that compares whatever the class defines as logical equality — for String and the wrappers, that\'s the actual value/content. For value comparison you almost always want equals; == on objects asks an identity question you rarely mean. The pools make == treacherous by making it ACCIDENTALLY true sometimes, which teaches the wrong lesson. String literals are interned into the pool, so "hi" == "hi" is true (one shared object) — but "hi" == new String("hi") is false, because new forces a distinct object outside the pool, and "hi" == someStringBuiltAtRuntime (from input, concatenation of variables, etc.) is false because it\'s a different object with the same content. The Integer cache is the identical trap in the wrapper world: the JVM caches Integer objects for -128..127, so Integer a = 100, b = 100; a == b is true, but at 200 it\'s false — same code, different answer, dictated purely by an implementation cache. The lesson is unconditional: compare object contents with equals, never ==. Reserve == for primitives (where it correctly compares values) and for genuine identity checks — and note the ONE case where you MUST use ==: comparing against null (x == null), because you can\'t call a method on null. A robust defensive habit is to invoke equals on a value that can\'t be null — "logpose".equals(input) or Objects.equals(a, b) — so a null operand yields false instead of a NullPointerException. Interviewers love this because it exposes whether you understand the reference model or just memorized "use equals for strings".'
    },
    {
      q: 'State the equals/hashCode contract in full, and prove exactly what breaks if you violate the linking clause.',
      a: 'equals must be: reflexive (x.equals(x) is true), symmetric (x.equals(y) iff y.equals(x)), transitive (x.equals(y) and y.equals(z) implies x.equals(z)), consistent (repeated calls return the same result, so equals must not depend on random or mutable-in-a-way-that-matters state), and x.equals(null) must be false. hashCode must be: consistent (same object, same hash across calls within a run), and — the LINKING clause that binds the two — if x.equals(y) then x.hashCode() == y.hashCode(). The reverse is explicitly NOT required: unequal objects may share a hashCode (a collision), which is fine and expected. The proof of what breaks lives in how HashMap works. A HashMap stores each entry in a bucket chosen by the key\'s hashCode, and finds a key in two steps: (1) compute the key\'s hashCode and jump to that bucket — O(1), the whole point of a hash map; (2) within that bucket, walk the (usually short) chain calling equals to find the exact key. Now violate the linking clause by overriding equals but leaving Object\'s default identity-based hashCode: two objects that are equal() now return DIFFERENT hashCodes. At put time, key K1 lands in bucket A. At get time, an equal key K2 computes a different hash and the map jumps to bucket B, walks bucket B\'s chain (K1 isn\'t there), finds nothing, and returns null. K1 is provably IN the map — iterate and you\'ll see it — but get and containsKey can never find it: stored but unreachable. HashSet (backed by a HashMap) breaks the same way — add a "duplicate" and it isn\'t recognized as a duplicate because it hashes elsewhere, so the set silently holds two "equal" elements. This is why the iron rule is to override BOTH together using the SAME fields: equal objects then always produce equal hashes and land in the same bucket. (Violating symmetry or transitivity causes subtler bugs — e.g. an asymmetric equals between a class and a subclass makes map behavior depend on argument order — which is why the canonical equals uses getClass() equality or a careful instanceof, and why records, which generate a correct equals/hashCode from components, are the safest default for value types.)'
    },
    {
      q: 'Show me the correct way to implement equals and hashCode, and where records fit.',
      a: 'The canonical hand-written pair for a value class with fields that define identity: equals starts with a fast identity check (if (this == o) return true;), then rejects null and wrong types (if (o == null || getClass() != o.getClass()) return false; — getClass equality keeps it symmetric across subclasses; some code uses instanceof deliberately when subclasses should be equal to the base, but getClass is the safe default), then casts and compares the identity-defining fields with Objects.equals for each (null-safe): return Objects.equals(title, that.title) && kind == that.kind;. hashCode must combine the SAME fields, and Objects.hash(title, kind) is the one-line idiom (it null-safely folds them into one int; for hot paths you can hand-roll the 31*result + fieldHash form to avoid the varargs array, but Objects.hash is fine almost everywhere). The three disciplines that make it correct: (1) use the SAME fields in both methods — the set of fields that defines logical identity, which is often NOT every field (exclude caches, derived values, and fields irrelevant to identity); (2) make those fields immutable, because a field that changes while the object sits in a HashSet/HashMap changes its hashCode and loses it just like a contract violation — so mutable objects are dangerous as keys; (3) if you override equals, override hashCode, always, together. Where records fit: since Java 16, a record — record LogKey(String title, Kind kind) {} — AUTO-GENERATES a correct equals, hashCode, and toString from its components, exactly following the contract, plus a canonical constructor and accessors. For pure immutable value carriers (which is precisely what you want as map keys), a record is the best default: less code, no chance of forgetting hashCode, guaranteed-correct contract. You still must understand the hand-written version, though — to know what the record generates, to customize equality when a record\'s all-components default isn\'t what you want, and because plenty of existing/framework classes are hand-written. Rule of thumb: reach for a record for value types; hand-write only when you need equality semantics the record\'s default doesn\'t give you.'
    }
  ],
  code: {
    title: 'A value key for LogPose — equals, hashCode, and why it must be right',
    intro: 'LogPose will key deduplicated entries and search results by a small value object. Getting equals/hashCode right is the difference between a working map and one that silently loses keys. Here it is hand-written (to see the contract) with a record shown as the modern equivalent.',
    code: `import java.util.*;

// A value key: two keys are "the same entry" iff title (case-insensitive) AND kind match.
final class EntryKey {                     // final: identity semantics shouldn't be subclassed
    private final String title;            // immutable fields — hash can never drift
    private final String kind;

    EntryKey(String title, String kind) {
        this.title = title.strip().toLowerCase();   // normalize so "Flaky" and "flaky" are equal
        this.kind = kind;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                     // fast path: same object
        if (o == null || getClass() != o.getClass())    // reject null and wrong type (symmetric)
            return false;
        EntryKey that = (EntryKey) o;
        return Objects.equals(title, that.title)        // SAME fields as hashCode, null-safe
            && Objects.equals(kind, that.kind);
    }

    @Override
    public int hashCode() {
        return Objects.hash(title, kind);               // SAME fields as equals — the linking clause
    }

    @Override
    public String toString() { return kind + ":" + title; }
}

// The modern equivalent — a record generates equals/hashCode/toString for you, correctly:
//   record EntryKey(String title, String kind) {}
// (you'd add a compact constructor to normalize title; the contract is handled automatically)

public class KeyDemo {
    public static void main(String[] args) {
        Map<EntryKey, Integer> minutesByEntry = new HashMap<>();

        EntryKey k1 = new EntryKey("Flaky-test triage", "experiment");
        minutesByEntry.put(k1, 90);

        // A DIFFERENT object, same logical identity (note the different casing/spacing):
        EntryKey k2 = new EntryKey("  flaky-test triage ", "experiment");

        System.out.println(k1 == k2);            // false — different objects (identity)
        System.out.println(k1.equals(k2));       // true  — same content (equality)
        System.out.println(minutesByEntry.get(k2)); // 90 — FOUND, because hashCode matches too

        // Prove the map treats them as one key:
        minutesByEntry.merge(k2, 30, Integer::sum);
        System.out.println(minutesByEntry.get(k1)); // 120 — same bucket, same key

        // StringBuilder for accumulation — NOT + in a loop:
        StringBuilder report = new StringBuilder();
        for (var e : minutesByEntry.entrySet())
            report.append(e.getKey()).append(" = ").append(e.getValue()).append('\\n');
        System.out.print(report);                 // built in O(n), one buffer
    }
}`,
    notes: [
      'k1 == k2 is false but k1.equals(k2) is true — identity vs equality, the poneglyph and its rubbing. The map cares about equality (plus a matching hash), so k2 finds k1\'s entry.',
      'hashCode uses the exact same fields as equals (title, kind). Delete the hashCode override and k2 would hash to a different bucket — get(k2) would return null even though the key is "in" the map. Stored but lost.',
      'The fields are normalized and immutable, so the hash is stable for the object\'s whole life. The record on the commented line does all of this equals/hashCode work automatically — the preferred modern form for value keys.'
    ]
  },
  lab: {
    title: 'Build a correct value key — and watch the broken one lose data',
    prompt: 'Feel the bug, then fix it. Write a class <code>Tag</code> with one immutable field <code>String name</code> (normalize to lowercase in the constructor). (1) Override <code>equals</code> correctly: identity fast-path, null/type check with <code>getClass()</code>, then compare <code>name</code> with <code>Objects.equals</code>. (2) Override <code>hashCode</code> using the SAME field via <code>Objects.hash(name)</code>. (3) In a comment, answer: if you delete ONLY the hashCode override, what does <code>new HashSet&lt;Tag&gt;()</code> do when you add <code>new Tag("Flaky")</code> and <code>new Tag("flaky")</code> — one element or two, and why? Use <code>Objects</code> from <code>java.util</code>.',
    starter: `import java.util.Objects;

final class Tag {
    private final String name;

    Tag(String name) {
        this.name = name.strip().toLowerCase();   // immutable, normalized
    }

    // 1) override equals: this==o fast path; null/getClass check; Objects.equals(name,...)

    // 2) override hashCode: Objects.hash(name) — SAME field as equals
}

// Q: delete ONLY hashCode — adding Tag("Flaky") and Tag("flaky") to a HashSet gives how many
//    elements, and why?
// ANSWER:`,
    checks: [
      { re: 'public\\s+boolean\\s+equals\\s*\\(\\s*Object\\s+\\w+\\s*\\)', must: true, hint: 'Override equals with the exact signature: public boolean equals(Object o).', pass: 'equals signature ✓' },
      { re: 'this\\s*==\\s*\\w+', must: true, hint: 'Start equals with the identity fast-path: if (this == o) return true;', pass: 'identity fast-path ✓' },
      { re: 'getClass\\s*\\(\\s*\\)\\s*!=', must: true, hint: 'Reject wrong types with getClass() != o.getClass() (keeps equals symmetric).', pass: 'type check ✓' },
      { re: 'Objects\\.equals\\s*\\(', must: true, hint: 'Compare the name field null-safely with Objects.equals(name, that.name).', pass: 'null-safe field compare ✓' },
      { re: 'public\\s+int\\s+hashCode\\s*\\(\\s*\\)', must: true, hint: 'Override hashCode: public int hashCode().', pass: 'hashCode signature ✓' },
      { re: 'Objects\\.hash\\s*\\(\\s*name\\s*\\)', must: true, hint: 'hashCode must use the SAME field as equals: Objects.hash(name).', pass: 'hashCode uses same field ✓' },
      { re: 'ANSWER\\s*:\\s*(2|two)\\b', flags: 'i', must: true, hint: 'Without hashCode, the two equal tags hash to different buckets, so the set never sees them as duplicates — TWO elements.', pass: 'correct: two elements ✓' }
    ],
    run: 'put Tag and a main into <code>Tag.java</code>; <code>javac Tag.java &amp;&amp; java Tag</code>. First run it WITH hashCode and add both tags to a HashSet — size 1. Then comment out hashCode and rerun — size 2, the same "equal" tag stored twice. That is the bug, live.',
    solution: `import java.util.Objects;

final class Tag {
    private final String name;

    Tag(String name) {
        this.name = name.strip().toLowerCase();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tag tag = (Tag) o;
        return Objects.equals(name, tag.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);      // SAME field as equals — honors the linking clause
    }
}

// ANSWER: TWO elements. equals() says the tags are equal, but with the default identity-based
// hashCode they produce DIFFERENT hashes, so HashSet puts them in different buckets and never
// compares them with equals at all. It never notices they're "the same", so both are stored.
// (With hashCode overridden: same bucket, equals fires, duplicate rejected — size 1.)`,
    notes: [
      'The two-element answer is the whole point: HashSet checks for duplicates by hash FIRST, equals SECOND. Wrong hash means the equal check never even runs, so equality is invisible to the set.',
      'name is final and normalized in the constructor, so the hash is stable for the object\'s life — a mutable key field would drift its hash and lose the key just like a missing override.',
      'A record — record Tag(String name) {} with a compact constructor to normalize — would generate both methods correctly and make this bug impossible. Hand-writing it once is how you understand what the record does for you.'
    ]
  },
  quiz: [
    {
      q: 'What does s.toUpperCase(); on its own line (return value ignored) accomplish?',
      options: ['Nothing useful — String is immutable, so toUpperCase returns a NEW string and leaves s unchanged; you must write s = s.toUpperCase()', 'It converts s to uppercase in place', 'It throws an exception because String can\'t be modified', 'It uppercases s only if s is a literal'],
      correct: 0,
      explain: 'Every "mutating" String method returns a new object and leaves the original frozen — the poneglyph never changes. Discarding the return value discards the only result. Capture it: s = s.toUpperCase().'
    },
    {
      q: 'String a = new String("hi"); "hi" == a evaluates to?',
      options: ['false — new forces a distinct object, so the two references differ even though the content matches; use "hi".equals(a) to compare content', 'true — identical text always means ==', 'true — String pooling makes all "hi" the same object', 'It throws a NullPointerException'],
      correct: 0,
      explain: '== asks "same object?" (identity); the literal is pooled but new String("hi") is a separate object, so ==  is false. equals asks "same content?" — that\'s what you want. The rubbing and the stone say the same thing but aren\'t the same stone.'
    },
    {
      q: 'You override equals on a class but NOT hashCode, then use instances as HashMap keys. What happens?',
      options: ['Keys become unfindable — two equal keys can produce different default hashCodes, so get() looks in the wrong bucket and returns null even though the key is stored', 'It works fine — hashCode is optional when equals is defined', 'The code won\'t compile', 'Every lookup returns the first entry regardless of key'],
      correct: 0,
      explain: 'HashMap locates by hashCode first, then confirms with equals. Break the linking clause (equal objects, different hashes) and equal keys scatter to different buckets — stored but lost, the Log Pose filing to the wrong drawer. Override both, together, same fields.'
    },
    {
      q: 'Which is the linking clause of the equals/hashCode contract?',
      options: ['If two objects are equal by equals, they MUST have the same hashCode (the reverse — equal hashes implying equality — is NOT required)', 'If two objects have the same hashCode, they must be equal', 'equals and hashCode must both return the same type', 'hashCode must always return a unique value per object'],
      correct: 0,
      explain: 'Equal ⇒ same hash (mandatory, so equal keys share a bucket). Same hash ⇒ equal is NOT required — that\'s just a collision, which HashMap handles by checking equals within the bucket. Unique hashes are impossible anyway (finite int range).'
    },
    {
      q: 'You\'re assembling a large report string in a loop. Why prefer StringBuilder over result = result + piece?',
      options: ['Because String is immutable, + in a loop allocates a new String and copies all prior characters every iteration — O(n²) and heaps of garbage; StringBuilder appends into one buffer for O(n)', 'StringBuilder produces prettier output formatting', '+ doesn\'t work inside loops at all', 'They\'re identical — the compiler always optimizes both the same way'],
      correct: 0,
      explain: 'Immutability makes each += rebuild the whole string — quadratic. StringBuilder is the mutable companion: append into one growable buffer, toString once. (The compiler DOES optimize a single a+b+c expression, but not the loop — that\'s the trap.) Draft in the log book; freeze the poneglyph.'
    }
  ],
  testFlow: {
    title: 'Test yourself: identity, equality, and keys under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A user types "logpose" at runtime into a variable input. You check "logpose" == input and it\'s false, even though the text matches. Why, and what should you have written?',
        choices: [
          { text: 'input is a distinct runtime-built object, not the pooled literal, so == (identity) is false; compare content with "logpose".equals(input)', to: 'q1_right' },
          { text: 'The strings actually differ in content — recheck the input for hidden characters', to: 'q1_wrong_content' },
          { text: '== is broken for Strings and should never be used at all, even for null', to: 'q1_wrong_never' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Exactly — the literal is pooled, the runtime string is a separate object, so == (same object?) is false while equals (same content?) is true. Always compare String content with equals; put the literal first so a null input yields false, not an NPE.', next: 'q2' },
      q1_wrong_content: { end: true, correct: false, text: 'The content matches — that\'s the whole point of the trap. The failure is that == compares object IDENTITY, and a runtime-built string is a different object from the pooled literal. Use equals for content.', retry: 'q1' },
      q1_wrong_never: { end: true, correct: false, text: 'Overcorrection: == is wrong for comparing String CONTENT, but it\'s exactly right — and required — for the null check (input == null), since you can\'t call equals on null. Reserve == for identity and null; use equals for content.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You add two objects you consider equal to a HashSet, but its size is 2. Most likely cause?',
        choices: [
          { text: 'equals is overridden but hashCode is not (or they use different fields) — the equal objects hash to different buckets, so the set never compares them and never sees the duplicate', to: 'q2_right' },
          { text: 'HashSet always allows duplicates; you wanted a List', to: 'q2_wrong_list' },
          { text: 'The objects are immutable, which prevents deduplication', to: 'q2_wrong_immutable' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Classic broken contract: HashSet dedupes by hash FIRST, equals SECOND. Different hashes mean the equal check never even runs, so the "duplicate" slips in. Fix: override hashCode alongside equals using the same fields.', next: 'q3' },
      q2_wrong_list: { end: true, correct: false, text: 'HashSet does reject duplicates — when equals AND hashCode agree. The size-2 symptom is the signature of a broken contract (equals without a matching hashCode), not of the set\'s design. Sheldon\'s two "same" comics filed in different boxes.', retry: 'q2' },
      q2_wrong_immutable: { end: true, correct: false, text: 'Backwards — immutability HELPS keys (stable hash). Immutable fields are exactly what you want. The deduplication failure is a missing/mismatched hashCode, letting equal objects scatter to different buckets.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'You store an object in a HashMap as a key, then mutate one of the fields that its hashCode is computed from. What happens?',
        choices: [
          { text: 'The key becomes unfindable — its hashCode changed, so it now hashes to a different bucket than where it\'s stored; get() looks in the new bucket and misses. The key is "lost" inside the map', to: 'q3_right' },
          { text: 'The map automatically re-buckets the key on mutation', to: 'q3_wrong_auto' },
          { text: 'Nothing — hashCode is computed once at insertion and cached forever', to: 'q3_wrong_cached' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'This is why key fields must be immutable: the entry sits physically in the OLD bucket, but the mutated key now hashes to a DIFFERENT bucket, so lookups search the wrong place and miss. Same lost-key failure as a broken contract, triggered by mutation. Immutable Strings never do this — a core reason they\'re the ideal key.', next: null },
      q3_wrong_auto: { end: true, correct: false, text: 'HashMap does NOT watch its keys for mutation — it has no way to know a field changed. The entry stays in its original bucket while the key\'s hash moves elsewhere, and the key is lost. Never mutate a field that participates in a stored key\'s hashCode.', retry: 'q3' },
      q3_wrong_cached: { end: true, correct: false, text: 'HashMap doesn\'t cache the key\'s hash in a way that saves you here — get() recomputes the LOOKUP key\'s hashCode, and if the stored key\'s fields changed, an "equal" lookup now yields a different bucket. (String caches ITS OWN hash, but String is immutable so it never changes.) Keep key fields immutable.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Ignoring the return value of a String method — s.strip(); does nothing; you must write s = s.strip(). Every String transformation returns a new object and leaves the original frozen.',
    'Comparing String (or wrapper) content with == instead of equals — accidentally "works" for pooled literals and cached small Integers, then fails for runtime-built values. Use equals for content; reserve == for primitives, identity, and null.',
    'Overriding equals without hashCode (or using different fields in each) — equal objects scatter to different HashMap/HashSet buckets and become unfindable or un-deduplicated. Override both, together, from the same fields.',
    'Using mutable fields in equals/hashCode and then mutating them while the object is a key — the hash drifts and the key is lost inside the map. Base identity on immutable fields; prefer immutable keys.',
    'Building strings with + in a loop — O(n²) allocation and copying because each += rebuilds the whole immutable string. Use StringBuilder.append and one toString at the end.',
    'Forgetting the null and type checks in equals — an equals that NPEs on null or throws ClassCastException on a foreign type violates the contract (x.equals(null) must be false). Guard with o == null || getClass() != o.getClass(), or use instanceof deliberately.'
  ],
  interview: [
    {
      q: 'Why is String immutable in Java, and what does immutability enable?',
      a: 'Immutability is a deliberate design choice with several payoffs. First, the string pool: because a literal can never change, the JVM safely shares one interned instance per distinct literal, saving memory in string-heavy programs — sound only because no holder can mutate the shared object. Second, thread-safety for free: with no writable state, a String can be shared across threads with no synchronization and no data-race risk, which is why immutable value objects are a cornerstone of concurrent design. Third, safe sharing without defensive copies: you can pass, store, and return a String freely because callees can\'t alter it, eliminating the leaked-mutable-reference class of bug. Fourth, safe and efficient hash keys: hash collections require a stored key\'s hashCode to stay constant, and immutability guarantees that — plus String caches its hashCode after first computation, making repeated lookups cheap; this is why String is the ubiquitous map key. There\'s also security: Strings pervade file paths, URLs, class names, and DB queries, and immutability blocks time-of-check-to-time-of-use attacks where a caller validates a String then mutates it before use. The cost is that transformations allocate new objects — which is precisely why StringBuilder exists for accumulation — but the trade strongly favours immutability, and the class being final prevents any subclass from reintroducing mutation. It\'s a textbook case of immutability making an object simpler, safer, and more shareable at once.'
    },
    {
      q: 'What\'s the difference between == and equals, and why does the string pool make this a classic bug?',
      a: '== on reference types compares REFERENCES — whether both variables point at the exact same object — while equals() compares whatever the class defines as logical equality, which for String and the wrappers is the actual content. For value comparison you want equals; == asks an identity question you rarely mean for objects. The string pool makes == a classic bug by making it ACCIDENTALLY succeed and teaching the wrong habit: identical literals are interned to one shared object, so "hi" == "hi" is true — but "hi" == new String("hi") is false (new forces a distinct object) and "hi" == aRuntimeBuiltString is false (different object, same content). The Integer cache is the same trap for wrappers: Integer values -128..127 are cached, so Integer a = 100, b = 100; a == b is true, but at 200 it\'s false — identical code, different result, purely because of a caching implementation detail. So developers write == for strings, see it work in a test with literals, and ship a bug that surfaces only with runtime-built values. The rule is unconditional: compare object content with equals, never ==. Reserve == for primitives (correct value comparison there), for deliberate identity checks, and for the one mandatory case — comparing against null (x == null), since you can\'t invoke a method on null. Defensive idiom: call equals on the operand that can\'t be null — "literal".equals(x) or Objects.equals(a, b) — so a null operand returns false instead of throwing. Getting this right signals you understand Java\'s reference model rather than having memorized "use equals for strings".'
    },
    {
      q: 'Explain the equals/hashCode contract and what breaks if you violate it.',
      a: 'equals must be reflexive, symmetric, transitive, consistent, and false for null; hashCode must be consistent across calls, and the LINKING clause binds them: if two objects are equal by equals, they must have the same hashCode (the converse isn\'t required — unequal objects may collide on a hash, which is fine). The consequences of violating it are concrete and live in how HashMap/HashSet work: they locate an entry by computing the key\'s hashCode to pick a bucket (O(1)), then use equals within that bucket to confirm the exact key. If you override equals but leave the default identity-based hashCode, two equal keys produce different hashes: at put the key lands in bucket A, at get the equal lookup key hashes to bucket B, the map searches B, doesn\'t find it, and returns null — the key is provably in the map (you can iterate to it) but get and containsKey can\'t find it. HashSet breaks symmetrically: a logical duplicate hashes elsewhere, is never compared with equals, and gets stored twice, so your "set" holds duplicates. Violating symmetry or transitivity causes subtler, order-dependent bugs (a common one is an asymmetric equals between a base class and subclass, making results depend on which object is the receiver). And a live-mutation variant: if equals/hashCode are based on mutable fields and you mutate one while the object is a stored key, its hash drifts and the key is lost in the map exactly as in a static violation. The defenses: override equals and hashCode TOGETHER using the SAME identity-defining fields; make those fields immutable; use Objects.equals and Objects.hash to get null-safety and correctness cheaply; and for pure value types prefer a record, which auto-generates a contract-correct equals/hashCode/toString from its components and makes the whole class of bug impossible.'
    },
    {
      q: 'When would you use StringBuilder over String concatenation, and what about thread-safety?',
      a: 'Use StringBuilder whenever you\'re accumulating a string across multiple steps — especially in a loop. Because String is immutable, result = result + piece inside a loop allocates a brand-new String and copies all previously-accumulated characters on every iteration, giving O(n²) time and a heap full of intermediate garbage; StringBuilder maintains one growable char buffer, append() mutates it in place, and a single toString() at the end materializes the result, giving O(n). Important nuance for interviews: the compiler ALREADY optimizes a single concatenation EXPRESSION like a + b + c into StringBuilder operations (or, in modern JDKs, an invokedynamic-based string-concat that\'s at least as good), so you don\'t need StringBuilder for one-line concatenations — it\'s specifically the LOOP, where the compiler can\'t fuse the repeated appends, that demands it. On thread-safety: StringBuilder is NOT synchronized (fast, and correct for the overwhelmingly common single-threaded building case); StringBuffer is its older synchronized twin, thread-safe but slower due to locking on every method. The guidance is to default to StringBuilder and only reach for StringBuffer if a single builder instance is genuinely shared and mutated across threads — which is rare and usually a design smell (you\'d more often build per-thread and combine, or use a concurrent structure). So: StringBuilder for accumulation, plain + for simple expressions the compiler handles, and StringBuffer essentially never in new code. It\'s the same immutable-value / mutable-builder split that recurs throughout Java — freeze the final value, mutate a dedicated builder to construct it.'
    }
  ]
};
