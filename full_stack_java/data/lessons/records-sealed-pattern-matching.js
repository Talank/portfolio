window.LESSONS = window.LESSONS || {};
window.LESSONS['records-sealed-pattern-matching'] = {
  id: 'records-sealed-pattern-matching',
  title: 'Records, Sealed Classes & Pattern Matching: Modeling Data the Modern Way',
  category: 'Part 4 — Modern Java',
  timeMin: 45,
  summary: 'The strings/equals/hashCode lesson promised that a "record" generates a correct equals, hashCode, and toString from its components — this lesson delivers on that promise and adds two features designed to work with it. Records are compact, immutable data carriers. Sealed interfaces let you say "these are ALL the kinds there will ever be" — a closed, finite set of subtypes the compiler knows completely. And pattern matching (instanceof and switch) lets you check a type and extract its data in one motion, with the compiler REFUSING to compile a switch over a sealed type that forgets a case. Together, these three features are how modern Java models "one of a fixed set of possible shapes" data — exactly the shape of LogPose\'s event log.',
  goals: [
    'Write a record for an immutable value carrier and explain exactly what the compiler generates for you',
    'Use a compact constructor to validate or normalize a record\'s components at construction time',
    'Use instanceof pattern matching to check a type and bind a variable to it in one step, replacing the check-then-cast dance',
    'Declare a sealed interface with a permits clause and explain what a closed type hierarchy buys you',
    'Write an exhaustive switch pattern match over a sealed type, including record deconstruction patterns and guards, with no default branch'
  ],
  concept: [
    {
      h: 'Records: what they generate, and the compact constructor',
      p: [
        'A <code>record</code> declares an immutable data carrier in one line: <code>record WantedPoster(String name, long bounty, String artist) {}</code> generates, automatically, everything the strings-equals-hashcode lesson told you to hand-write: a canonical constructor taking all three components in order; private final fields for each; PUBLIC ACCESSOR methods named after the components — <code>name()</code>, <code>bounty()</code>, <code>artist()</code>, notably NOT <code>getName()</code>; a correct <code>equals</code> comparing all components; a matching <code>hashCode</code> combining all components; and a readable <code>toString</code> like <code>WantedPoster[name=Luffy, bounty=3000000000, artist=Usopp]</code>. Every field is implicitly <code>private final</code> — there is no way to declare a mutable record component — which is the whole design point: a record is a statement that "this type IS its data, immutably, nothing more."',
        'A <b>compact constructor</b> lets you validate or normalize components WITHOUT restating the parameter list or the field assignments: <code>record WantedPoster(String name, long bounty, String artist) { WantedPoster { if (bounty < 0) throw new IllegalArgumentException("bounty can\'t be negative"); name = name.trim(); } }</code> — notice there\'s no parameter list and no explicit <code>this.name = name</code> at the end; the compiler still performs the normal field assignment AFTER your compact constructor body runs, using whatever the (possibly reassigned) parameter variables hold. This is precisely the normalize-in-the-constructor pattern the strings lesson\'s <code>EntryKey</code> hand-wrote manually — a record gives you the same guarantee with far less code and no chance of forgetting a field in <code>equals</code> or <code>hashCode</code>. Records CAN implement interfaces (<code>record IdeaLogged(String text) implements LogEvent {}</code>) and can have additional methods and static fields/methods in their body — the restriction is only on instance state: no extra instance fields beyond the declared components, and no way to make a component mutable.'
      ]
    },
    {
      h: 'instanceof pattern matching: check and bind in one motion',
      p: [
        'The classic type-check-then-cast dance — <code>if (obj instanceof Sword) { Sword s = (Sword) obj; s.sharpen(); }</code> — checks the type, THEN separately casts, THEN separately declares a variable to hold the cast result: three redundant steps for one fact you already established. Pattern matching for <code>instanceof</code>, added in Java 16, collapses this to one step: <code>if (obj instanceof Sword s) { s.sharpen(); }</code> — the moment the <code>instanceof</code> check succeeds, <code>s</code> is BOUND to <code>obj</code>, already cast to <code>Sword</code>, and is in scope for the rest of that branch. No separate cast, no possibility of casting to the wrong type by typo, no redundant restatement of the type name.',
        'The pattern variable\'s scope follows the CONTROL FLOW, not just the block — this is called <b>flow scoping</b>, and it\'s more precise than ordinary variable scoping. <code>if (!(obj instanceof Sword s)) { return; } s.sharpen();</code> compiles: because the <code>if</code> body returns whenever the pattern DOESN\'T match, the compiler can prove that any code reachable after the <code>if</code> only runs when <code>obj instanceof Sword</code> was true, so <code>s</code> is safely in scope there too, outside the braces that contain the pattern. This flow-sensitive scoping is what makes pattern matching compose cleanly with early-return guard clauses, a very common real-world shape, without forcing you to nest everything inside the <code>if</code> block.'
      ]
    },
    {
      h: 'Sealed interfaces and classes: naming a CLOSED, finite set of subtypes',
      p: [
        'An ordinary interface or abstract class is OPEN — anyone, anywhere, in any file, can add a new implementation or subclass without your knowledge or permission. A <code>sealed</code> type flips that: <code>sealed interface DevilFruit permits Paramecia, Zoan, Logia {}</code> declares that these THREE types, named explicitly in the <code>permits</code> clause, are the COMPLETE, exhaustive set of direct subtypes that will EVER exist — the compiler enforces this at compile time, rejecting any other class\'s attempt to implement <code>DevilFruit</code>. Every type named in <code>permits</code> must itself declare how it continues the hierarchy: <code>final</code> (no further subtyping allowed — the common case, especially for records, which are implicitly final anyway), <code>sealed</code> (continues the closed hierarchy one more level, with its own permits clause), or <code>non-sealed</code> (deliberately REOPENS this one branch to arbitrary subclasses — an explicit escape hatch you have to opt into by name, so it\'s never accidental).',
        'The payoff for closing the hierarchy is exhaustiveness checking, which the next section covers, but the design motivation is worth stating directly: sealed types are for domains where the SET of possibilities is a fact about the problem, not an accident of how the code happens to be organized today. There really are exactly three devil fruit types in the One Piece world; there really is a fixed, finite set of shapes in a graphics library, HTTP methods in a routing table, or event kinds in an append-only log. When that\'s true, telling the compiler "this set is closed" turns "did I handle every case?" from a code-review question and a runtime risk into a COMPILE ERROR the moment you forget one — which is exactly what the next section demonstrates.'
      ]
    },
    {
      h: 'Switch pattern matching: exhaustive, and no default needed',
      p: [
        'Java\'s <code>switch</code> gained the same pattern-matching power as <code>instanceof</code>: <code>switch (fruit) { case Paramecia p -> "shape-changing"; case Zoan z -> "hybrid form"; case Logia l -> "elemental"; }</code> checks the runtime type of each case AND binds a pattern variable, all in the case label — no cast, no instanceof chain, no fall-through by default (the <code>-></code> arrow form doesn\'t fall through; each case is a self-contained branch, unlike the old colon-and-break form the control-flow lesson covered). The genuinely new capability: when the switch\'s subject is a SEALED type and every permitted subtype has its own case, the compiler can PROVE the switch is exhaustive — every possible runtime value is covered — and lets you OMIT the <code>default</code> branch entirely. If someone later adds a fourth permitted type to the sealed interface, every switch like this one across the ENTIRE codebase that lacks a case for it now fails to COMPILE, not silently misbehaves at runtime — the compiler forces you to go update every place that needs to know about the new case, the moment you add it.',
        'Switch patterns compose with two more features that make them genuinely expressive for data-shaped types. <b>Record deconstruction patterns</b> destructure a record\'s components directly in the case label: <code>case Zoan(String animalForm) -> "a " + animalForm + " hybrid"</code> — no separate call to <code>.animalForm()</code> needed, the component is bound to a new local variable right there, and this nests arbitrarily deep for records containing records. <b>Guards</b> (the <code>when</code> clause) add a boolean condition to a case, checked only after the pattern already matched: <code>case Zoan z when z.isAwakened() -> "an awakened hybrid"</code> falls through to the next case if the pattern matches but the guard is false, letting you split one type into multiple, ordered, conditionally-matched branches — which is also why case ORDER matters once guards are involved, the same as an if/else-if chain.'
      ]
    },
    {
      h: 'Putting it together: modeling a closed event log the modern way',
      p: [
        'The combination — a sealed interface naming every possible SHAPE of data, records implementing each shape, and an exhaustive switch pattern match processing them — is the modern, idiomatic replacement for what used to require either a fragile chain of <code>instanceof</code> checks (easy to forget a case, no compiler help) or the heavyweight Visitor design pattern (a whole extra interface and a method per visitor just to get the compiler\'s help). <code>sealed interface LogEvent permits IdeaLogged, PaperReviewed, ExperimentRun {}</code> with each variant a record, plus one exhaustive switch, gives you type-safe, compiler-checked handling of "every kind of thing that can happen in the log" with a fraction of the ceremony either older approach required.',
        'This is precisely LogPose\'s event-log shape: a research log genuinely has a closed, small set of THINGS that can be logged — an idea, a paper review, an experiment run, and whatever else the app\'s design settles on — and every place in the app that processes the log (rendering a timeline, computing a weekly summary, exporting to a file) benefits from the compiler refusing to compile if a new event kind is added and some processor forgets to handle it. This is the payoff of "modeling data the modern way": the type system itself enforces that your code stays in sync with your domain\'s actual shape, rather than trusting a comment or a code review to catch the drift.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The wanted-poster template, and Chopper\'s exactly-three-types devil fruit chart',
      text: 'Every Marine outpost fills out wanted posters from one fixed TEMPLATE — name, bounty, sketch artist, nothing more, nothing less — and the moment a clerk has those three facts, the poster is complete: no clerk hand-writes "hereby, the following individual, known by the name of..." from scratch each time, no clerk forgets to note the bounty and leaves a poster silently broken (a record: a fixed set of components, auto-generating everything boilerplate around them — construction, comparison, printable form — with a compact constructor rejecting a poster someone tries to file with a NEGATIVE bounty). Zoro, drawing from a weapons rack mid-fight, doesn\'t stop to ask "is this a sword," THEN separately grip it, THEN separately decide how to swing it — he identifies-and-grips in one motion, and from that same motion he already knows how to use it (instanceof pattern matching: the check and the usable, typed reference happen together, not in three separate steps). Chopper, the ship\'s doctor, keeps ONE diagnostic chart for devil fruits, and it lists EXACTLY three categories, no more: Paramecia, Zoan, Logia — carved into his training the way the World\'s own science has settled the matter, and nobody, anywhere, gets to invent a fourth category without the entire field of Devil Fruit science changing (a sealed interface: DevilFruit permits Paramecia, Zoan, Logia — a closed, complete, named set). When Chopper actually diagnoses a patient\'s power, his chart runs through the three categories as a single decision — Paramecia, shape-changing; Zoan, hybrid transformation; Logia, elemental — and because his OWN training insists the three categories are the WHOLE world of possibilities, he never needs a fallback "or something else" branch; leaving one of the three undiagnosed would be a glaring gap in his OWN training, one he\'d catch immediately, the same way the compiler catches a switch over a sealed type that forgets a case (exhaustive switch pattern matching, no default needed). And when his diagnosis needs the SPECIFIC hybrid form of a Zoan patient, he doesn\'t separately ask "what animal, then" as a second question — his chart pulls the animal form straight out of the diagnosis in the same step, the way a record pattern destructures a component directly in the case label: "Zoan, hybrid form: reindeer" in one motion, not two.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s comic index cards, and the closed three-category infraction chart',
      text: 'Sheldon indexes his comic collection on identical CARDS — title, issue number, condition grade, nothing more — and filling one out is purely mechanical: the moment those three facts are known, the card is complete and automatically comparable to any other card by the same three fields, with no hand-written boilerplate and a strict rule rejecting a card someone tries to file with a NEGATIVE condition grade (a record: components generate the comparison and construction machinery for you, plus a compact-constructor validation). When Sheldon spots a prop at a costume party, he doesn\'t ask "is this a Klingon bat\'leth," THEN separately confirm it, THEN separately decide how to critique its historical inaccuracy — he identifies-and-critiques in one motion, already holding the specific, typed thing he\'s talking about (instanceof pattern matching: check and bind together). The Roommate Agreement\'s infraction clause lists EXACTLY three categories, and Sheldon insists — repeatedly, loudly — that this is the COMPLETE set: Minor, Major, Catastrophic, and no one, not even Leonard co-signing a new clause, gets to invent a fourth category without a formal, notarized amendment to the whole document (a sealed hierarchy: closed, named, complete). When Sheldon\'s personal punishment matrix processes an actual infraction, it runs the three categories as one decision — Minor, a stern look; Major, a formal written warning; Catastrophic, immediate invocation of the Roommate Agreement\'s emergency clause — and because his own rules insist those three ARE the whole world of infractions, he never writes a vague "or whatever else" fallback branch; missing one of the three would be Sheldon catching HIMSELF in an incomplete rule set, exactly the way the compiler catches an unhandled case in a switch over a sealed type. And when his punishment matrix needs the SPECIFIC description of a Major infraction — say, "unauthorized thermostat adjustment" — he doesn\'t ask a separate follow-up question; the matrix pulls the description straight out of the infraction record in the very same step it identifies the category, one motion instead of two.',
    },
    why: 'The wanted-poster/index-card template is a record: a fixed set of named components that auto-generate construction, comparison, and printable form, with a compact constructor validating input at the door. The single-motion identify-and-grip/identify-and-critique is instanceof pattern matching: check the type and bind a usable, already-cast variable in one step. Chopper\'s exactly-three-category chart and Sheldon\'s exactly-three-category infraction clause are sealed interfaces: a closed, completely-named set of subtypes the compiler holds you to. And each of them handling every category as one decision, with no "or something else" fallback because their OWN training/rules insist the set is complete, is exhaustive switch pattern matching — the compiler refuses to compile a switch over a sealed type that leaves a case unhandled, and record deconstruction patterns let you pull a specific field straight out of the match in the same motion.'
  },
  storyAnim: {
    title: 'The poster template, the one-motion identify-and-grip, and the closed three-category chart',
    h: 320,
    props: [
      { id: 'template', emoji: '📋', label: 'wanted-poster template: 3 fields, everything else generated (record)', x: 12, y: 10 },
      { id: 'compact', emoji: '🛑', label: 'compact constructor rejects a negative bounty', x: 40, y: 10 },
      { id: 'instof', emoji: '⚔️', label: 'Zoro: identify-and-grip in ONE motion (instanceof pattern)', x: 70, y: 10 },
      { id: 'chart', emoji: '📊', label: 'Chopper\'s chart: exactly 3 fruit types, no 4th allowed (sealed)', x: 16, y: 46 },
      { id: 'exhaustive', emoji: '✅', label: 'diagnosis covers all 3 — no "or something else" fallback', x: 50, y: 46 },
      { id: 'destructure', emoji: '🦌', label: 'pulls the animal form straight out in the same step (record pattern)', x: 82, y: 46 },
      { id: 'newcase', emoji: '🚨', label: 'add a 4th type → every unhandled chart fails to compile', x: 50, y: 80 }
    ],
    actors: [
      { id: 'zoro', emoji: '⚔️', label: 'Zoro', x: 70, y: 26 },
      { id: 'chopper', emoji: '🦌', label: 'Chopper', x: 16, y: 62 }
    ],
    steps: [
      { c: 'A wanted poster is filled from one fixed template — name, bounty, artist. The moment those three facts exist, everything else about the poster (comparing, printing, filing) works automatically.', p: { template: 'good' } },
      { c: 'Try to file a poster with a negative bounty and the clerk rejects it on the spot, before it\'s ever filed. That\'s a compact constructor validating at construction time.', p: { compact: 'bad' } },
      { c: 'Zoro doesn\'t check "is this a sword" then separately grip it — he identifies and grips in one motion, already knowing how to use exactly what he\'s holding. That\'s instanceof pattern matching.', p: { instof: 'good' }, a: { zoro: [70, 26] } },
      { c: 'Chopper\'s diagnostic chart names EXACTLY three devil fruit categories. Nobody can claim a fourth without the World\'s science itself changing. That\'s a sealed interface\'s permits clause.', p: { chart: 'lit' }, a: { chopper: [16, 62] } },
      { c: 'His diagnosis runs through all three as one decision, with no "or something else" branch — because his own training insists those three ARE the whole world of possibilities. Exhaustive switch, no default.', p: { exhaustive: 'good' } },
      { c: 'When he needs the specific hybrid animal form, his chart pulls it straight out of the diagnosis in the same step, not a separate follow-up question. That\'s a record deconstruction pattern.', p: { destructure: 'lit' } },
      { c: 'If Devil Fruit science ever discovered a FOURTH category, every diagnostic chart across every doctor that doesn\'t account for it would need updating immediately — the compiler equivalent of Chopper catching a gap in his own training.', p: { newcase: 'bad' } }
    ]
  },
  conceptFlow: {
    title: 'Records, instanceof patterns, sealed types, and exhaustive switch',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Records: compact, immutable data',
        nodes: [
          { id: 'declare', text: 'record WantedPoster(String name, long bounty) {}\ngenerates ctor, accessors, equals, hashCode, toString' },
          { id: 'compactctor', text: 'compact constructor\nvalidate/normalize, no field-assignment boilerplate' }
        ]
      },
      {
        label: 'instanceof pattern matching',
        nodes: [
          { id: 'oldway', text: 'old: instanceof, THEN cast, THEN declare\n3 redundant steps' },
          { id: 'newway', text: 'new: if (obj instanceof Sword s)\ncheck + bind in one step' }
        ]
      },
      {
        label: 'Sealed: name the closed set',
        nodes: [
          { id: 'permits', text: 'sealed interface X permits A, B, C\ncompiler enforces: no other subtype' },
          { id: 'subtypes', text: 'each of A, B, C is final / sealed / non-sealed\nmust declare how it continues' }
        ]
      },
      {
        label: 'Exhaustive switch pattern matching',
        nodes: [
          { id: 'exhaustive', text: 'switch over a sealed type,\none case per permitted subtype → no default needed' },
          { id: 'deconstruct', text: 'case Zoan(String form) ->\nrecord pattern: destructure inline' },
          { id: 'guard', text: 'case Zoan z when z.isAwakened() ->\nguard: extra condition after the match' }
        ]
      }
    ],
    steps: [
      { active: ['declare'], note: 'A record\'s component list IS its whole state — the compiler generates the constructor, accessors, equals, hashCode, and toString from just that list.' },
      { active: ['compactctor'], note: 'A compact constructor (no parameter list, no explicit field assignment) lets you validate or normalize before the compiler performs its normal field assignment afterward.' },
      { active: ['oldway'], note: 'The pre-Java-16 dance: instanceof check, then a separate cast, then a separate variable declaration — three steps to establish one fact.' },
      { active: ['newway'], note: 'Pattern matching collapses all three into one: the pattern variable is bound, already correctly typed, the instant the check succeeds — and stays in scope via flow-scoping wherever the compiler can prove the check was true.' },
      { active: ['permits'], note: 'permits names the COMPLETE set of direct subtypes. Any class outside that list attempting to implement/extend the sealed type fails to compile.' },
      { active: ['subtypes'], note: 'Each permitted type must say how the hierarchy continues: final (done), sealed (closed one more level), or non-sealed (a deliberate, explicit reopening).' },
      { active: ['exhaustive'], note: 'A switch over a sealed type with one case per permitted subtype is provably exhaustive — the compiler lets you skip default, and adding a new permitted type later breaks compilation everywhere a case is missing.' },
      { active: ['deconstruct'], note: 'Record patterns destructure components directly in the case label — no separate accessor calls needed, and it nests for records containing records.' },
      { active: ['guard'], note: 'A when clause adds a condition checked only after the pattern matches — letting one type split into multiple ordered, conditionally-matched branches.' }
    ]
  },
  tech: [
    {
      q: 'Exactly what does the compiler generate for a record, and what are the constraints on record components?',
      a: 'For record Point(int x, int y) {}, the compiler generates: a canonical (all-args) constructor assigning each parameter to a like-named private final field, in declaration order; public accessor methods named EXACTLY after each component — x() and y(), not getX()/getY(), a deliberate departure from JavaBean convention since records aren\'t beans; an equals(Object) that returns true only for another instance of the same record type with equal corresponding components (using each component\'s own equals, or == for primitives); a hashCode() combining all components consistently with that equals; and a toString() in the form Point[x=1, y=2]. Every component becomes an implicitly private final field — there is categorically no way to declare a mutable record component, and there is no way to add extra INSTANCE fields beyond the declared components (though you can add static fields, static methods, and additional instance methods with bodies in the record\'s body, and you can implement interfaces). A record is implicitly final (cannot be extended) and implicitly implements Serializable-friendly semantics if you choose to add that interface, but records cannot extend any class (they implicitly extend java.lang.Record) — the whole design is "this type is exactly its immutable data, full stop," which is precisely the value-class shape the strings-equals-hashcode lesson said records are the modern default for.'
    },
    {
      q: 'Explain the compact constructor: syntax, what it\'s for, and what the compiler still does automatically.',
      a: 'A compact constructor is written INSIDE a record body with the record\'s name but NO parameter list and no parentheses: record WantedPoster(String name, long bounty) { WantedPoster { if (bounty < 0) throw new IllegalArgumentException("bounty must be non-negative"); name = name.trim(); } }. Its purpose is validating or normalizing the incoming component values before they become the record\'s permanent, immutable state — exactly the job the strings lesson\'s hand-written EntryKey constructor did manually (trimming, lowercasing, rejecting invalid input), now expressed with far less ceremony. Two things happen automatically that you don\'t write yourself: first, the compact constructor\'s parameters are IMPLICITLY the record\'s declared components (name and bounty are already in scope, no need to redeclare them); second, AFTER the compact constructor\'s body finishes running, the compiler still performs the normal field assignment (this.name = name; this.bounty = bounty;) using whatever the parameter variables currently hold — which is exactly why reassigning name = name.trim(); inside the compact constructor works: you\'re mutating the local parameter variable before the compiler\'s implicit assignment reads it, not mutating a field directly (there is no this.name = ... available to write in a compact constructor; that line would be a compile error, since the compiler owns that assignment). If you need to reject invalid input entirely, throwing inside the compact constructor (as with the negative-bounty check) prevents the record instance from ever being constructed at all — the strongest possible guarantee that an invalid WantedPoster can never exist.'
    },
    {
      q: 'What does a sealed interface actually enforce, and what are the three options for each permitted subtype?',
      a: 'sealed interface DevilFruit permits Paramecia, Zoan, Logia {} tells the compiler that ONLY the types named in the permits clause — and no others, ever, from any file, any package, any future contributor — may directly implement DevilFruit. This is enforced at compile time: a fourth class anywhere attempting implements DevilFruit without being listed in permits simply fails to compile. (A technical detail: permitted subtypes must generally live in the same module, or if no module system is used, the same package, as the sealed type — this is what makes the closed-set guarantee actually verifiable by the compiler rather than just a comment-level promise.) Each type named in permits must itself declare exactly how it continues the hierarchy, and Java requires one of three explicit choices: final — the common case, meaning this subtype cannot be extended further, closing that branch completely (records are implicitly final already, so record Paramecia(...) implements DevilFruit needs no extra keyword); sealed — this subtype continues the closed hierarchy one MORE level, with its own permits clause naming ITS allowed subtypes; or non-sealed — a deliberate, explicitly-named escape hatch that REOPENS this one branch to arbitrary, unknown subclasses, exactly like an ordinary open class. The requirement that you must choose one of the three explicitly (the compiler won\'t let you leave it ambiguous) is deliberate: it forces every permitted subtype\'s author to make a conscious decision about whether their piece of the hierarchy stays closed or deliberately opens back up, rather than leaving it as an accident of whether someone remembered to write final.'
    },
    {
      q: 'How does exhaustiveness checking work for a switch over a sealed type, and what happens when a new subtype is added later?',
      a: 'When a switch expression or statement\'s subject has a sealed type, and the switch contains one case for every type named in that sealed type\'s permits clause (directly, or via nested sealed types all the way down to concrete final leaves), the compiler can PROVE that every possible runtime value of that type is handled — there is no value the subject could hold at runtime that doesn\'t match some case — and it allows you to omit the default branch entirely, because a default would be genuinely, provably unreachable code. This is a real correctness guarantee, not a convenience: switch (fruit) { case Paramecia p -> ...; case Zoan z -> ...; case Logia l -> ...; } compiles cleanly with these three cases and DevilFruit sealed to exactly these three, and if you accidentally omit one of the three cases, the switch fails to COMPILE with an error naming the missing case — not a runtime bug, not a silent fall-through, a build failure you cannot ship past. The payoff shows up specifically when the sealed hierarchy CHANGES: if a fourth permitted type is added to DevilFruit\'s permits clause six months later, EVERY exhaustive switch over DevilFruit anywhere in the entire codebase that doesn\'t already handle the new type immediately fails to compile, forcing whoever adds the new type to go find and update every processing site that needs to know about it. This is the concrete advantage sealed-plus-exhaustive-switch has over both a fragile if/else-if instanceof chain (which compiles fine even with a forgotten case — you just get silently wrong behavior at runtime) and the classic Visitor pattern (which achieves the same compile-time safety, but requires a whole extra visitor interface and a visit method per concrete type, dramatically more ceremony for the same guarantee).'
    }
  ],
  code: {
    title: 'LogPose\'s event log as a sealed hierarchy of records',
    intro: 'The LogPose event log has a small, closed set of THINGS that happen: an idea gets logged, a paper gets reviewed, an experiment gets run. Modeling that as a sealed interface of records, processed by one exhaustive switch, gives the compiler the power to catch a missed case the instant a new event kind is added.',
    code: `import java.time.LocalDate;

sealed interface LogEvent permits IdeaLogged, PaperReviewed, ExperimentRun {}

record IdeaLogged(String text, LocalDate date) implements LogEvent {
    IdeaLogged {                                   // compact constructor: validate + normalize
        if (text.isBlank()) throw new IllegalArgumentException("idea text can't be blank");
        text = text.strip();
    }
}

record PaperReviewed(String paperTitle, int score, LocalDate date) implements LogEvent {
    PaperReviewed {
        if (score < 1 || score > 5) throw new IllegalArgumentException("score must be 1-5");
    }
}

record ExperimentRun(String name, boolean succeeded, LocalDate date) implements LogEvent {}

public class EventLogDemo {
    // Exhaustive switch pattern match — no default needed, because LogEvent is sealed
    // to exactly these three record types, and every one has a case.
    static String summarize(LogEvent event) {
        return switch (event) {
            case IdeaLogged(String text, LocalDate d) ->
                "[" + d + "] idea: " + text;                              // record pattern: destructure inline

            case PaperReviewed(String title, int score, LocalDate d) when score >= 4 ->
                "[" + d + "] paper '" + title + "' reviewed highly (" + score + "/5)";   // guard
            case PaperReviewed(String title, int score, LocalDate d) ->
                "[" + d + "] paper '" + title + "' reviewed (" + score + "/5)";

            case ExperimentRun(String name, boolean ok, LocalDate d) ->
                "[" + d + "] experiment '" + name + "' " + (ok ? "succeeded" : "failed");
        };
    }

    // instanceof pattern matching: check-and-bind in one step, no separate cast.
    static boolean mentionsFlaky(LogEvent event) {
        if (event instanceof IdeaLogged idea) {
            return idea.text().toLowerCase().contains("flaky");
        }
        return false;
    }

    public static void main(String[] args) {
        LocalDate today = LocalDate.of(2026, 7, 15);
        LogEvent[] events = {
            new IdeaLogged("investigate flaky test timeouts", today),
            new PaperReviewed("Debugging Flaky Tests at Scale", 5, today),
            new PaperReviewed("A Survey of Test Smells", 3, today),
            new ExperimentRun("rerun-quarantine pilot", true, today)
        };

        for (LogEvent e : events) {
            System.out.println(summarize(e));
        }

        System.out.println("mentions flaky: " + mentionsFlaky(events[0]));   // true
        System.out.println("mentions flaky: " + mentionsFlaky(events[3]));   // false

        // Rejected at construction — the compact constructor throws before the object exists:
        try {
            new PaperReviewed("bad score", 9, today);
        } catch (IllegalArgumentException ex) {
            System.out.println("rejected: " + ex.getMessage());
        }
    }
}`,
    notes: [
      'summarize has NO default branch — LogEvent is sealed to exactly these three record types, one case exists per type, and the compiler proves that\'s every possible value. Try deleting the ExperimentRun case: it won\'t compile.',
      'The two PaperReviewed cases show a guard (when score >= 4) splitting one type into ordered branches — case order matters here exactly like an if/else-if chain, since the guarded case is checked first.',
      'mentionsFlaky uses instanceof pattern matching: idea is bound and already correctly typed inside the if, no separate cast to IdeaLogged needed. Run: javac EventLogDemo.java LogEvent.java IdeaLogged.java PaperReviewed.java ExperimentRun.java && java EventLogDemo (or one file with all types).'
    ]
  },
  lab: {
    title: 'Model a closed set of notifications with sealed records and an exhaustive switch',
    prompt: 'Declare a sealed interface <code>Notification</code> with exactly three permitted implementations, each a record: <code>record Reminder(String message)</code>, <code>record Alert(String message, int severity)</code>, and <code>record Digest(int itemCount)</code>. Write <code>static String render(Notification n)</code> that uses a <b>switch pattern match with record deconstruction</b> — no <code>default</code> branch — to produce a String for each: Reminder → <code>"Reminder: " + message</code>; Alert → <code>"ALERT(" + severity + "): " + message</code>; Digest → <code>itemCount + " new items"</code>.',
    starter: `sealed interface Notification permits Reminder, Alert, Digest {}

record Reminder(String message) implements Notification {}
record Alert(String message, int severity) implements Notification {}
record Digest(int itemCount) implements Notification {}

class NotificationRenderer {
    static String render(Notification n) {
        // switch pattern match with record deconstruction, one case per permitted type,
        // NO default branch
        return null; // replace
    }
}`,
    checks: [
      { re: 'sealed\\s+interface\\s+Notification\\s+permits\\s+Reminder\\s*,\\s*Alert\\s*,\\s*Digest', must: true, hint: 'Declare sealed interface Notification permits Reminder, Alert, Digest.', pass: 'sealed interface with permits clause ✓' },
      { re: 'record\\s+Reminder\\s*\\(\\s*String\\s+message\\s*\\)\\s+implements\\s+Notification', must: true, hint: 'record Reminder(String message) implements Notification.', pass: 'Reminder record ✓' },
      { re: 'record\\s+Alert\\s*\\(\\s*String\\s+message\\s*,\\s*int\\s+severity\\s*\\)\\s+implements\\s+Notification', must: true, hint: 'record Alert(String message, int severity) implements Notification.', pass: 'Alert record ✓' },
      { re: 'record\\s+Digest\\s*\\(\\s*int\\s+itemCount\\s*\\)\\s+implements\\s+Notification', must: true, hint: 'record Digest(int itemCount) implements Notification.', pass: 'Digest record ✓' },
      { re: 'switch\\s*\\(\\s*n\\s*\\)', must: true, hint: 'render must switch on the parameter n.', pass: 'switches on n ✓' },
      { re: 'case\\s+Reminder\\s*\\(\\s*String\\s+\\w+\\s*\\)', must: true, hint: 'Use a record deconstruction pattern for Reminder: case Reminder(String message) ->.', pass: 'Reminder record pattern ✓' },
      { re: 'case\\s+Alert\\s*\\(\\s*String\\s+\\w+\\s*,\\s*int\\s+\\w+\\s*\\)', must: true, hint: 'Use a record deconstruction pattern for Alert: case Alert(String message, int severity) ->.', pass: 'Alert record pattern ✓' },
      { re: 'case\\s+Digest\\s*\\(\\s*int\\s+\\w+\\s*\\)', must: true, hint: 'Use a record deconstruction pattern for Digest: case Digest(int itemCount) ->.', pass: 'Digest record pattern ✓' },
      { re: 'default\\s*:|default\\s*->', must: false, hint: 'No default branch needed — the switch is exhaustive over the sealed Notification type.', pass: 'no unnecessary default ✓' }
    ],
    run: 'add a main method: build one of each Notification variant, call render() on each, print the results. javac NotificationRenderer.java Notification.java Reminder.java Alert.java Digest.java && java NotificationRenderer (or one file with all types).',
    solution: `sealed interface Notification permits Reminder, Alert, Digest {}

record Reminder(String message) implements Notification {}
record Alert(String message, int severity) implements Notification {}
record Digest(int itemCount) implements Notification {}

class NotificationRenderer {
    static String render(Notification n) {
        return switch (n) {
            case Reminder(String message) -> "Reminder: " + message;
            case Alert(String message, int severity) -> "ALERT(" + severity + "): " + message;
            case Digest(int itemCount) -> itemCount + " new items";
        };
    }

    public static void main(String[] args) {
        System.out.println(render(new Reminder("stand-up in 10 minutes")));
        System.out.println(render(new Alert("build failing on main", 3)));
        System.out.println(render(new Digest(12)));
    }
}`,
    notes: [
      'No default branch is needed or written — Notification is sealed to exactly Reminder, Alert, and Digest, and all three have a case, so the compiler proves the switch handles every possible value.',
      'Each case uses a record deconstruction pattern, pulling message/severity/itemCount directly out of the matched record without a separate .message() or .severity() accessor call.',
      'Try adding a fourth permitted type (e.g., record Snooze(int minutes) implements Notification {}) to the permits clause without adding a matching case to render — it will no longer compile, which is the exhaustiveness guarantee in action.'
    ]
  },
  quiz: [
    {
      q: 'What does `record WantedPoster(String name, long bounty) {}` generate automatically?',
      options: ['A canonical constructor, accessor methods name() and bounty() (not getName()/getBounty()), a correct equals() and hashCode() using both components, and a readable toString()', 'Only a constructor — equals, hashCode, and toString must still be written by hand', 'Getter methods in JavaBean style (getName(), getBounty()) but no equals/hashCode', 'A mutable class with public setName()/setBounty() methods for convenience'],
      correct: 0,
      explain: 'Records generate the full value-type package: constructor, component-named accessors (name(), not getName()), a component-based equals/hashCode pair, and toString — exactly what the strings-equals-hashcode lesson said records give you for free. There are no setters; every component is implicitly private and final.'
    },
    {
      q: 'What is the purpose of a compact constructor in a record, and what happens automatically after it runs?',
      options: ['It lets you validate or normalize the component values (e.g., trimming a String, rejecting a negative number); after it finishes, the compiler still performs the normal field assignment using the (possibly modified) parameter values', 'It replaces the normal field assignment entirely — you must manually assign every field with this.field = value inside it', 'It only runs for records with more than 3 components', 'It generates the equals and hashCode methods'],
      correct: 0,
      explain: 'A compact constructor has no parameter list (the components are implicitly in scope) and no explicit this.field = ... assignments — you validate/normalize the parameter variables, and the compiler performs the actual field assignment afterward using whatever those variables currently hold.'
    },
    {
      q: 'What does `if (obj instanceof Sword s) { s.sharpen(); }` do differently from the old `if (obj instanceof Sword) { Sword s = (Sword) obj; s.sharpen(); }`?',
      options: ['It combines the type check and the cast-and-bind into one step — s is already correctly typed and in scope inside the if-branch the moment the check succeeds, with no separate cast statement', 'It performs a deep equality check instead of a type check', 'It only works on interfaces, not concrete classes like Sword', 'It is purely stylistic and behaves identically at the bytecode level with no scoping difference'],
      correct: 0,
      explain: 'Pattern matching for instanceof (Java 16+) collapses the check-then-cast-then-declare dance into one step: s is bound, already cast to Sword, the instant the instanceof check passes — eliminating a redundant cast and the chance of casting to the wrong type by typo.'
    },
    {
      q: 'Given `sealed interface DevilFruit permits Paramecia, Zoan, Logia {}`, what must each of Paramecia, Zoan, and Logia declare about itself?',
      options: ['Each must explicitly be final (no further subtyping), sealed (continues the closed hierarchy with its own permits clause), or non-sealed (deliberately reopens to arbitrary subclasses)', 'Nothing extra — sealed only restricts the top-level interface, not its permitted subtypes', 'Each must be declared abstract', 'Each must implement a permits() method listing its own subtypes'],
      correct: 0,
      explain: 'Java requires every permitted subtype to explicitly declare how the hierarchy continues from that point: final closes that branch, sealed continues it one more (closed) level, non-sealed deliberately reopens it. Leaving this unstated is a compile error — the choice must be conscious, not accidental.'
    },
    {
      q: 'A switch statement pattern-matches over a sealed type with a case for every permitted subtype and no default branch. Six months later, a new type is added to the permits clause. What happens to that switch?',
      options: ['It fails to COMPILE — the switch is no longer exhaustive, and the compiler forces you to add a case for the new type before the build can succeed', 'It compiles fine and silently falls through to no-op for the new type at runtime', 'It throws a runtime MatchException the first time the new type is encountered, but only in that one location', 'Nothing changes — sealed interfaces cannot have new permitted types added after initial declaration'],
      correct: 0,
      explain: 'This is the core payoff of sealed + exhaustive switch: adding a new permitted type breaks compilation everywhere an exhaustive switch over that sealed type doesn\'t yet handle it, turning "did I update every processing site?" from a runtime risk into a compile-time requirement you cannot ship past.'
    }
  ],
  testFlow: {
    title: 'Test yourself: records, sealed types, and pattern matching under interrogation',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'You write `record Score(int value) { Score { if (value < 0 || value > 100) throw new IllegalArgumentException(); } }` and then `new Score(150)`. What happens?',
        choices: [
          { text: 'The compact constructor runs FIRST, throws IllegalArgumentException, and the Score object is never constructed at all — the invalid value never becomes stored state', to: 'q1_right' },
          { text: 'The Score object is created with value=150, and the exception only fires the next time value is read', to: 'q1_wrong_lazy' },
          { text: 'The compiler clamps 150 down to 100 automatically since a range check was declared', to: 'q1_wrong_clamp' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct — the compact constructor body runs before the compiler\'s implicit field assignment, so throwing there prevents the object from ever coming into existence. This is a strong guarantee: you can never observe an invalid Score instance, because one was never constructed.', next: 'q2' },
      q1_wrong_lazy: { end: true, correct: false, text: 'The compact constructor runs immediately, as part of construction — not lazily on first read. Throwing there means new Score(150) itself throws and no object is ever produced; there is no "deferred" validation in records.', retry: 'q1' },
      q1_wrong_clamp: { end: true, correct: false, text: 'Nothing is clamped automatically — a compact constructor only does what you explicitly write in its body. Here that\'s an explicit throw, so an out-of-range value is rejected outright, not silently adjusted.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'You have `sealed interface Shape permits Circle, Square {}` with both Circle and Square declared `final`. Can a third class, Triangle, be written elsewhere in the same package as `final class Triangle implements Shape`?',
        choices: [
          { text: 'No — it fails to compile. Shape\'s permits clause names only Circle and Square as allowed direct implementers; any other class attempting to implement Shape is rejected regardless of package', to: 'q2_right' },
          { text: 'Yes — sealed only restricts subclasses outside the package; anything in the same package as Shape may freely implement it', to: 'q2_wrong_package' },
          { text: 'Yes, as long as Triangle is also declared final, matching Circle and Square\'s style', to: 'q2_wrong_final' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Right — permits names the COMPLETE, exhaustive set of allowed direct subtypes. Package membership is a separate, additional requirement for permitted types (they generally must share Shape\'s module/package) — it does NOT create an alternate way to bypass the permits list. Triangle would need to be added to the permits clause itself.', next: 'q3' },
      q2_wrong_package: { end: true, correct: false, text: 'Same-package membership is a NECESSARY condition for a permitted subtype, not a sufficient one — being in the right package doesn\'t bypass the requirement of also being explicitly named in the permits clause. Without appearing in permits, Triangle fails to compile as a Shape implementer regardless of location.', retry: 'q2' },
      q2_wrong_final: { end: true, correct: false, text: 'The final/sealed/non-sealed choice governs how an ALREADY-PERMITTED subtype continues the hierarchy — it has nothing to do with whether a class can join the permitted set in the first place. Triangle must be named in Shape\'s permits clause itself, full stop, regardless of its own final/sealed/non-sealed declaration.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A switch pattern-matches over LogEvent (sealed: IdeaLogged, PaperReviewed, ExperimentRun) with cases for all three, ordered as shown, PLUS a guarded case `case PaperReviewed p when p.score() >= 4 -> "great"` placed AFTER the plain `case PaperReviewed p -> "ok"`. What happens for a PaperReviewed with score 5?',
        choices: [
          { text: 'It matches the plain "case PaperReviewed p -> \\"ok\\"" first, since case order is checked top to bottom and the unguarded case comes first — the guarded case never runs, regardless of the guard condition', to: 'q3_right' },
          { text: 'The compiler automatically reorders guarded cases before unguarded ones of the same type, so "great" is returned', to: 'q3_wrong_reorder' },
          { text: 'This is a compile error — a type cannot appear in more than one case of the same switch', to: 'q3_wrong_compile' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct — switch cases are evaluated top to bottom exactly like an if/else-if chain, guards included. Placing the plain (unguarded) PaperReviewed case BEFORE the guarded one means it always wins first, making the guarded case unreachable dead code for that type — a real ordering bug, not a compiler-caught one. The guarded, more specific case belongs FIRST.', next: null },
      q3_wrong_reorder: { end: true, correct: false, text: 'The compiler does NOT reorder cases for you — switch pattern matches are evaluated strictly in the order written, top to bottom, exactly like if/else-if. Placing the specific/guarded case after the general one silently makes the guard unreachable; you must order guarded cases before their more general counterparts yourself.', retry: 'q3' },
      q3_wrong_compile: { end: true, correct: false, text: 'Repeating a type across multiple cases (with different guards) is explicitly legal and is exactly how guards let you split one type into multiple conditional branches — the switch DOES compile. The real issue here is an ordering bug: the unguarded case, placed first, shadows the guarded one for every PaperReviewed value.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Adding a mutable field to a record body — records only permit their declared components as instance state; there is no way to add a second, independently-mutable instance field. If you need extra mutable state, you need a class, not a record.',
    'Writing `this.name = name.trim();` inside a compact constructor — a compact constructor has no this.field = ... assignment available (that\'s the compiler\'s job, done afterward); reassign the parameter variable itself (name = name.trim();) instead.',
    'Forgetting that a permitted subtype must explicitly declare final, sealed, or non-sealed — Java requires one of the three; there is no implicit default, and omitting it is a compile error, not a silent "open" default.',
    'Adding a default branch "just in case" to an exhaustive switch over a sealed type — it\'s dead code the compiler already proved unreachable, and worse, it silently swallows the compile error you WANT to get when a new permitted type is added later and a case goes unhandled.',
    'Ordering a general (unguarded) pattern case before a more specific guarded case of the same type — switch cases are evaluated top to bottom like if/else-if; the general case wins first and the guarded case becomes unreachable for that type. Put guarded/specific cases first.',
    'Treating instanceof pattern matching\'s bound variable as scoped only to the if-block — flow scoping means it\'s also valid after an early return/continue/break that makes the non-match case unreachable (if (!(x instanceof Foo f)) return; — f is usable below that line too).'
  ],
  interview: [
    {
      q: 'Explain what a record is, what it generates, and where it fits versus a hand-written class.',
      a: 'A record is a compact declaration for an immutable data carrier: record Point(int x, int y) {} generates a canonical constructor, accessor methods named exactly after the components (x(), y() — not getX()/getY(), a deliberate break from JavaBean convention since a record is explicitly not a bean), a component-based equals() and matching hashCode() satisfying the Part 1 equals/hashCode contract automatically, and a readable toString(). Every component is implicitly a private final field, with no mechanism to add extra mutable instance state — the whole point is that a record IS its declared data, immutably, and nothing else. A compact constructor (Point { if (x < 0) throw ...; }, no parameter list, no explicit field assignment) lets you validate or normalize component values before the compiler\'s implicit field assignment runs afterward. Records can implement interfaces and carry additional static members and instance methods, but cannot extend a class (they implicitly extend java.lang.Record) and are implicitly final. Where records fit: any time a type\'s entire purpose is to CARRY a fixed set of immutable values — a map key (Part 3\'s equals/hashCode payoff), a DTO crossing a boundary, one variant of a sealed hierarchy, a return type bundling several values — a record is the correct modern default, because it\'s less code, structurally impossible to get equals/hashCode wrong on, and immediately communicates "value type" to any reader. I still reach for a hand-written class when I need genuine encapsulated, mutable state with behavior beyond simple accessors, when the type needs to extend an existing class, or when equality genuinely should NOT be based on all fields (a cache with an internal, excluded bookkeeping field, for instance) — records give you the all-components default and no easy way to opt individual components out of equals/hashCode.'
    },
    {
      q: 'Walk through instanceof pattern matching, including flow scoping, and how it improves on the old cast idiom.',
      a: 'Before Java 16, checking a runtime type and using it required three separate steps: if (obj instanceof Sword) { Sword s = (Sword) obj; s.sharpen(); } — the instanceof check, a manual cast (which could theoretically be typo\'d to a different, still-compatible type), and a separate variable declaration to hold the result. Pattern matching for instanceof collapses all three: if (obj instanceof Sword s) { s.sharpen(); } — the moment the check succeeds, s is bound, already correctly typed, no cast statement needed, no chance of casting to the wrong type since the pattern variable\'s type IS the type being tested. The subtler and genuinely useful feature is flow scoping: the pattern variable\'s scope is determined by what the compiler can PROVE about control flow, not merely by which braces enclose it. if (!(obj instanceof Sword s)) { return; } s.sharpen(); compiles, and s is usable on that last line OUTSIDE the if-block\'s braces, because the compiler can prove that any code reachable past the if statement only runs when the negated condition was false — meaning obj instanceof Sword was true. This composes naturally with the extremely common early-return guard-clause style, letting you write if (!(x instanceof Type t)) return; and then use t freely for the rest of the method, without nesting the remaining logic inside an extra block purely to satisfy variable scope. The net effect across a codebase is fewer redundant casts, fewer opportunities for a cast-to-wrong-type typo, and less defensive nesting purely to keep a pattern variable in scope.'
    },
    {
      q: 'What problem do sealed interfaces solve, and how do they combine with switch pattern matching for exhaustiveness checking?',
      a: 'An ordinary interface is open: any class, in any file, in any package the language\'s access rules allow, can implement it at any time without the interface author\'s knowledge. That openness is exactly right for genuine extension points (Comparable, Searchable) but wrong for domains where the set of possibilities is a closed FACT, not an accident of current code organization — there really are a fixed, finite number of event kinds in an append-only log, HTTP methods, or shape types in a fixed graphics model. sealed interface DevilFruit permits Paramecia, Zoan, Logia {} tells the compiler these three ARE the complete set, enforced at compile time (a fourth class attempting to implement DevilFruit outside the permits list fails to compile), and requires each permitted type to explicitly declare whether it stays final (closed), continues sealed one more level, or is deliberately non-sealed (an explicit, named reopening — never accidental). The payoff is exhaustiveness checking in switch pattern matching: when a switch\'s subject has a sealed type and every permitted subtype has a case, the compiler can PROVE no value is left unhandled and lets you omit default entirely — turning "did I handle every case?" from a runtime risk (an unhandled instanceof branch silently doing nothing, or a Visitor pattern\'s extra ceremony to get the same guarantee) into a compile error the instant a case is missing. The real long-term value shows up when the hierarchy CHANGES: adding a fourth permitted type to DevilFruit later breaks compilation at every exhaustive switch across the entire codebase that doesn\'t yet account for it, forcing the person making that change to find and update every processing site — the type system enforcing that code stays synchronized with the domain, rather than relying on a comment, a code review, or institutional memory to catch the gap.'
    },
    {
      q: 'Describe record deconstruction patterns and guards in switch pattern matching, with an example of why case order matters once guards are involved.',
      a: 'A record deconstruction pattern destructures a record\'s components directly inside a switch case label, binding them to new local variables in one step: case PaperReviewed(String title, int score, LocalDate date) -> "..." pulls title, score, and date straight out of the matched PaperReviewed instance without separate .title()/.score()/.date() accessor calls — and this nests arbitrarily for records containing other records, letting a single case peel apart a deeply nested structure in one pattern. A guard — the when clause — adds a boolean condition that\'s checked ONLY after the type/deconstruction pattern already matches: case PaperReviewed(String title, int score, LocalDate date) when score >= 4 -> "great paper". If the pattern matches but the guard evaluates false, control falls through to the NEXT case, exactly as if that case hadn\'t matched at all — which is precisely why case order becomes significant the moment guards enter the picture, the same way it does in an if/else-if chain. Consider two cases for the same type: a guarded one (when score >= 4 -> "great") and a plain one (-> "ok"), for PaperReviewed. If the PLAIN case is listed FIRST, it matches every PaperReviewed unconditionally, and the guarded case below it becomes dead code — unreachable for that type, silently, with no compiler warning, because the switch is still exhaustive overall (the plain case alone covers PaperReviewed completely). The guarded, more-specific case must be listed BEFORE the more general one to ever actually run — a real ordering bug I\'d specifically watch for in code review whenever multiple cases target the same record type with different guards, since it compiles cleanly either way and only manifests as silently wrong behavior at runtime.'
    }
  ]
};
