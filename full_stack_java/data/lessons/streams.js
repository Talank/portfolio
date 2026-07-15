window.LESSONS = window.LESSONS || {};
window.LESSONS['streams'] = {
  id: 'streams',
  title: 'The Stream API: map/filter/reduce, Collectors & Optional',
  category: 'Part 4 — Modern Java',
  timeMin: 55,
  summary: 'The previous lesson gave you Function, Predicate, Consumer, and Supplier as inline building blocks. Streams are the pipeline that plugs those blocks together: a declarative, chainable way to say WHAT transformation you want over a collection instead of writing the loop that does it. You will see how a stream pipeline is built from a source, zero or more lazy intermediate operations (map, filter, sorted, distinct), and exactly one eager terminal operation that actually runs the pipeline; the Collectors that gather results back into lists, maps, and grouped structures; and Optional, the type streams use instead of null to say "there might not be a result here." This is the idiomatic, modern way to process the ArrayLists and HashMaps from Part 3.',
  goals: [
    'Explain the lazy/eager split — intermediate operations build a pipeline description, only the terminal operation runs it — and why nothing happens until then',
    'Chain map/filter/sorted/distinct/limit correctly, in an order that avoids doing unnecessary work',
    'Use reduce and the built-in terminal operations (count, anyMatch, min/max, forEach) to fold a stream down to a single result',
    'Use Collectors.toList/toMap/groupingBy/joining to gather stream results back into the collections from Part 3',
    'Use Optional to represent "may be absent" without null, and know when NOT to reach for a stream at all'
  ],
  concept: [
    {
      h: 'A pipeline, not a loop: source, lazy intermediate ops, one eager terminal op',
      p: [
        'A stream pipeline has three parts. A <b>source</b> — <code>list.stream()</code>, <code>Arrays.stream(array)</code>, <code>Stream.of(...)</code> — wraps an existing collection or set of values without copying it. Zero or more <b>intermediate operations</b> — <code>.filter(Predicate)</code>, <code>.map(Function)</code>, <code>.sorted()</code>, <code>.distinct()</code>, <code>.limit(n)</code> — each return a NEW stream and are <b>lazy</b>: calling <code>.filter(...)</code> does not loop over anything or evaluate the predicate yet, it just records "when this pipeline eventually runs, apply this step here." Exactly one <b>terminal operation</b> — <code>.collect(...)</code>, <code>.forEach(...)</code>, <code>.count()</code>, <code>.reduce(...)</code>, <code>.anyMatch(...)</code> — is <b>eager</b>: calling it is what actually pulls elements through the entire chain of recorded steps, one element at a time, and produces the final result (a collection, a number, a boolean, nothing).',
        'The laziness has a real, testable consequence: <code>list.stream().filter(x -> { System.out.println("checking " + x); return x > 0; });</code> — with no terminal operation — prints NOTHING at all, because the pipeline was described but never run. Add <code>.count()</code> at the end and the println statements appear, one per element, as the terminal operation finally pulls elements through. This "nothing happens until the terminal op" model also means a pipeline is a ONE-SHOT description: once a terminal operation consumes a stream, that stream object is spent — calling another terminal operation on the same stream throws <code>IllegalStateException</code>. You build a fresh stream (<code>list.stream()</code> again) for each pipeline you want to run.'
      ]
    },
    {
      h: 'The core intermediate operations: map, filter, sorted, distinct, limit',
      p: [
        '<code>.filter(Predicate&lt;T&gt;)</code> keeps only elements the predicate returns true for — built directly on the Predicate interface from the lambdas lesson. <code>.map(Function&lt;T,R&gt;)</code> transforms each element into something else, potentially a different type entirely — built directly on Function; <code>entries.stream().map(LogEntry::title)</code> turns a <code>Stream&lt;LogEntry&gt;</code> into a <code>Stream&lt;String&gt;</code>. <code>.sorted()</code> (natural ordering, requiring <code>Comparable</code>) or <code>.sorted(Comparator&lt;T&gt;)</code> reorders the stream — internally it must buffer ALL elements before it can emit the first one, unlike filter/map which are element-at-a-time. <code>.distinct()</code> removes duplicates using <code>equals</code>/<code>hashCode</code> (Part 1\'s contract, paying rent again) — also a buffering operation, since it must remember everything it has already seen. <code>.limit(n)</code> truncates to the first n elements, and — crucially — can make an otherwise-buffering pipeline SHORT-CIRCUIT: <code>infiniteStream.filter(...).limit(5)</code> stops pulling elements the moment 5 have passed the filter, never evaluating the rest.',
        'ORDER MATTERS for performance, not just correctness: <code>.filter(cheapCheck).map(expensiveTransform)</code> only pays the expensive transform for elements that survived the cheap filter, while <code>.map(expensiveTransform).filter(cheapCheck)</code> pays the expensive cost for EVERY element, including ones the filter will immediately discard. The general rule — filter early to shrink the working set, do expensive transforms late, and reach for <code>.limit(n)</code> as soon as you know you only need the first few results — mirrors ordinary loop-writing intuition, but streams make the reordering trivially easy since each step is just a chained method call.'
      ]
    },
    {
      h: 'Terminal operations: collapsing the stream to a result',
      p: [
        'Every pipeline ends in exactly one terminal operation. <code>.forEach(Consumer&lt;T&gt;)</code> runs a side effect per element and returns nothing — useful for printing/logging, but if you find yourself building a list inside a forEach\'s lambda, that\'s a sign you want <code>.collect(...)</code> instead (see next section). <code>.count()</code> returns how many elements survived the pipeline. <code>.anyMatch(Predicate)</code>/<code>.allMatch(Predicate)</code>/<code>.noneMatch(Predicate)</code> answer a yes/no question and SHORT-CIRCUIT — <code>anyMatch</code> stops at the first true, exactly like <code>||</code> short-circuits. <code>.min(Comparator)</code>/<code>.max(Comparator)</code> return an <code>Optional&lt;T&gt;</code> (see below — the stream might be empty, so there might be no min/max). <code>.findFirst()</code>/<code>.findAny()</code> also return an <code>Optional&lt;T&gt;</code> and short-circuit the moment a match is found.',
        '<code>.reduce(...)</code> is the general-purpose "combine everything into one value" operation, and understanding it clarifies what most of the other terminal operations are secretly doing underneath. The two-argument form, <code>reduce(identity, BinaryOperator&lt;T&gt;)</code>, starts with an identity value and repeatedly combines it with each stream element: <code>numbers.stream().reduce(0, (a, b) -> a + b)</code> sums them (identity 0, since <code>0 + x == x</code>); <code>strings.stream().reduce("", (a, b) -> a + b)</code> concatenates them. The identity must be a true identity for the combining operation (0 for addition, 1 for multiplication, "" for concatenation, an empty list for merging lists) so that reducing an EMPTY stream correctly returns the identity itself, not an error. You will rarely reach for raw reduce in practice — count, sum-via-Collectors, min/max, and the Collectors below cover the common cases more readably — but reduce is the operation those are all specializations of, and interviewers use it to check you understand fold/reduce as a concept, not just as a library call.'
      ]
    },
    {
      h: 'Collectors: gathering a stream back into the collections from Part 3',
      p: [
        'A stream is a transient PIPELINE, not a collection you can store or index into — sooner or later you need the result back as an actual <code>List</code>, <code>Map</code>, or <code>String</code>, and that\'s what <code>.collect(Collector)</code> with a <code>Collectors</code> factory method does. <code>Collectors.toList()</code> gathers into a <code>List</code> (an ArrayList in practice, though that\'s an implementation detail, not a contract — declare the RESULT as <code>List</code>, not <code>ArrayList</code>, per the collections lesson). <code>Collectors.toSet()</code> gathers into a <code>Set</code> (a HashSet in practice — no order guarantee, per the sets lesson). <code>Collectors.toMap(keyFn, valueFn)</code> builds a <code>Map</code> from two functions extracting the key and value from each element — and THROWS <code>IllegalStateException</code> on a duplicate key by default, so you often need the 3-argument overload with a merge function: <code>Collectors.toMap(LogEntry::tag, LogEntry::title, (a, b) -> a + "; " + b)</code> to say what happens when two elements produce the same key. <code>Collectors.joining(", ")</code> concatenates a <code>Stream&lt;String&gt;</code> into one delimited <code>String</code>, optionally with a prefix and suffix too: <code>joining(", ", "[", "]")</code>.',
        'The single most useful Collector for real reporting code is <code>Collectors.groupingBy(classifierFn)</code>, which partitions a stream into a <code>Map&lt;K, List&lt;T&gt;&gt;</code> keyed by whatever the classifier function returns — <code>entries.stream().collect(Collectors.groupingBy(LogEntry::tag))</code> gives you a map from each tag to the list of entries with that tag, in one line, replacing what would otherwise be a manual loop with <code>computeIfAbsent</code> (the maps lesson\'s idiom). A downstream Collector as a second argument changes what\'s collected per group instead of the full list — <code>groupingBy(LogEntry::tag, Collectors.counting())</code> gives a <code>Map&lt;String, Long&gt;</code> of counts per tag instead of the full entries. This single family of collectors — toList, toMap, groupingBy, joining — covers the large majority of "turn processed data back into a usable structure" needs.'
      ]
    },
    {
      h: 'Optional: streams\' answer to "there might be nothing here" — and when NOT to use a stream at all',
      p: [
        'Operations that might legitimately have no answer — <code>.findFirst()</code> on a stream that might be empty, <code>.max()</code> on a stream that might have no elements, <code>Map.get(missingKey)</code> in newer style — return <code>Optional&lt;T&gt;</code> instead of <code>null</code>. An <code>Optional</code> is a small wrapper that is either PRESENT (holding a value) or EMPTY, and its whole design goal is to force you to acknowledge the possibly-missing case at compile time rather than risk a <code>NullPointerException</code> at runtime. <code>optional.isPresent()</code>/<code>.isEmpty()</code> check which case you have; <code>.get()</code> extracts the value but THROWS if empty (rarely the right tool — it just relocates the null-check problem); <code>.orElse(default)</code> supplies a fallback value; <code>.orElseGet(Supplier)</code> supplies a LAZILY-computed fallback (only invoked if actually empty — useful when computing the default is expensive); <code>.orElseThrow(...)</code> throws a specific exception instead of the generic one; and <code>.map(Function)</code>/<code>.filter(Predicate)</code> let you chain transformations that only run if a value is present, propagating emptiness automatically — <code>findEntry(id).map(LogEntry::title).orElse("(not found)")</code> reads as one clean sentence instead of a null-check pyramid.',
        'The judgment call this lesson also owes you: NOT every loop should become a stream. Streams shine for a linear pipeline of transform/filter/collect over a collection — the moment you need to break out of a loop early with complex conditions, mutate multiple external variables per iteration, or the logic genuinely reads clearer as an imperative loop with an index, forcing it into a stream chain just to "look modern" makes it harder to read and debug, not easier. A useful rule of thumb: if you can describe the operation in one English sentence using words like "for each," "where," "transformed into," and "collected into," it\'s probably a good stream candidate; if the description needs "and also, meanwhile, unless" branching state, write the loop.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The dock conveyor: nothing moves until the last worker calls for it',
      text: 'Water 7\'s shipyard has a LONG CONVEYOR BELT of stations, and the dock foreman explains its one governing rule to every new hand: stations only ACTIVATE when the LAST station in line finally calls "send it through." A crate goes on the belt (the SOURCE — a stream wrapping a collection). Along the way sit stations that each transform or filter a crate as it passes — a "reject anything not seaworthy" station (filter), a "convert raw hull planks into finished plating" station (map), a "sort by size" station (sorted), a "no duplicate serial numbers" station (distinct) — but NONE of them lift a finger until called. Franky can walk the whole belt, wiring up ten stations end to end, and as long as nobody\'s standing at the FINAL station calling for output, the belt sits completely still — lazy, described but not run. Only when someone at the very end shouts an actual demand — "give me a count," "hand me every finished crate," "is there EVEN ONE seaworthy hull in this batch" — does the belt actually start moving, pulling one crate at a time through every station in order (a terminal operation: eager, and the only thing that runs the pipeline). And once a batch has been pulled through and consumed, that same belt run is DONE — you don\'t get to call for output twice from the same run; Franky has to load a fresh batch and describe the stations again. When Nami needs everything folded down to ONE number — "what\'s the total value of this batch?" — she starts with a baseline of zero and has each station ADD its crate\'s value to a running total as it passes (reduce: identity plus combining operation) — and when Robin needs the crates sorted back into labeled bins by island of origin, she doesn\'t re-walk the belt herself; she tells Franky "group them" and a bin-per-island structure appears, fully organized, in one instruction (Collectors.groupingBy). And when someone asks "which crate is the log pose reading for right now" and there might genuinely be NO reading yet, Nami doesn\'t hand back an empty hand pretending it\'s a real answer — she hands back a clearly labeled EMPTY BOX, distinct from a box holding a reading, so nobody mistakes "nothing yet" for "here\'s your answer" (Optional: an explicit, checkable "maybe nothing" instead of a silent null).',
    },
    sitcom: {
      show: 'Friends',
      title: 'The kitchen assembly line that only runs when someone orders',
      text: 'Monica\'s restaurant kitchen runs a strict rule during prep: stations along the LINE don\'t touch an ingredient until an actual ORDER comes in from the front. Ingredients get loaded onto the counter (the source — a stream). Down the line sit stations — a "reject anything not fresh" station (filter), a "chop into the final cut" station (map), a "plate by size, largest first" station (sorted), a "no duplicate garnishes" station (distinct) — and Monica can set up and rearrange the ENTIRE line, station by station, and nothing actually cooks until a ticket comes in demanding a finished plate (lazy intermediate steps; nothing runs until a terminal operation). Only when a server calls "table 4, one plate, NOW" does the line actually fire, pulling one ingredient at a time through every station in the order Monica arranged them (the terminal operation is what actually runs the whole pipeline). And once that ticket\'s been fulfilled, that particular pull-through is DONE — you can\'t re-fire the same exact ticket for a second plate; a new ticket starts a fresh run down the same line. When Chandler needs the whole night\'s receipts folded into ONE total, he starts with zero and has each item ADD to a running sum as it\'s rung up (reduce: an identity plus a combining step). When Rachel needs dishes sorted back into labeled trays by table number instead of one giant pile, she doesn\'t hand-sort them herself — she tells the busser "group by table" and gets back trays already organized, one instruction, no manual sorting (Collectors.groupingBy). And when a customer asks "is there a reservation under this name" and there genuinely might not be one, the host doesn\'t just say nothing and let the customer guess — she checks a clearly labeled board that\'s either "HERE\'S your table" or an explicit "no reservation found," never a silent shrug that could be mistaken for an answer (Optional: an explicit, checkable absence, not a null the caller has to guess about).',
    },
    why: 'The conveyor belt / kitchen line that only runs when someone orders is the stream\'s lazy/eager split: intermediate stations (filter/map/sorted/distinct) just describe steps and do nothing until a terminal operation (count, collect, anyMatch) actually pulls elements through — and a consumed run can\'t be re-fired, matching a stream\'s one-shot nature. Folding everything down to a running total is reduce: an identity value plus a combining operation. "Group them into labeled bins/trays" is Collectors.groupingBy, replacing a manual computeIfAbsent loop with one call. And the clearly-labeled empty box / explicit "no reservation found" board is Optional: a forced, checkable acknowledgment that a result might be absent, instead of a silent null a caller could mistake for a real answer.'
  },
  storyAnim: {
    title: 'The conveyor belt: lazy stations, one terminal call, reduce, and the empty box',
    h: 320,
    props: [
      { id: 'source', emoji: '📦', label: 'crates loaded on the belt (source: list.stream())', x: 8, y: 12 },
      { id: 'filter', emoji: '🚫', label: 'reject unseaworthy (filter) — lazy, waits', x: 30, y: 12 },
      { id: 'map', emoji: '🔨', label: 'planks → plating (map) — lazy, waits', x: 52, y: 12 },
      { id: 'sorted', emoji: '📐', label: 'sort by size (sorted) — lazy, waits', x: 74, y: 12 },
      { id: 'terminal', emoji: '📣', label: '"send it through!" — terminal op, belt finally moves', x: 92, y: 12 },
      { id: 'reduce', emoji: '➕', label: 'reduce: running total, one crate at a time', x: 25, y: 50 },
      { id: 'groupby', emoji: '🗃️', label: 'groupingBy: sorted into labeled bins, one call', x: 55, y: 50 },
      { id: 'optional', emoji: '📭', label: 'no reading yet: a labeled EMPTY box, not silence (Optional)', x: 85, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🔧', label: 'Franky', x: 10, y: 30 },
      { id: 'nami', emoji: '🍊', label: 'Nami', x: 60, y: 78 }
    ],
    steps: [
      { c: 'Crates load onto the belt — the source. Nothing has run yet; this is just a stream wrapping the batch.', p: { source: 'good' }, a: { franky: [8, 30] } },
      { c: 'Franky wires up a "reject unseaworthy" station. It does NOT run yet — it just records the step. Intermediate operations are lazy.', p: { filter: 'good' } },
      { c: 'He adds a "planks to plating" transform station, and a "sort by size" station. Still nothing moves — the whole pipeline is just a description so far.', p: { map: 'good' } },
      { c: 'Only when someone at the end shouts an actual demand does the belt fire — pulling ONE crate at a time through every station, in order. That demand is the terminal operation.', p: { terminal: 'lit' } },
      { c: 'Nami folds a whole batch down to one number — starting from zero, adding each crate\'s value as it passes. That\'s reduce: an identity plus a combining step.', p: { reduce: 'good' }, a: { nami: [25, 78] } },
      { c: 'Robin asks for crates grouped into labeled bins by island of origin — one instruction, not a manual sort. That\'s Collectors.groupingBy.', p: { groupby: 'lit' } },
      { c: 'When there\'s genuinely no log pose reading yet, Nami hands back a clearly labeled EMPTY box — never silence that could be mistaken for a real answer. That\'s Optional.', p: { optional: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'Building and running a stream pipeline',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Source',
        nodes: [
          { id: 'source', text: 'collection.stream()\nwraps, does not copy' }
        ]
      },
      {
        label: 'Intermediate ops (lazy — describe, don\'t run)',
        nodes: [
          { id: 'filter', text: '.filter(Predicate)\nkeep matching' },
          { id: 'map', text: '.map(Function)\ntransform each' },
          { id: 'sorted', text: '.sorted(...)\nbuffers everything first' },
          { id: 'distinct', text: '.distinct()\nuses equals/hashCode' }
        ]
      },
      {
        label: 'Terminal op (eager — actually runs it)',
        nodes: [
          { id: 'collect', text: '.collect(Collectors...)\ntoList/toMap/groupingBy/joining' },
          { id: 'reduce', text: '.reduce(identity, combiner)\nfold to one value' },
          { id: 'shortcircuit', text: 'anyMatch/findFirst/limit\ncan stop early' }
        ]
      },
      {
        label: 'Handle absence',
        nodes: [
          { id: 'optional', text: 'Optional<T>\nmap/filter/orElse, not null' }
        ]
      }
    ],
    steps: [
      { active: ['source'], note: 'A stream wraps an existing collection without copying it — list.stream() gives you a pipeline VIEW over list, not a new list.' },
      { active: ['filter'], note: 'filter(Predicate<T>) records "keep elements where this is true" — built directly on the Predicate interface from the lambdas lesson. Nothing evaluates yet.' },
      { active: ['map'], note: 'map(Function<T,R>) records a transformation, potentially changing the element type entirely. Also lazy — just a recorded step.' },
      { active: ['sorted'], note: 'sorted() must buffer the WHOLE stream before it can emit anything, unlike filter/map which process one element at a time — a meaningfully different cost.' },
      { active: ['distinct'], note: 'distinct() uses equals/hashCode (Part 1\'s contract again) and also buffers everything it has seen so far to check for duplicates.' },
      { active: ['collect'], note: 'collect(Collectors.toList()/toMap()/groupingBy()/joining()) is the terminal operation that gathers pipeline results back into an actual List, Map, or String you can store and use.' },
      { active: ['reduce'], note: 'reduce(identity, combiner) is the general fold operation — start with an identity value, combine it with each element in turn. Most other numeric/combining terminal ops are specializations of this idea.' },
      { active: ['shortcircuit'], note: 'anyMatch/findFirst/findAny and limit() can stop pulling elements through the pipeline as soon as they have their answer — useful for large or even infinite sources.' },
      { active: ['optional'], note: 'Operations that might have no result (findFirst on an empty stream, max on an empty stream) return Optional<T> — present or empty, chainable with map/filter, resolved with orElse/orElseThrow instead of risking a null.' }
    ]
  },
  tech: [
    {
      q: 'Explain the lazy/eager distinction in streams and why it matters in practice, not just in theory.',
      a: 'A stream pipeline has intermediate operations (filter, map, sorted, distinct, limit) and terminal operations (collect, forEach, count, reduce, anyMatch, findFirst — exactly one per pipeline). Intermediate operations are LAZY: calling .filter(predicate) does not iterate anything or invoke the predicate — it returns a new Stream object that simply records "when this pipeline eventually runs, apply this predicate here," building up a description of work, not doing the work. The terminal operation is EAGER: it is the only point at which the pipeline actually executes, pulling elements through every recorded intermediate step, one element at a time (not stage-by-stage across the whole collection — an important nuance: for a given element, filter then map then the terminal action all happen before the NEXT element even starts). This matters practically in three ways. First, a pipeline with no terminal operation does genuinely nothing — a common early mistake is writing list.stream().map(this::expensiveTransform); as a standalone statement and being confused when nothing happens; the fix is adding a terminal op. Second, because processing is per-element through the whole chain rather than stage-by-stage, a limit(5) after a chain of filters can short-circuit the ENTIRE pipeline — including an unbounded or expensive source — the moment 5 elements have passed every filter, without ever touching the remaining elements; this is what makes limit safe even on effectively-infinite streams like Stream.iterate(...). Third, laziness means a stream is a ONE-SHOT description: once a terminal operation consumes it, the stream object is spent, and calling a second terminal operation on it throws IllegalStateException — you build a fresh stream from the source collection for each pipeline run you need.'
    },
    {
      q: 'Walk through the main Collectors — toList, toMap, groupingBy, joining — with an example of each and the toMap duplicate-key gotcha.',
      a: 'Collectors.toList() and Collectors.toSet() gather a stream\'s elements back into a List or Set respectively (concrete type unspecified by contract — treat the result as the interface type, per the collections/sets lessons): entries.stream().filter(e -> e.priority() == 1).collect(Collectors.toList()) gives you the urgent entries as a real List you can store or index. Collectors.toMap(keyFn, valueFn) builds a Map from two Functions extracting a key and value from each stream element: entries.stream().collect(Collectors.toMap(LogEntry::title, LogEntry::priority)) gives a Map<String,Integer> from title to priority. The gotcha: the two-argument form THROWS IllegalStateException the instant two elements produce the same key — it has no idea what you want to happen, so it refuses to guess. The fix is the three-argument overload with an explicit merge function: Collectors.toMap(LogEntry::tag, LogEntry::title, (existing, incoming) -> existing + "; " + incoming) says exactly how to combine two titles that share a tag. Collectors.groupingBy(classifierFn) is the single most useful one for reporting: it partitions the stream into a Map<K, List<T>> keyed by whatever the classifier returns — entries.stream().collect(Collectors.groupingBy(LogEntry::tag)) gives every entry grouped by tag in one line, which is exactly the loop-plus-computeIfAbsent idiom from the maps lesson, expressed declaratively. Supplying a second, "downstream" Collector argument changes what\'s stored per group instead of the full list — groupingBy(LogEntry::tag, Collectors.counting()) gives Map<String,Long> counts per tag instead of the entries themselves. Collectors.joining(delimiter, prefix, suffix) concatenates a Stream<String> into one String: entries.stream().map(LogEntry::title).collect(Collectors.joining(", ", "[", "]")) produces something like "[flaky tests, embedding cache]". Together these four cover the large majority of "I processed a stream, now I need a real structure back" needs.'
    },
    {
      q: 'What is Optional for, how do you use it correctly, and what are the anti-patterns to avoid?',
      a: 'Optional<T> represents "a value that might legitimately be absent" as an explicit, checkable type instead of allowing null to silently stand in for both "a real value" and "nothing here" — its entire design goal is moving a possible-absence bug from a runtime NullPointerException, potentially far from its cause, to a compile-time-visible type the caller must acknowledge. Streams return it from findFirst(), findAny(), min(), and max() (all of which have no answer on an empty stream); newer APIs return it from lookups that might miss. Correct usage centers on the chainable, functional-style methods rather than manual isPresent()/get() checks: .map(Function) transforms the contained value only if present, propagating emptiness automatically if not; .filter(Predicate) turns a present-but-non-matching value into empty; .orElse(defaultValue) supplies a fallback eagerly computed regardless of presence (fine for cheap defaults); .orElseGet(Supplier) supplies a fallback LAZILY, only invoked if actually empty (use this over orElse when computing the default has real cost); .orElseThrow(() -> new SpecificException(...)) converts absence into a meaningful exception at the point where absence is genuinely a bug. The idiomatic chain findEntry(id).map(LogEntry::title).map(String::toUpperCase).orElse("UNKNOWN") reads as one linear sentence and never risks a null-pointer at any step. The anti-patterns: calling .get() without checking .isPresent() first just moves the null-check problem to a different exception type (NoSuchElementException) without actually solving anything — if you\'re calling isPresent() immediately before get(), you\'ve usually written the isPresent()/get() pair that .orElse or .map already does more concisely; storing Optional in a field or passing it as a method PARAMETER is discouraged by the JDK\'s own design intent — Optional was designed as a RETURN type communicating "caller, please handle absence," not as a general-purpose nullable-wrapper for fields or parameters (a field that might be absent should usually just be null-checked directly, or better, never allowed to be absent by construction); and calling .isPresent() followed by .get() in an if-block, when a one-line .map/.orElse chain would do the same job, misses the point of the type.'
    },
    {
      q: 'How do you decide whether a piece of logic should be written as a stream pipeline or a plain loop?',
      a: 'My rule of thumb is to try to describe the operation in one plain English sentence using words like "for each," "where," "transformed into," "grouped by," or "collected into" — filter/map/sorted/distinct/collect map almost one-to-one onto that vocabulary, and if the sentence comes out clean, a stream pipeline usually reads BETTER than the equivalent loop (entries.stream().filter(e -> e.priority() == 1).map(LogEntry::title).collect(Collectors.toList()) directly mirrors "the titles of the urgent entries," while the loop version buries that intent inside accumulator bookkeeping). I reach for a plain loop instead when: the logic needs to break out early based on a condition that depends on MULTIPLE pieces of accumulated state at once (streams can short-circuit with limit/anyMatch/findFirst, but only along a single, simple condition — genuinely complex early-exit logic is often clearer as an explicit loop with a break); the body needs to mutate several different external variables per iteration (a forEach lambda capturing and mutating multiple things outside itself is exactly the effectively-final-capture friction the lambdas lesson describes, and it\'s usually a sign the logic wants imperative shape, not a functional pipeline); or the operation is inherently about POSITION or PAIRS OF ADJACENT elements (comparing element i to element i-1, for instance) — streams process elements without a natural notion of "the previous one," and forcing that into a stream (via awkward index tricks) is harder to read than a straightforward indexed for loop. The failure mode I actively watch for in code review is a stream chain forced onto logic that has real branching complexity purely because streams "look more modern" — at that point the pipeline becomes harder to step through in a debugger and harder to reason about than the loop it replaced, which defeats the entire readability argument for using streams in the first place.'
    }
  ],
  code: {
    title: 'LogPose reporting: filter, group, and summarize entries with streams',
    intro: 'The same LogEntry record from the lambdas lesson, now processed with a real stream pipeline — filtering, extracting, grouping by tag, and reducing to a total — plus the toMap duplicate-key gotcha and an Optional-based lookup.',
    code: `import java.util.*;
import java.util.stream.*;

record LogEntry(String title, String tag, int priority, int minutes) {}

public class StreamsDemo {
    public static void main(String[] args) {
        List<LogEntry> entries = List.of(
            new LogEntry("flaky test triage", "testing", 1, 45),
            new LogEntry("embedding cache design", "infra", 2, 90),
            new LogEntry("flaky rerun analysis", "testing", 1, 30),
            new LogEntry("mentoring 1:1", "people", 3, 30),
            new LogEntry("index rebuild", "infra", 2, 60)
        );

        // filter -> map -> collect: the titles of the urgent (priority 1) entries
        List<String> urgentTitles = entries.stream()
            .filter(e -> e.priority() == 1)
            .map(LogEntry::title)
            .collect(Collectors.toList());
        System.out.println("urgent: " + urgentTitles);

        // groupingBy: entries bucketed by tag, replacing a manual computeIfAbsent loop
        Map<String, List<LogEntry>> byTag = entries.stream()
            .collect(Collectors.groupingBy(LogEntry::tag));
        System.out.println("testing-tagged count: " + byTag.get("testing").size());

        // groupingBy + downstream collector: total minutes per tag
        Map<String, Integer> minutesByTag = entries.stream()
            .collect(Collectors.groupingBy(LogEntry::tag, Collectors.summingInt(LogEntry::minutes)));
        System.out.println("minutes by tag: " + minutesByTag);

        // reduce: total minutes across everything, identity 0
        int totalMinutes = entries.stream()
            .map(LogEntry::minutes)
            .reduce(0, (a, b) -> a + b);
        System.out.println("total minutes: " + totalMinutes);

        // joining: a display string of titles
        String display = entries.stream()
            .map(LogEntry::title)
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println("display: " + display);

        // toMap WITHOUT a merge function throws on the duplicate "testing" tag key:
        try {
            entries.stream().collect(Collectors.toMap(LogEntry::tag, LogEntry::title));
        } catch (IllegalStateException ex) {
            System.out.println("toMap without merge fn threw on duplicate key: " + ex.getClass().getSimpleName());
        }
        // the fix: supply a merge function for duplicate keys
        Map<String, String> oneTitlePerTag = entries.stream()
            .collect(Collectors.toMap(LogEntry::tag, LogEntry::title, (a, b) -> a + "; " + b));
        System.out.println("merged: " + oneTitlePerTag.get("testing"));

        // Optional: findFirst may have nothing, chained instead of null-checked
        String firstInfraTitle = entries.stream()
            .filter(e -> e.tag().equals("infra"))
            .findFirst()
            .map(LogEntry::title)
            .orElse("(none found)");
        System.out.println("first infra title: " + firstInfraTitle);

        String firstGamesTitle = entries.stream()
            .filter(e -> e.tag().equals("games"))     // no entries have this tag
            .findFirst()
            .map(LogEntry::title)
            .orElse("(none found)");
        System.out.println("first games title: " + firstGamesTitle);   // (none found), no NPE
    }
}`,
    notes: [
      'urgentTitles chains filter (Predicate) then map (Function) then collect — each intermediate step reads as one clause of "the titles of the urgent entries."',
      'minutesByTag shows a downstream Collector (Collectors.summingInt) changing what groupingBy stores per group from a List<LogEntry> to a single Integer — a common and very readable pattern for reports.',
      'The toMap block deliberately shows BOTH the failing 2-arg call and the working 3-arg call with a merge function side by side, since the duplicate-key exception is the single most common toMap surprise. Run: javac StreamsDemo.java LogEntry.java && java StreamsDemo.'
    ]
  },
  lab: {
    title: 'Report on a LogEntry list with a stream pipeline',
    prompt: 'Given a fixed <code>List&lt;LogEntry&gt;</code> (reuse the <code>LogEntry</code> record: <code>title, tag, priority, minutes</code>), write a class <code>ReportTools</code> with three static methods, each built as ONE stream pipeline (no manual loops): (1) <code>static List&lt;String&gt; urgentTitles(List&lt;LogEntry&gt; entries)</code> — titles of entries with <code>priority() == 1</code>, using <code>filter</code> then <code>map</code> then <code>Collectors.toList()</code>; (2) <code>static Map&lt;String, Long&gt; countByTag(List&lt;LogEntry&gt; entries)</code> — using <code>Collectors.groupingBy</code> with the downstream collector <code>Collectors.counting()</code>; (3) <code>static Optional&lt;String&gt; firstTitleWithTag(List&lt;LogEntry&gt; entries, String tag)</code> — <code>filter</code>, then <code>findFirst</code>, then <code>map</code> to the title (do NOT call <code>.get()</code> or <code>.orElse(...)</code> inside this method — return the <code>Optional&lt;String&gt;</code> itself and let the caller decide).',
    starter: `import java.util.*;
import java.util.stream.*;

record LogEntry(String title, String tag, int priority, int minutes) {}

class ReportTools {
    static List<String> urgentTitles(List<LogEntry> entries) {
        // one stream pipeline: filter priority()==1, map to title, collect to List
        return null; // replace
    }

    static Map<String, Long> countByTag(List<LogEntry> entries) {
        // one stream pipeline: groupingBy(tag, counting())
        return null; // replace
    }

    static Optional<String> firstTitleWithTag(List<LogEntry> entries, String tag) {
        // one stream pipeline: filter by tag, findFirst, map to title
        return null; // replace
    }
}`,
    checks: [
      { re: 'urgentTitles[\\s\\S]*?\\.stream\\s*\\(\\s*\\)[\\s\\S]*?\\.filter\\s*\\([\\s\\S]*?\\.map\\s*\\([\\s\\S]*?\\.collect\\s*\\(\\s*Collectors\\.toList', must: true, hint: 'urgentTitles must chain .stream().filter(...).map(...).collect(Collectors.toList()) in that order.', pass: 'urgentTitles pipeline shape ✓' },
      { re: 'priority\\s*\\(\\s*\\)\\s*==\\s*1', must: true, hint: 'Filter on e.priority() == 1.', pass: 'filters priority 1 ✓' },
      { re: 'countByTag[\\s\\S]*?groupingBy\\s*\\([\\s\\S]*?Collectors\\.counting\\s*\\(', must: true, hint: 'countByTag must use Collectors.groupingBy(..., Collectors.counting()).', pass: 'countByTag uses groupingBy + counting ✓' },
      { re: 'firstTitleWithTag[\\s\\S]*?\\.filter\\s*\\([\\s\\S]*?\\.findFirst\\s*\\(\\s*\\)[\\s\\S]*?\\.map\\s*\\(', must: true, hint: 'firstTitleWithTag must chain .filter(...).findFirst().map(...) and return the Optional directly.', pass: 'firstTitleWithTag pipeline shape ✓' },
      { re: 'Optional\\s*<\\s*String\\s*>\\s+firstTitleWithTag[\\s\\S]*?\\{[\\s\\S]*?\\.orElse', must: false, hint: 'Do NOT call .orElse(...) inside firstTitleWithTag — return the Optional itself, let the caller decide.', pass: 'no premature orElse ✓' },
      { re: 'LogEntry::title', must: true, hint: 'Use the method reference LogEntry::title for the map step(s).', pass: 'uses LogEntry::title ✓' }
    ],
    run: 'add a main method with a small List.of(...) of LogEntry values (reuse the demo data shape), call all three methods, and print the results — confirm firstTitleWithTag returns Optional.empty() for a tag that doesn\'t exist rather than throwing. javac ReportTools.java && java ReportTools.',
    solution: `import java.util.*;
import java.util.stream.*;

record LogEntry(String title, String tag, int priority, int minutes) {}

class ReportTools {
    static List<String> urgentTitles(List<LogEntry> entries) {
        return entries.stream()
            .filter(e -> e.priority() == 1)
            .map(LogEntry::title)
            .collect(Collectors.toList());
    }

    static Map<String, Long> countByTag(List<LogEntry> entries) {
        return entries.stream()
            .collect(Collectors.groupingBy(LogEntry::tag, Collectors.counting()));
    }

    static Optional<String> firstTitleWithTag(List<LogEntry> entries, String tag) {
        return entries.stream()
            .filter(e -> e.tag().equals(tag))
            .findFirst()
            .map(LogEntry::title);
    }

    public static void main(String[] args) {
        List<LogEntry> entries = List.of(
            new LogEntry("flaky test triage", "testing", 1, 45),
            new LogEntry("embedding cache design", "infra", 2, 90),
            new LogEntry("flaky rerun analysis", "testing", 1, 30)
        );

        System.out.println(urgentTitles(entries));                              // [flaky test triage, flaky rerun analysis]
        System.out.println(countByTag(entries));                                 // {testing=2, infra=1}
        System.out.println(firstTitleWithTag(entries, "infra"));                 // Optional[embedding cache design]
        System.out.println(firstTitleWithTag(entries, "games"));                 // Optional.empty
        System.out.println(firstTitleWithTag(entries, "games").orElse("none"));  // none — caller decides
    }
}`,
    notes: [
      'urgentTitles is exactly the filter-map-collect shape from the concept section, mirroring "the titles of the urgent entries" as one readable chain.',
      'countByTag\'s groupingBy(LogEntry::tag, Collectors.counting()) produces a Map<String,Long> — note Long, not Integer, since counting() always returns a long-backed count.',
      'firstTitleWithTag deliberately returns Optional<String> rather than resolving it internally — the caller decides whether "no entry with this tag" means a default string, an exception, or something else entirely, which is exactly Optional\'s intended role as a return-type contract, not an internal convenience.'
    ]
  },
  quiz: [
    {
      q: 'You write `list.stream().filter(x -> x > 0).map(x -> x * 2);` as a standalone statement with no terminal operation. What happens when this line runs?',
      options: ['Nothing observable happens — filter and map are lazy intermediate operations that only build a pipeline description; without a terminal operation, nothing is ever pulled through it', 'The filter and map run immediately, producing a new filtered/transformed list', 'A compile error, since streams must always end in a terminal operation', 'A NullPointerException, since the resulting stream is never assigned'],
      correct: 0,
      explain: 'filter and map are lazy — they record steps but do not execute the predicate or function on any element. Only a terminal operation (collect, forEach, count, etc.) actually pulls elements through the pipeline. With none present, this line has no observable effect at all.'
    },
    {
      q: 'Which order is generally better for performance, and why: `.filter(cheap).map(expensive)` or `.map(expensive).filter(cheap)`?',
      options: ['filter(cheap).map(expensive) — the expensive transform only runs on elements that survived the cheap filter, while the reverse order pays the expensive cost for every element including ones about to be discarded', 'map(expensive).filter(cheap) — transforming first always produces better-optimized data for filtering', 'They are always equivalent in performance since streams reorder operations automatically', 'It depends only on the size of the source collection, not the operation order'],
      correct: 0,
      explain: 'Streams process one element through the WHOLE chain before moving to the next, in the order you wrote it — filtering cheaply first shrinks the working set before paying for the expensive map, while the reverse order wastes the expensive computation on elements the filter will immediately discard.'
    },
    {
      q: 'What does `Collectors.toMap(LogEntry::tag, LogEntry::title)` do if two entries share the same tag?',
      options: ['It throws IllegalStateException at the point of the duplicate key, because the 2-argument toMap has no default merge strategy — use the 3-argument overload with an explicit merge function instead', 'It silently keeps the first entry\'s title and discards the second', 'It silently overwrites with the last entry\'s title, no exception', 'It automatically combines both titles into a comma-separated string'],
      correct: 0,
      explain: 'The 2-argument Collectors.toMap has no way to guess what you want on a key collision, so it throws IllegalStateException rather than silently picking a behavior. The fix is the 3-argument overload: toMap(keyFn, valueFn, (a, b) -> mergedResult).'
    },
    {
      q: 'You call `.findFirst()` on a stream and there might be no matching element. What should the calling code do?',
      options: ['Treat the Optional<T> result properly — chain .map(...) if transforming a present value, and resolve absence explicitly with .orElse(default), .orElseGet(supplier), or .orElseThrow(...), rather than calling .get() unconditionally', 'Call .get() directly, since findFirst() always returns a real value if the stream had any source elements at all', 'Check the result against null, since findFirst() returns null when nothing matches', 'Wrap the call in a try/catch for NullPointerException'],
      correct: 0,
      explain: 'findFirst() returns Optional<T>, never null — that\'s the whole point of Optional. Calling .get() without checking risks NoSuchElementException on an empty result; the idiomatic approach chains .map/.filter for transformations and resolves absence explicitly with orElse/orElseGet/orElseThrow.'
    },
    {
      q: 'A colleague forces a piece of logic with multiple early-exit conditions and several externally-mutated variables into a long stream chain "to look modern." What\'s the concern?',
      options: ['Streams are best suited to linear filter/map/collect pipelines; logic with complex branching or multi-variable mutation per step is usually clearer and easier to debug as a plain loop — forcing it into a stream trades readability for the appearance of modernity', 'Streams cannot contain more than 3 chained operations, so this code likely won\'t compile', 'There is no concern; more stream operations chained together is always more idiomatic and performant', 'Stream chains automatically parallelize, which could introduce race conditions with the mutated variables'],
      correct: 0,
      explain: 'Streams shine for describable, linear pipelines ("for each, where, transformed into, collected into"). Complex early-exit conditions or mutating several external variables per iteration fight against the functional, one-element-at-a-time model and usually read (and debug) worse as a forced stream chain than as a straightforward loop.'
    }
  ],
  testFlow: {
    title: 'Test yourself: streams under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You build a stream pipeline, call `.count()` on it (a terminal op), then immediately call `.collect(Collectors.toList())` on the SAME stream variable. What happens?',
        choices: [
          { text: 'IllegalStateException — a stream is a one-shot pipeline; once a terminal operation has consumed it, the same stream object cannot be run again', to: 'q1_right' },
          { text: 'It works fine and returns the same elements again, since streams can be reused freely', to: 'q1_wrong_reuse' },
          { text: 'It silently returns an empty list, with no exception', to: 'q1_wrong_silent' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — once a terminal operation has pulled elements through a stream, that stream object is spent. A second terminal operation on the same instance throws IllegalStateException. To run another pipeline over the same data, you call .stream() again on the source collection to get a fresh stream.', next: 'q2' },
      q1_wrong_reuse: { end: true, correct: false, text: 'Streams are explicitly NOT reusable — this is a deliberate design constraint, not an oversight. A terminal operation consumes the stream; calling a second terminal operation on the same instance throws IllegalStateException rather than silently re-running or returning stale data.', retry: 'q1' },
      q1_wrong_silent: { end: true, correct: false, text: 'It does not fail silently — Java is explicit here: reusing a consumed stream throws IllegalStateException loudly, at the point of the second terminal call, rather than returning an empty or stale result that could hide a real bug.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You need, from a list of LogEntry, a Map from tag to the TOTAL minutes spent on entries with that tag. Which approach?',
        choices: [
          { text: 'entries.stream().collect(Collectors.groupingBy(LogEntry::tag, Collectors.summingInt(LogEntry::minutes))) — groupingBy with a downstream summingInt collector, in one pipeline', to: 'q2_right' },
          { text: 'entries.stream().collect(Collectors.toMap(LogEntry::tag, LogEntry::minutes)) — a plain toMap of tag to minutes', to: 'q2_wrong_tomap' },
          { text: 'entries.stream().map(LogEntry::tag).collect(Collectors.toList()) then manually sum minutes afterward in a loop', to: 'q2_wrong_manual' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — groupingBy partitions by tag, and the downstream Collectors.summingInt(LogEntry::minutes) changes what\'s stored per group from a List<LogEntry> to a summed int, giving exactly Map<String,Integer> of total minutes per tag in one declarative pipeline.', next: 'q3' },
      q2_wrong_tomap: { end: true, correct: false, text: 'toMap(LogEntry::tag, LogEntry::minutes) would THROW on the very first duplicate tag (two entries sharing a tag is the normal case here), and even with a merge function it only combines two VALUES pairwise — it doesn\'t naturally express "sum across however many entries share this tag" the way groupingBy + summingInt does directly.', retry: 'q2' },
      q2_wrong_manual: { end: true, correct: false, text: 'This throws away the tag-to-minutes association entirely (mapping to tag alone discards minutes) and reintroduces the manual loop-plus-accumulator pattern that groupingBy with a downstream collector was designed to replace in one declarative line.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A method returns `Optional<LogEntry> findByTitle(String title)`. A caller writes `LogEntry e = findByTitle("x").get();` with no check. What\'s the concern, and the better pattern?',
        choices: [
          { text: 'Calling .get() without checking presence just relocates the null-check problem into a NoSuchElementException risk; prefer .map(...)/.orElse(...)/.orElseThrow(specificException) to handle absence explicitly at the call site', to: 'q3_right' },
          { text: 'No concern — Optional.get() never throws, that\'s the entire point of wrapping the value in Optional', to: 'q3_wrong_neverthrows' },
          { text: 'The method signature is wrong; it should return LogEntry directly and use null for "not found" instead', to: 'q3_wrong_returnnull' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — Optional.get() throws NoSuchElementException when empty, which is exactly the same category of bug (an unhandled absence) that Optional exists to make visible and force you to address, just under a different exception name. Chaining .map for transformations and resolving with .orElse/.orElseGet/.orElseThrow expresses the intent directly and can\'t be skipped accidentally.', next: null },
      q3_wrong_neverthrows: { end: true, correct: false, text: 'Optional.get() absolutely can throw — NoSuchElementException, specifically, when the Optional is empty. Optional doesn\'t prevent the "missing value" problem; it makes the compiler force you to visibly ACKNOWLEDGE it, via the return type, rather than silently allowing a null to slip through unchecked.', retry: 'q3' },
      q3_wrong_returnnull: { end: true, correct: false, text: 'That reverses the whole point of the API design — Optional as a return type is specifically preferred over "return null for not-found" because it makes the possibly-missing case visible in the TYPE SIGNATURE, forcing callers to handle it, rather than relying on documentation or convention to remember that null is a possible return value.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Writing an intermediate-only pipeline (filter/map with no terminal op) and being confused when nothing happens — intermediate operations are lazy; add a terminal operation (collect, count, forEach, etc.) to actually run the pipeline.',
    'Calling a second terminal operation on an already-consumed stream — throws IllegalStateException. Build a fresh stream (collection.stream() again) for each pipeline run.',
    'Using Collectors.toMap without a merge function on data that might have duplicate keys — throws IllegalStateException on the first collision. Use the 3-argument overload with an explicit merge function whenever duplicate keys are possible.',
    'Calling Optional.get() without checking presence first — throws NoSuchElementException on empty, which is the exact bug class Optional exists to surface. Prefer map/filter/orElse/orElseGet/orElseThrow.',
    'Putting an expensive .map(...) transform BEFORE a cheap .filter(...) — pays the expensive cost for every element, including ones about to be discarded. Filter early, transform late.',
    'Forcing complex branching logic or multi-variable mutation into a long stream chain purely for style — streams read best as linear "for each / where / transformed into / collected into" pipelines; genuinely complex control flow is usually clearer, and easier to debug, as a plain loop.'
  ],
  interview: [
    {
      q: 'Explain the lazy vs. eager distinction in the Stream API and its practical consequences.',
      a: 'A stream pipeline consists of a source, any number of intermediate operations (filter, map, sorted, distinct, limit, etc.), and exactly one terminal operation (collect, forEach, count, reduce, anyMatch, findFirst, and similar). Intermediate operations are lazy: calling .filter(predicate) doesn\'t iterate anything or invoke the predicate at all — it returns a new Stream that records the step as part of a pipeline description. The terminal operation is eager: it is the sole point at which the pipeline actually executes, and it pulls elements through the ENTIRE chain of recorded steps one element at a time (not stage-by-stage across the whole source — a subtlety that matters, since for each element, every intermediate step runs before the next element even begins). This has three concrete consequences I\'ve hit in real code. First, a pipeline built with only intermediate operations and no terminal call is a complete no-op — nothing runs, which surprises people expecting eager evaluation like a traditional loop. Second, laziness enables genuine short-circuiting: .limit(n) or .anyMatch(predicate) can stop pulling elements the moment they have their answer, which is what makes operations like Stream.iterate(0, i -> i + 1).limit(10) safe to run at all despite the source being conceptually infinite — an eagerly-evaluated pipeline could never do that. Third, a stream is a ONE-SHOT description of work: once a terminal operation has consumed it, the stream object is spent, and any second terminal call on that same instance throws IllegalStateException — you construct a fresh stream from the source collection for each pipeline run, which is a real design constraint, not an implementation quirk, and it trips up anyone who tries to store and reuse a Stream reference like a collection.'
    },
    {
      q: 'When would you use Collectors.groupingBy versus Collectors.toMap, and how do you handle groupingBy\'s downstream collector argument?',
      a: 'Collectors.toMap(keyFn, valueFn) builds a Map where each stream element contributes exactly ONE key-value pair — it\'s the right tool when keys are known to be unique (or you\'re prepared to explicitly resolve collisions with the 3-argument merge-function overload). Collectors.groupingBy(classifierFn) is fundamentally different in shape: it assumes MULTIPLE elements can share the same classifier result and, by default, produces Map<K, List<T>> — every element with a matching key lands in that key\'s list, with no collision or exception possible, because collecting into a growing list is exactly how it\'s designed to handle repeats. My rule: if the key is expected to be unique per element, reach for toMap; if multiple elements are expected to share a key and I want them BUCKETED together, reach for groupingBy. The downstream collector — groupingBy\'s optional second argument — changes what\'s stored per bucket instead of the default full list, and is where groupingBy becomes genuinely powerful for reporting: Collectors.counting() gives Map<K,Long> counts per group instead of the entries themselves; Collectors.summingInt(someIntFn) gives a summed total per group; Collectors.mapping(extractorFn, Collectors.toList()) transforms each element before bucketing it (e.g., store titles per tag instead of whole LogEntry objects); and you can even nest another groupingBy as the downstream collector to produce a two-level Map<K1, Map<K2, List<T>>> grouping. In practice, groupingBy with a downstream collector replaces what would otherwise be a manual loop plus Map.computeIfAbsent(key, k -> new ArrayList<>()).add(element) (the maps lesson\'s idiom) with a single declarative call, and it\'s the collector I reach for most often when building any kind of tag-based, category-based, or bucketed report.'
    },
    {
      q: 'What problem does Optional solve, and what are its correct and incorrect usage patterns?',
      a: 'Optional<T> makes "this operation might have no result" an explicit, compiler-visible fact about a method\'s return type, instead of leaving it as an unstated convention that null might come back — the goal is converting a potential NullPointerException, which can surface far from its actual cause, into a type the caller is forced to acknowledge and handle at the call site. Streams use it for findFirst(), findAny(), min(), and max(), since all four have no answer on an empty stream. The correct usage pattern favors the chainable, functional methods over manual presence checks: .map(Function) transforms the contained value only if present and automatically propagates emptiness through if not; .filter(Predicate) converts a present-but-non-matching value into empty; .orElse(value) supplies an eagerly-evaluated fallback (fine for cheap constants); .orElseGet(Supplier) supplies a LAZILY-evaluated fallback, which matters when computing the default has real cost you don\'t want to pay on the common present-path; and .orElseThrow(exceptionSupplier) converts absence into a specific, meaningful exception exactly where absence genuinely IS a bug. A clean chain like findEntry(id).map(LogEntry::title).orElse("(not found)") reads as one linear sentence and never risks an NPE at any intermediate step. The incorrect patterns I flag in review: calling .get() unconditionally, which just swaps NullPointerException for NoSuchElementException without solving the underlying problem — if isPresent() is called immediately before get(), that whole pair is almost always better expressed as .map or .orElse; storing an Optional as a class FIELD or accepting one as a method PARAMETER, which the JDK\'s own design explicitly discourages — Optional is meant as a return-type contract signaling "caller, please handle absence," not a general nullable-wrapper for storage (a genuinely-optional field is better modeled as a plain nullable reference with disciplined null-checks, or redesigned so absence can\'t happen); and using Optional purely to avoid writing "null" without ever using its chaining methods, which adds ceremony without gaining the actual safety benefit.'
    },
    {
      q: 'How do you decide between a stream pipeline and a plain imperative loop for a given piece of logic?',
      a: 'My heuristic is to try to state the operation as one plain-English sentence using words that map directly onto stream vocabulary — "for each," "where," "transformed into," "grouped by," "collected into" — and if that sentence comes out clean and linear, a stream pipeline usually both reads better and is less error-prone than the equivalent loop, because filter/map/sorted/distinct/collect express intent directly instead of burying it inside index variables and accumulator bookkeeping: "the titles of the urgent entries, grouped by tag" becomes almost a direct transcription as entries.stream().filter(...).collect(Collectors.groupingBy(...)). I switch to a plain loop in three recurring situations. First, when the early-exit condition depends on MULTIPLE pieces of accumulated state at once rather than a single simple predicate — streams offer real short-circuiting via limit/anyMatch/findFirst, but forcing genuinely complex, stateful branching logic to fit that shape usually produces something harder to read than an explicit loop with a break and a couple of local variables. Second, when the logic needs to mutate several different EXTERNAL variables per iteration — a forEach lambda that captures and mutates multiple things outside itself fights directly against both the effectively-final-capture rule from the lambdas lesson and the functional, side-effect-minimizing spirit streams are meant to encourage; that\'s usually a sign the logic wants imperative shape. Third, when the operation genuinely needs to reason about POSITION or ADJACENT elements — comparing element i to element i-1, for instance — since streams process elements without an inherent notion of "the previous one," and simulating that with index tricks inside a stream chain is typically less readable than a straightforward indexed for loop. The failure mode I actively watch for in code review is a long, deeply-nested stream chain forced onto logic with real branching complexity purely for the appearance of modern style — at that point it becomes strictly harder to step through in a debugger than the loop it replaced, which undermines the entire readability argument that motivates reaching for streams in the first place.'
    }
  ]
};
