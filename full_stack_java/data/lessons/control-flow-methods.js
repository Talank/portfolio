window.LESSONS = window.LESSONS || {};
window.LESSONS['control-flow-methods'] = {
  id: 'control-flow-methods',
  title: 'Control Flow & Methods: Loops, Modern switch, Overloading',
  category: 'Part 1 — Core Java',
  timeMin: 40,
  summary: 'The traffic laws of Java: branching (if/else and both flavors of switch — the crusty 1995 statement with its fall-through trap, and the modern arrow-form expression that fixed it), looping (for, enhanced-for, while, do-while, break/continue), and methods — signatures, return paths, overloading, and varargs. Short on philosophy, long on the specific corners where bugs breed.',
  goals: [
    'Choose the right loop for the job and articulate why (for = counted, enhanced-for = each element, while = condition, do-while = at-least-once)',
    'Use modern switch expressions (arrow form, multi-label cases, yield) and explain classic switch fall-through — the bug and the rare legitimate use',
    'Write methods with clear signatures; explain how overload resolution picks a method at COMPILE time',
    'Use varargs correctly and know its constraints (last position, one per method, it\'s really an array)',
    'Recognize the classic control-flow bugs: off-by-one, infinite loops with unreachable exit conditions, missing break, and unreachable code after return'
  ],
  concept: [
    {
      h: 'Branching: if/else, and the two switches',
      p: [
        '<code>if / else if / else</code> you know from any language — Java\'s only demands are that the condition be a real <code>boolean</code> (no truthy/falsy: <code>if (count)</code> doesn\'t compile, killing the C classic <code>if (x = 5)</code> typo-bug at the source) and that you brace even single statements (the unbraced form is legal and is how Apple shipped the famous <code>goto fail</code> security hole — two indented lines, only one governed by the if).',
        'The <b>classic switch statement</b> (1995 vintage) compares one value against constant cases — and every case FALLS THROUGH into the next unless you end it with <code>break</code>. Forgetting a break silently executes the next case\'s code too: the single most notorious trap in the C family, still compiling happily in Java today. (Fall-through has one legitimate use — stacking several case labels onto one body — and that use is exactly what the modern syntax made safe.)',
        'The <b>modern switch expression</b> (Java 14+) is the version to reach for: <code>case</code> with an arrow <code>-&gt;</code>, no fall-through possible, multiple labels per case (<code>case SATURDAY, SUNDAY -&gt;</code>), and the whole switch RETURNS A VALUE — so it can sit on the right of an assignment. The compiler also checks <b>exhaustiveness</b>: switching over an enum and missing a case is a compile error (no silent "none matched"), which becomes a superpower when Part 4\'s sealed types arrive. Multi-statement cases use a block with <code>yield value;</code> to produce the result.',
        '<div class="math">String kind = switch (day) {&nbsp;case SATURDAY, SUNDAY -&gt; "weekend";&nbsp;case MONDAY -&gt; "rough";&nbsp;default -&gt; "workday";&nbsp;};<span class="mnote">expression, not statement: it produces a value, cannot fall through, and must cover every possibility. Use this one.</span></div>'
      ]
    },
    {
      h: 'Loops: four shapes, one decision rule',
      p: [
        'The decision rule: <b>counted → for; every element → enhanced-for; unknown repetitions → while; at-least-once → do-while.</b>',
        '<ul><li><b>for</b> — <code>for (int i = 0; i &lt; n; i++)</code>: init, condition, update in one header; <code>i</code> scoped to the loop. The <code>i &lt; n</code> vs <code>i &lt;= n</code> choice is where off-by-one bugs live: half-open ranges (<code>&lt;</code>, n iterations from 0) are the convention worth internalizing — the same convention the DSA course\'s sliding-window and binary-search patterns depend on.</li><li><b>enhanced-for</b> — <code>for (String tag : tags)</code>: reads every element of an array or collection, no index bookkeeping to get wrong. Use it whenever you don\'t need the index. Two limits: you can\'t write into the array slot through the loop variable (it\'s a copy of the element — the coins/maps rule from last lesson decides what "copy" means), and you can\'t remove from a collection mid-loop with it (Part 3 explains the fail-fast iterator behind that rule).</li><li><b>while</b> — condition checked before each pass, zero or more executions. <b>do-while</b> — body first, condition after, so it always runs at least once (menus, retry loops, "read until valid input").</li></ul>',
        '<b>break</b> exits the nearest loop; <b>continue</b> skips to its next iteration. For nested loops, a <b>label</b> lets you break out of the OUTER loop from inside the inner one (<code>search: for (...) { for (...) { if (found) break search; } }</code>) — rare, occasionally exactly right, and famous as an interview curiosity ("does Java have goto?" — reserved word, never implemented; labeled break is the civilized cousin). The infinite-loop family — <code>while (true)</code> with a break inside is a legitimate idiom; a condition that no statement in the body can ever change is a bug (Sheldon will demonstrate shortly).'
      ]
    },
    {
      h: 'Methods: signatures, returns, and the anatomy of a call',
      p: [
        'A method declaration reads: modifiers, return type, name, parameter list — <code>public static int clamp(int value, int lo, int hi)</code>. Until objects arrive next lesson, we write <code>static</code> methods (callable on the class, no instance needed — <code>main</code> is one). Non-void methods must return on EVERY path — the compiler traces your branches and rejects a method where some route reaches the end without a <code>return</code> (and flags unreachable code after one). This "all paths" analysis is real static analysis you get for free, and it\'s why early returns (<code>if (invalid) return fallback;</code> at the top, main logic unindented below) are idiomatic Java: guard clauses beat pyramid-of-doom nesting.',
        '<b>Scope</b> is brace-delimited: a variable exists from its declaration to the closing <code>}</code> of the block that contains it. Loop variables die with the loop; shadowing a field with a local of the same name compiles and confuses (next lesson\'s <code>this.x = x</code> constructor idiom is the one blessed use).'
      ]
    },
    {
      h: 'Overloading: one name, many signatures — resolved at compile time',
      p: [
        '<b>Overloading</b> = several methods with the same name but different PARAMETER lists in one class: <code>log(String msg)</code>, <code>log(String msg, int severity)</code>, <code>log(Exception e)</code>. The compiler picks the winner at COMPILE time from the argument types written at the call site — this is early/static binding, and keeping it distinct from overRIDING (next lesson: same signature, subclass, chosen at RUNTIME from the actual object) is a top-three interview discriminator. Return type alone can NOT distinguish overloads — <code>int f()</code> vs <code>double f()</code> is a compile error, since a call site <code>f();</code> couldn\'t say which it meant.',
        'Resolution order when several could match: exact type → widening (<code>int</code> arg accepted by <code>long</code> parameter) → autoboxing (<code>int</code> → <code>Integer</code>) → varargs, in that priority. So <code>f(7)</code> with both <code>f(long)</code> and <code>f(Integer)</code> on offer picks <code>f(long)</code> — widening beats boxing, a genuinely asked interview puzzle. When two overloads tie (<code>f(int, long)</code> vs <code>f(long, int)</code> called with <code>f(1, 2)</code>), the compiler refuses: "ambiguous method call" — it never guesses.',
        '<b>Varargs</b> — <code>static int sum(int... values)</code> — accepts zero or more arguments; inside the method, <code>values</code> IS an <code>int[]</code> (callers may even pass an array directly). Constraints: at most one varargs parameter, and it must be last (<code>f(String label, int... nums)</code> ✓). You\'ve been using varargs since your first program: <code>System.out.printf</code>, <code>List.of(...)</code> (Part 3), and JUnit\'s assertion helpers (Part 7) all ride it.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Zoro is a switch statement without breaks',
      text: 'The crew needs to cross Loguetown, and Nami writes directions as clean branching logic: IF the plaza is crowded, take the harbor street; ELSE IF marines are drilling, cut through the market; ELSE the main road. She hands the same instructions to everyone. Usopp executes them like a modern switch: he checks the conditions, matches exactly ONE branch, follows it — arrow case, no leakage, arrives on time. Then there\'s Zoro. Zoro matches the first case fine — crowded plaza, harbor street — but on reaching the end of that instruction he just… KEEPS GOING into the next instruction, then the next, executing every remaining direction in the list because nothing in his head says stop (classic switch fall-through: matched case, missing break, and every case after it runs too). He ends up on three streets he had no reason to visit and swears the directions were cursed. The directions compiled fine; the executor fell through. Meanwhile Nami\'s actual navigation that day is a tour of loop shapes: "circle the island EXACTLY four times to chart it" (a counted for — she knows n up front); "check EVERY shop on the list for a Log Pose" (enhanced-for — each element, no index arithmetic to fumble); "sail east WHILE the storm holds" (condition first — might be zero minutes, check before you commit the ship); and Luffy\'s dinner rule, "eat first, THEN ask if anyone\'s still hungry" (do-while — the body unconditionally runs once, ask questions later). And when Sanji cooks for the crew, he\'s an overloaded method: the crew calls one name — cook() — and Sanji picks the recipe at ORDER time from what\'s handed to him: cook(fish) grills, cook(fish, spice) makes curry, cook(fish, spice, rice) plates a full course. Same name, the argument list decides, and the decision happens when the order is written, not when the pan hits the stove (compile-time overload resolution). When two recipes match a vague order equally well, Sanji refuses to guess and sends the order back — ambiguous method call, the kitchen\'s honor intact.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'The Friendship Algorithm\'s infinite loop',
      text: 'Season 2: Sheldon needs Kripke\'s friendship (Kripke controls the Open Science Grid computer time), so naturally he draws THE FRIENDSHIP ALGORITHM as a literal flowchart on the whiteboard — place a call; ask "would you like to share a meal?"; if yes, dine; if no, offer a hot beverage; ask about interests… It\'s pure control flow: diamond decisions (if/else), boxes (statements), arrows (execution order). Leonard, Howard, and Raj watch him trace it live, and then it happens: Kripke declines every option, and Sheldon enters the loop — ask about interests, no shared interest, ask about interests, no shared interest — around and around the same three boxes, because NO PATH OUT of the cycle exists when every answer is no. Sheldon is stuck in an infinite while loop on live whiteboard, condition never changed by the body. Howard — the engineer, fittingly — walks up and fixes it the way you fix it in code: he adds an ESCAPE to the flowchart, a loop counter with an exit edge — "have you tried N times? → yes → move on" (a bounded retry: for-with-limit, or the break inside while(true)). Sheldon studies the amendment and accepts it as "a valid modification". The scene is the whole loops section in ninety seconds: a loop is only as correct as its exit, the exit must be REACHABLE by something the body actually changes (a counter incrementing, a condition an iteration can flip), and while(true) is fine exactly when a guaranteed break lives inside. As for methods — Sheldon\'s knock is an overloaded call: knock(Penny) produces the sacred triple-knock ritual; knock(Leonard) is one perfunctory rap; knock(Penny, URGENT) escalates tempo but keeps the liturgy. Same method name, resolved by the parameter list — and everyone in the building can tell WHICH overload fired from the hallway. Bazinga: that\'s static dispatch — the signature at the call site decides.'
    },
    why: 'Zoro IS fall-through: matched his case, no break in his head, executed every street after it — while Usopp is the arrow-form switch that can\'t leak. Nami\'s day is the loop decision rule (counted → for, each element → enhanced-for, condition → while, at-least-once → do-while). Sheldon\'s Friendship Algorithm is the infinite loop whose body never changes the condition, and Howard\'s loop-counter patch is the reachable exit every loop must have. Sanji and the knock are overloading: one name, resolved from the argument list at order-writing (compile) time — and a refusal to guess when it\'s ambiguous.'
    },
  storyAnim: {
    title: 'Loguetown control flow: Usopp\'s switch, Zoro\'s fall-through, Sheldon\'s loop',
    h: 290,
    props: [
      { id: 'dirs', emoji: '📜', label: 'Nami\'s directions (the switch)', x: 10, y: 12 },
      { id: 'harbor', emoji: '⚓', label: 'case CROWDED → harbor st.', x: 34, y: 12 },
      { id: 'market', emoji: '🛒', label: 'case MARINES → market', x: 58, y: 12 },
      { id: 'main', emoji: '🛣️', label: 'default → main road', x: 82, y: 12 },
      { id: 'loop', emoji: '🔁', label: 'Sheldon\'s interest loop', x: 20, y: 56 },
      { id: 'exit', emoji: '🚪', label: '(no exit edge!)', x: 46, y: 56 },
      { id: 'counter', emoji: '🔢', label: 'Howard\'s loop counter', x: 72, y: 56 },
      { id: 'kitchen', emoji: '🍳', label: 'cook(fish) / cook(fish, spice)', x: 30, y: 86 },
      { id: 'refuse', emoji: '🙅', label: 'ambiguous order → refused', x: 68, y: 86 }
    ],
    actors: [
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 34, y: 34 },
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 10, y: 34 }
    ],
    steps: [
      { c: 'Nami writes one switch: crowded → harbor; marines → market; otherwise main road. One value in, one branch out.', p: { dirs: 'lit' } },
      { c: 'Usopp executes it arrow-style: matches CROWDED, takes the harbor street, STOPS. Modern switch — no fall-through exists.', p: { harbor: 'good' }, a: { usopp: [34, 30] } },
      { c: 'Zoro matches the same case… and keeps walking into the next instruction, and the next. Classic switch, missing break: every case after the match runs too.', p: { market: 'bad', main: 'bad' }, a: { zoro: [82, 34] } },
      { c: 'Across town, Sheldon\'s Friendship Algorithm enters the interests cycle. Ask, no, ask, no — the body never changes the condition.', p: { loop: 'lit' } },
      { c: 'Trace the flowchart: there is NO edge out of the cycle when every answer is no. Infinite while loop, live on the whiteboard.', p: { exit: 'bad' } },
      { c: 'Howard\'s patch: a counter with an exit edge — "tried N times? → move on." A reachable break. Sheldon: "a valid modification."', p: { counter: 'good', exit: 'good' }, l: { exit: 'exit: counter ≥ N → break' } },
      { c: 'Meanwhile Sanji runs overloading: cook(fish) grills, cook(fish, spice) currys — one name, the ARGUMENT LIST picks the recipe, decided when the order is written (compile time).', p: { kitchen: 'good' } },
      { c: 'And when two recipes match a vague order equally, Sanji refuses to guess: ambiguous method call, order sent back. The compiler never flips a coin.', p: { refuse: 'lit' } }
    ]
  },
  conceptFlow: {
    title: 'Choosing control flow: the decision tree you\'ll run daily',
    intro: 'Click any box to jump straight to it, or hit Play and listen.',
    stages: [
      {
        label: 'Branch',
        nodes: [
          { id: 'ifelse', text: 'if / else\n2–3 arbitrary boolean conditions' },
          { id: 'swexpr', text: 'switch EXPRESSION (->)\none value vs constants; returns a value; exhaustive' },
          { id: 'swold', text: 'classic switch\nlegacy code — mind the break!' }
        ]
      },
      {
        label: 'Loop',
        nodes: [
          { id: 'for', text: 'for\ncount is known' },
          { id: 'foreach', text: 'enhanced-for\nevery element, no index needed' },
          { id: 'while', text: 'while / do-while\ncondition-driven / at-least-once' }
        ]
      },
      {
        label: 'Escape',
        nodes: [
          { id: 'break', text: 'break / continue\nexit loop / skip iteration' },
          { id: 'guard', text: 'early return\nguard clauses beat nesting' }
        ]
      },
      {
        label: 'Methods',
        nodes: [
          { id: 'overload', text: 'overloading\nsame name, different params — compile-time pick' },
          { id: 'varargs', text: 'varargs (int... xs)\nreally an array; last position only' }
        ]
      }
    ],
    steps: [
      { active: ['ifelse'], note: 'if/else handles arbitrary boolean logic. Java demands real booleans — no truthiness — and you should brace every branch (ask Apple about goto fail).' },
      { active: ['swexpr'], note: 'One value against fixed alternatives? Modern switch: arrows, multi-label cases, yields a value, no fall-through possible, and the compiler enforces exhaustiveness over enums.' },
      { active: ['swold'], note: 'The 1995 switch statement falls through every case boundary unless you break. You\'ll READ it in every legacy codebase; prefer writing the arrow form.' },
      { active: ['for'], note: 'Known iteration count → for. The i < n half-open convention is where off-by-ones go to die — same convention as the DSA course\'s window and search patterns.' },
      { active: ['foreach'], note: 'Touching every element with no index math → enhanced-for. Can\'t write into slots through the loop variable, can\'t structurally modify the collection mid-loop (Part 3 explains the fail-fast machinery).' },
      { active: ['while'], note: 'Repetitions unknown → while (checks first: may run zero times) or do-while (body first: runs at least once — retries, menus). Sheldon\'s rule: the body must be able to change the condition, or you\'re whiteboard-looping forever.' },
      { active: ['break'], note: 'break exits the nearest loop (label to exit an outer one); continue skips ahead. while(true) + guaranteed break is a legitimate idiom — an unreachable exit is a bug.' },
      { active: ['guard'], note: 'Non-void methods must return on every path — the compiler checks. Idiomatic Java rejects pyramids: validate and return early, keep the happy path unindented.' },
      { active: ['overload'], note: 'Same name, different parameter lists; the compiler picks at the CALL SITE by argument types (exact → widening → boxing → varargs). Return type alone can\'t distinguish. Distinct from overRIDING — that\'s runtime, next lesson.' },
      { active: ['varargs'], note: 'int... values arrives as an int[]. One per method, last position. printf, List.of, and JUnit assertions all ride it — you\'ve been a varargs caller since Hello World.' }
    ]
  },
  tech: [
    {
      q: 'Why does fall-through exist in classic switch at all, and how did the modern form fix it without losing the useful part?',
      a: 'Classic switch is a direct transplant of C\'s switch, which was designed as a thin veneer over a jump table: evaluate the value, jump to the matching label, then just… keep executing — labels are entry points, not compartments. The useful part of that design was label stacking: case 1: case 2: case 3: doSomething(); break; — several values sharing one body. The bug factory was everything else: forget one break and the next case\'s code silently runs, a mistake invisible in review because the code LOOKS structured. The arrow form kept the useful part as first-class syntax — case 1, 2, 3 -> doSomething() — and made compartments real: each arrow body is self-contained, fall-through is not expressible, period. It also upgraded switch from statement to EXPRESSION (produces a value, assignable), added yield for multi-statement bodies, and brought exhaustiveness checking — over an enum, a missing case is a compile error rather than a silent skip. That last feature quietly becomes central in Part 4: sealed interfaces + exhaustive switch = the compiler proving you handled every variant of your domain model.'
    },
    {
      q: 'How exactly does the compiler resolve an overloaded call — and why does f(7) prefer f(long) over f(Integer)?',
      a: 'Resolution happens entirely at compile time, from the STATIC types of the arguments at the call site, in phases of decreasing "naturalness": phase 1 considers only exact matches and widening primitive conversions (int→long→double…) WITHOUT boxing or varargs; phase 2 adds autoboxing/unboxing; phase 3 finally admits varargs. The first phase containing any applicable method wins, and within a phase the compiler picks the MOST SPECIFIC method (f(int) beats f(long) for an int argument, because anything callable via f(int) is callable via f(long) but not vice versa). f(7): 7 is an int; phase 1 finds f(long) applicable via widening and stops — f(Integer) would need boxing, which lives in phase 2, never consulted. This ordering isn\'t arbitrary: it preserves the meaning of pre-Java-5 code (boxing and varargs arrived in Java 5; had they competed equally, existing calls would have silently changed targets — an API-compatibility lesson worth citing in design interviews). When no unique most-specific method exists, the compiler refuses with "ambiguous" rather than guessing. Two corollaries worth owning: overload choice ignores the RUNTIME type (Object o = "hi"; print(o) calls print(Object), not print(String) — the o box is typed Object, and the box type is what the compiler sees), and null literal arguments chase the most specific overload, which is why f(null) with f(String) and f(Integer) available is ambiguous but adding f(Object) doesn\'t help — String and Integer are both more specific than Object and neither beats the other.'
    },
    {
      q: 'Is the enhanced-for loop magic, or does it compile to something I already know?',
      a: 'Pure sugar, two flavors. Over an ARRAY, for (String s : arr) compiles to the classic indexed loop: for (int i = 0; i < arr.length; i++) { String s = arr[i]; … } — which explains both limits: s is a fresh copy of the element each pass (assigning s writes a local, never the slot — though remember last lesson: if elements are references, mutating THROUGH s reaches the shared object), and there\'s no exposed i for you to use. Over a COLLECTION, it compiles to the iterator protocol: Iterator<String> it = coll.iterator(); while (it.hasNext()) { String s = it.next(); … } — which explains the other rule: structurally modifying the collection mid-loop (coll.remove(x)) trips the iterator\'s fail-fast check and throws ConcurrentModificationException, because the sugar\'s hidden iterator detected the rug moving under it. The full mechanism — modCount, fail-fast semantics, and the it.remove() escape hatch — is a Part 3 headline; for now the practical rule: enhanced-for to READ, explicit iterator or removeIf to MODIFY.'
    },
    {
      q: 'When is do-while genuinely the right tool, and why do retry loops love it?',
      a: 'do-while inverts the check: body first, condition after — guaranteeing at least one execution. That maps exactly onto "act, then decide whether to act again": prompting for input until it validates (you must prompt at least once before there\'s anything to validate), rolling a die until it isn\'t a repeat, and the classic retry-with-backoff skeleton — do { response = call(); attempts++; } while (!response.ok() && attempts < max); — where making the attempt IS how you learn whether another attempt is needed. A plain while would force either duplicating the call before the loop (the redundant "priming read") or contorting the condition. Two honest cautions: do-while is the rarest loop in real codebases (single-digit percent), so don\'t force it where while reads naturally; and its condition sits far from the entry point, so keep bodies short — a 40-line do-while hides its exit logic below the fold. Notice Howard\'s Friendship Algorithm patch is literally this shape: try the interaction (body), check the counter (condition), give up after N — the at-least-once retry bounded by an attempt limit, on a whiteboard.'
    }
  ],
  code: {
    title: 'A research-log triager — every construct from this lesson, working together',
    intro: 'A miniature preview of LogPose\'s domain: triaging a day\'s research entries by type. Modern switch, three loop shapes, guard clauses, overloading, and varargs in ~45 honest lines.',
    code: `public class Triage {
    // Overload 1: triage everything with default verbosity.
    static void report(String[] entries) {
        report(entries, false);                  // delegate to the fuller overload
    }

    // Overload 2: same name, different parameter list — compile-time dispatch.
    static void report(String[] entries, boolean verbose) {
        if (entries == null || entries.length == 0) {
            System.out.println("No entries today. Touch grass.");
            return;                              // guard clause: exit early, stay flat
        }

        int ideas = 0;
        for (String entry : entries) {           // enhanced-for: every element, no index
            String kind = classify(entry);
            if (kind.equals("idea")) ideas++;
            if (verbose) System.out.println(kind + ": " + entry);
        }
        System.out.println(summarize(ideas, entries.length));
    }

    // Modern switch EXPRESSION: returns a value, no fall-through, multi-label cases.
    static String classify(String entry) {
        String prefix = entry.split(":")[0].trim().toLowerCase();
        return switch (prefix) {
            case "idea", "hunch"          -> "idea";
            case "review", "paper"        -> "reading";
            case "exp", "run", "ablation" -> "experiment";
            case "mentee", "meeting"      -> "people";
            default -> {
                if (prefix.length() > 12) yield "rambling";   // block body needs yield
                yield "misc";
            }
        };
    }

    // varargs: zero or more ints arrive as an int[]; must be the last parameter.
    static int total(int... counts) {
        int sum = 0;
        for (int c : counts) sum += c;
        return sum;
    }

    static String summarize(int ideas, int totalEntries) {
        return ideas + "/" + totalEntries + " entries were ideas"
             + (ideas == 0 ? " — go stare at a whiteboard." : ".");
    }

    public static void main(String[] args) {
        String[] today = {
            "idea: embedding cache for repeated queries",
            "review: the flaky-test detection paper",
            "exp: rerun ablation with seed 42",
            "hunch: LinkedHashMap could back the recent-entries view",
        };
        report(today);                            // picks overload 1 → delegates to 2
        report(today, true);                      // picks overload 2 directly
        System.out.println(total(1, 2, 3) + " " + total());   // varargs: 6, then 0
    }
}`,
    notes: [
      'The one-overload-delegates-to-the-other pattern (report(entries) calling report(entries, false)) is the idiomatic way to offer defaults without duplicating logic — Java\'s answer to Python\'s default parameter values, which Java deliberately lacks.',
      'classify() is a switch expression doing real work: multi-label cases, an assignable result, and a block default using yield. Rewrite it mentally as a classic switch and count the break statements you\'d have to not forget.',
      'total() with zero args returns 0, not an error — varargs happily receives an empty array. That edge case being WELL-DEFINED is why library APIs love varargs.'
    ]
  },
  lab: {
    title: 'Build the streak counter',
    prompt: 'LogPose will someday show your "research streak" — consecutive days with at least one entry. Write it now, primitives only: a public class <code>Streak</code> with (1) <code>static int longestStreak(int[] entriesPerDay)</code> — returns the length of the longest run of consecutive days with <code>entriesPerDay[i] &gt; 0</code>; must use a loop, must handle null/empty by returning 0 (guard clause!); (2) a <code>static String label(int streak)</code> using a modern <b>switch expression</b> that returns <code>"cold"</code> for 0, <code>"warming"</code> for 1–2 (multi-label case), <code>"on fire"</code> for anything else (default); (3) an overload <code>static String label(int streak, String name)</code> returning <code>name + " is " + label(streak)</code> — it must DELEGATE to the first overload; (4) a <code>main</code> that demonstrates all three on the array <code>{1,2,0,3,4,5,0,1}</code> (longest streak: 3).',
    starter: `public class Streak {

    static int longestStreak(int[] entriesPerDay) {
        // guard clause for null/empty, then one pass with two counters:
        // current run, best run.
    }

    static String label(int streak) {
        // modern switch EXPRESSION with a multi-label case:
        // 0 -> "cold"    1, 2 -> "warming"    default -> "on fire"
    }

    static String label(int streak, String name) {
        // delegate to label(int) — don't duplicate the switch
    }

    public static void main(String[] args) {
        int[] week = {1, 2, 0, 3, 4, 5, 0, 1};
        // print longestStreak(week), label(3), label(0, "Suzzana")
    }
}`,
    checks: [
      { re: 'static\\s+int\\s+longestStreak\\s*\\(\\s*int\\s*\\[\\]', must: true, hint: 'Define static int longestStreak(int[] entriesPerDay).', pass: 'longestStreak defined ✓' },
      { re: '(==\\s*null|null\\s*==)', must: true, hint: 'Guard clause: return 0 when the array is null (and when empty).', pass: 'null guard present ✓' },
      { re: '(for|while)\\s*\\(', must: true, hint: 'Compute the streak with a loop — no streams yet, that\'s Part 4.', pass: 'loop used ✓' },
      { re: 'switch\\s*\\(', must: true, hint: 'label(int) must use a switch.', pass: 'switch present ✓' },
      { re: '->', must: true, hint: 'Use the modern ARROW form (case 0 -> ...), not colon-and-break.', pass: 'arrow cases ✓' },
      { re: 'case\\s+1\\s*,\\s*2\\s*->', must: true, hint: 'Use one multi-label case for 1 and 2: case 1, 2 -> "warming".', pass: 'multi-label case ✓' },
      { re: 'static\\s+String\\s+label\\s*\\(\\s*int\\s+\\w+\\s*,\\s*String', must: true, hint: 'Add the two-parameter overload label(int, String).', pass: 'overload defined ✓' },
      { re: 'label\\s*\\(\\s*\\w+\\s*\\)', must: true, hint: 'The overload must DELEGATE to label(int) rather than repeating the switch.', pass: 'delegation ✓' },
      { re: 'break\\s*;', must: false, hint: 'No break statements — the arrow form makes them impossible, which is the point.', pass: 'no break needed — arrow form ✓' }
    ],
    run: 'save as <code>Streak.java</code>, then <code>javac Streak.java && java Streak</code>. Expected: 3, "on fire", "Suzzana is cold". Then break it on purpose: change a case to cover only 1, and watch what the compiler does NOT say (int switches aren\'t exhaustiveness-checked without a default — enums, later, are).',
    solution: `public class Streak {

    static int longestStreak(int[] entriesPerDay) {
        if (entriesPerDay == null || entriesPerDay.length == 0) return 0;
        int best = 0, current = 0;
        for (int entries : entriesPerDay) {
            if (entries > 0) {
                current++;
                if (current > best) best = current;
            } else {
                current = 0;
            }
        }
        return best;
    }

    static String label(int streak) {
        return switch (streak) {
            case 0    -> "cold";
            case 1, 2 -> "warming";
            default   -> "on fire";
        };
    }

    static String label(int streak, String name) {
        return name + " is " + label(streak);
    }

    public static void main(String[] args) {
        int[] week = {1, 2, 0, 3, 4, 5, 0, 1};
        System.out.println(longestStreak(week));      // 3
        System.out.println(label(3));                  // on fire
        System.out.println(label(0, "Suzzana"));       // Suzzana is cold
    }
}`,
    notes: [
      'longestStreak\'s two-counter shape (current run + best-so-far) is a micro-pattern you\'ll reuse constantly — it\'s the skeleton of the DSA course\'s sliding-window family.',
      'The delegating overload is three lines because the switch lives in exactly one place. If you copied the switch into both, you built tomorrow\'s inconsistency bug today.',
      'This exact function — streaks over daily entry counts — ships in LogPose\'s dashboard (Part 14). You just wrote your first line of the capstone.'
    ]
  },
  quiz: [
    {
      q: 'In a classic switch statement, what happens when a matched case has no break?',
      options: ['Execution falls through into the next case\'s code and keeps going until a break or the end of the switch', 'A compile error — break is mandatory', 'The switch exits after the matched case automatically', 'Only the default case runs'],
      correct: 0,
      explain: 'Zoro in Loguetown: matched his street, kept walking into everyone else\'s. The arrow form (case X ->) makes this leak inexpressible — one more reason it\'s the default choice.'
    },
    {
      q: 'Which loop guarantees its body executes at least once?',
      options: ['do-while — the body runs before the condition is ever checked', 'while', 'for', 'enhanced-for'],
      correct: 0,
      explain: 'Body first, question after — Luffy eats, then asks if anyone\'s hungry. Right tool for retries and input validation, where acting once is how you learn whether to act again.'
    },
    {
      q: 'Can two overloads differ ONLY in return type — int f() and double f()?',
      options: ['No — compile error; the call site f() couldn\'t indicate which one it means, so return type alone can never distinguish overloads', 'Yes — the compiler infers from the assignment target', 'Yes, but only for static methods', 'Only if one is marked @Overload'],
      correct: 0,
      explain: 'Overload resolution works from the argument types at the call site. A bare f(); gives the compiler nothing to choose with — so the language forbids the situation entirely.'
    },
    {
      q: 'Given f(long) and f(Integer), which does f(7) call, and why?',
      options: ['f(long) — widening a primitive (int→long) is preferred over autoboxing (int→Integer) in overload resolution', 'f(Integer) — boxing is more modern, so it wins', 'Compile error — always ambiguous', 'Whichever was declared first in the file'],
      correct: 0,
      explain: 'Resolution phases: exact/widening first, boxing second, varargs last — ordered so that pre-Java-5 code kept its meaning when boxing arrived. Widening wins without boxing ever being consulted.'
    },
    {
      q: 'What is Sheldon\'s Friendship Algorithm bug, in loop terms — and Howard\'s fix?',
      options: ['An infinite loop: the cycle\'s exit condition can never be satisfied by anything the body does; the fix is a reachable exit — a loop counter with a break/exit edge after N attempts', 'An off-by-one error in the flowchart', 'A missing default case in a switch', 'Unreachable code after a return'],
      correct: 0,
      explain: 'Ask-about-interests → no → ask-about-interests: no state changes, no path out. Howard\'s counter is the bounded-retry idiom: the body now changes something (attempts++) that the exit condition actually reads.'
    }
  ],
  testFlow: {
    title: 'Test yourself: traffic laws under pressure',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You\'re iterating a List of entries with enhanced-for and want to delete the ones matching a filter, in place. What happens with list.remove(entry) inside the loop?',
        choices: [
          { text: 'ConcurrentModificationException (typically) — the hidden iterator detects structural change; use an explicit Iterator with it.remove(), or list.removeIf(filter)', to: 'q1_right' },
          { text: 'Works fine — enhanced-for handles removal', to: 'q1_wrong_fine' },
          { text: 'Compile error — remove can\'t be called inside loops', to: 'q1_wrong_compile' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Right — enhanced-for over a collection is sugar for the iterator protocol, and the iterator fail-fasts when the collection changes under it. removeIf is the clean modern answer; the full modCount mechanism is a Part 3 headline. Knowing WHY (hidden iterator) beats memorizing the rule.', next: 'q2' },
      q1_wrong_fine: { end: true, correct: false, text: 'It compiles and it detonates: the loop\'s hidden iterator notices the structural modification and throws ConcurrentModificationException — usually on the NEXT iteration, which makes it look spooky. Enhanced-for is for reading.', retry: 'q1' },
      q1_wrong_compile: { end: true, correct: false, text: 'The compiler has no idea remove() is dangerous here — the failure is a RUNTIME check inside the iterator. Compile-time vs run-time, the axis again: this trap lives on the runtime side.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'Object o = "hello"; and overloads print(String s) / print(Object x) exist. Which runs for print(o), and what decides?',
        choices: [
          { text: 'print(Object) — overload resolution is compile-time and uses the STATIC type of o (Object), not what it happens to hold at runtime', to: 'q2_right' },
          { text: 'print(String) — o actually contains a String', to: 'q2_wrong_runtime' },
          { text: 'Ambiguous — compile error', to: 'q2_wrong_amb' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Exactly — the compiler sees a box labeled Object and resolves against the label, not the contents. The counterpart mechanism — dispatch on the RUNTIME object — is overriding, next lesson, and keeping the two straight is a classic interview discriminator.', next: 'q3' },
      q2_wrong_runtime: { end: true, correct: false, text: 'Overloading never looks at runtime contents — it\'s resolved at compile time from declared types. (Runtime dispatch exists, but it\'s overRIDING, and it picks among methods with the SAME signature — next lesson.)', retry: 'q2' },
      q2_wrong_amb: { end: true, correct: false, text: 'No tie here: the static type is Object, print(Object) matches it exactly, done. Ambiguity errors arise when two overloads match equally well — like f(null) offered both f(String) and f(Integer).', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A retry must attempt a network call at least once and give up after 5 failures. Which skeleton is most honest?',
        choices: [
          { text: 'do { result = call(); attempts++; } while (!result.ok() && attempts < 5); — body-first matches "attempt at least once", and the counter makes the exit reachable', to: 'q3_right' },
          { text: 'while (!result.ok()) { result = call(); } — simple and clean', to: 'q3_wrong_unbounded' },
          { text: 'for (int i = 0; i < 5; i++) { call(); } — five attempts, done', to: 'q3_wrong_always5' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Right on both axes: do-while encodes "act, then decide" (no fake priming call before the loop), and the attempt counter is Howard\'s patch — an exit the body actually advances. Add backoff between attempts and you\'ve written production retry code.', next: null },
      q3_wrong_unbounded: { end: true, correct: false, text: 'Two bugs: result is read before it\'s ever assigned (won\'t compile as written), and there\'s no attempt limit — a permanently failing endpoint traps you in Sheldon\'s interest loop. Bound your retries.', retry: 'q3' },
      q3_wrong_always5: { end: true, correct: false, text: 'This always makes 5 calls — it never checks success, so a first-try success still fires 4 redundant (possibly harmful!) attempts. The loop must read the result: exit on ok OR on exhausting attempts.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Missing break in a classic switch — the matched case bleeds into the next. Prefer the arrow form, which cannot express the bug; when stuck editing legacy colon-form, read every case asking "where does this stop?"',
    'Off-by-one at loop boundaries — i <= n where you meant i < n visits one element too many (or ArrayIndexOutOfBounds). Standardize on half-open ranges: for (int i = 0; i < n; i++) does n iterations, full stop.',
    'Loops whose body can\'t change the exit condition — Sheldon\'s Friendship Algorithm. Every while deserves the question: "which statement in this body moves us toward false?" If nothing does, you\'ve drawn his whiteboard.',
    'Modifying a collection inside enhanced-for — ConcurrentModificationException at runtime. Read with enhanced-for; mutate with removeIf or an explicit iterator.',
    'Overload ambiguity with null and with mixed widening/boxing — f(null) against f(String)/f(Integer) won\'t compile; f(1, 2) against f(int, long)/f(long, int) won\'t either. The compiler refuses ties: disambiguate with a cast, or redesign the overloads.',
    'Duplicating logic across overloads instead of delegating — the two copies WILL drift. One overload holds the logic; the others forward to it with defaults filled in.'
  ],
  interview: [
    {
      q: 'What\'s the difference between the classic switch statement and the modern switch expression? When would you use each?',
      a: 'Classic switch (Java 1.0, from C): a STATEMENT with colon-labeled cases that fall through unless explicitly broken — every case boundary is a potential silent bug, though label stacking (case A: case B: shared body) was a legitimate idiom the design enabled. Modern switch (standardized Java 14): arrow-labeled cases that are self-contained compartments — fall-through is syntactically impossible, multiple labels per case replace stacking (case A, B ->), and the construct is an EXPRESSION producing a value (with yield for block bodies), so results assign directly instead of mutating a variable declared outside. It also enforces exhaustiveness: switching over an enum must cover every constant or provide default, turning "forgot a case" from a runtime silence into a compile error — which compounds powerfully with sealed types and pattern matching (Java 17–21), where switch becomes the language\'s type-safe decomposition tool. Use the arrow form for all new code; fluency in the colon form remains mandatory because two decades of production Java is written in it, and the interview question "what does this print with the missing break?" never dies.'
    },
    {
      q: 'Explain overloading vs overriding — the classic discriminator question.',
      a: 'Overloading: several methods in the same class (or inherited into it) sharing a NAME but differing in PARAMETER LISTS. The compiler selects the target at COMPILE time from the static types of the arguments at the call site — phases: exact match and widening first, then autoboxing, then varargs, most-specific wins, ambiguity is a compile error. Return type alone cannot distinguish overloads. Overriding: a SUBCLASS re-implements a method with the SAME signature from its superclass; the JVM selects the implementation at RUNTIME from the actual class of the receiver object — dynamic dispatch, the mechanism that makes polymorphism work (full treatment: inheritance lesson). The trap that proves understanding: Object o = "text"; with print(String) and print(Object) overloads — print(o) calls print(Object), because overload resolution reads the declared type of o, not its runtime contents; the String-ness of the object matters only to overriding-style dispatch, never to overload choice. One-liner for the interviewer: "overloading is resolved by the compiler from argument types; overriding is resolved by the JVM from the receiver object."'
    },
    {
      q: 'How do varargs work under the hood, and what design cautions come with them?',
      a: 'A varargs parameter — void log(String fmt, Object... args) — is compiled as an array parameter with a flag: inside the method, args IS an Object[], and at each call site the compiler packs the trailing arguments into a freshly allocated array (or passes through an existing array if the caller supplies one directly). Zero trailing arguments produce an empty array, not null — a well-defined edge that makes APIs pleasant. Constraints: one varargs parameter per method, last position only. Cautions worth naming in design discussions: (1) each call allocates an array, so ultra-hot paths sometimes add fixed-arity overloads to avoid it — exactly why List.of() ships of(), of(e1), of(e1,e2)… up to ten elements before the varargs form; (2) varargs lose to every other match in overload resolution (last phase), which can surprise; (3) generic varargs (T... args) generate heap-pollution warnings because arrays and generics mix badly — the @SafeVarargs annotation exists to document/suppress that when the method provably never abuses the array (full story in Part 3\'s generics lesson); (4) an ambiguity classic: passing a single null to log(Object...) — is it a null array or an array containing null? (The compiler warns; cast to resolve.) Everyday examples to cite: printf, String.format, List.of, JUnit\'s assertAll.'
    },
    {
      q: 'A code review shows: for (int i = 0; i <= items.length; i++) { process(items[i]); } — what\'s wrong, what happens, and what\'s the idiomatic fix?',
      a: 'Off-by-one: the condition i <= items.length lets i reach items.length, and arrays are zero-indexed — valid indices run 0 to length−1 — so the final iteration throws ArrayIndexOutOfBoundsException. Note the failure is at RUNTIME: the compiler doesn\'t track index ranges (that analysis is undecidable in general), so the safety net is the JVM\'s mandatory bounds check on every array access — which is itself worth a sentence: Java trades a tiny per-access cost (mostly optimized away by the JIT once it proves the loop stays in range — bounds-check elimination, a nice callback to how the JIT uses runtime knowledge) for the guarantee that out-of-range access throws instead of silently reading adjacent memory like C. Fixes in order of idiomatic preference: if the index isn\'t needed, the enhanced-for eliminates the entire bug class — for (var item : items) process(item); if the index IS needed, the canonical half-open form i < items.length. The systemic answer for reviews: adopt the half-open convention everywhere (start inclusive, end exclusive — n iterations from 0 to n−1), which is also the convention of substring, subList, Arrays.copyOfRange, and every DSA-course window pattern — one convention, zero re-derivations per loop.'
    }
  ]
};
