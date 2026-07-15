# Full-Stack Java Course

A local, static, zero-dependency course taking you from "what exactly is the JVM" to full-stack Java developer — language, JVM internals, collections, modern Java, concurrency, Maven, every kind of testing, PostgreSQL, Spring, frontend, JavaFX desktop apps and games, cross-platform apps (Mac/iPhone via Gluon + GraalVM), NLP-powered search in Java, and finally Gradle and other build systems. The whole ~43-hour path converges on a capstone **you** build yourself: **LogPose**, a cross-platform research-log manager (paper reviews, ideas, experiments, mentoring, projects, learning) with semantic search — ask it "what ideas did I have related to flaky tests?" and it finds them by meaning, not keywords.

Same local-first, zero-licensing-risk design as `DSA_tool` and `AI_course`: no video, no tracked media, procedurally generated audio, hand-drawn SVG character art (not traced from any show, not AI-generated). One Piece stories, Big Bang Theory and Friends scenes, mnemonics, and interactive animated diagrams throughout. Where a topic overlaps the other two courses (hashing, TF-IDF, embeddings, RAG), lessons link there instead of re-teaching.

## Run it

```
./start.sh
```

Then open **http://localhost:8000/full_stack_java/**. (Serves the whole repo root with `python3 -m http.server`, from the parent directory, so `../shared/*` resolves the same way locally as on GitHub Pages — nothing else to install.)

To stop: `Ctrl+C` in the terminal.

For the code labs' "real run" step you'll also want a JDK (Temurin 21 LTS recommended — Lesson 0.2 walks through installing it), and from Part 6 on, Maven; from Part 8 on, PostgreSQL. Each lesson tells you exactly when a new local tool becomes necessary.

## How to use the ~43-hour path

1. **Go strictly in order.** The course is one dependency chain aimed at the capstone: the `equals/hashCode` contract (Part 1) is why `HashMap` works (Part 3), which is why JPA entity identity is subtle (Part 8), which is why LogPose's data model looks the way it does (Part 14).
2. In each lesson: read the concept, open the **story + animation** the first time through, click through the **interactive walkthrough**, expand any **Technicality corner** question you can't already answer out loud, then do the **Code Lab** — type the code yourself, check it in the browser, then run it for real in `jshell` / `mvn`.
3. Before marking a lesson complete, try the **interview questions** at the bottom out loud. If you can't explain it to an interviewer, you don't own it yet.
4. Keep the **Cheat Sheet** open in a second tab — every "which collection/annotation/tool when" table in one place.
5. Finish with the **timed Interview Drill** — randomized questions pulled from every lesson's interview section, on a countdown, like the real thing.

## Course structure

| Part | Topic | Lessons |
|---|---|---|
| 0 | Orientation & setup (JDK/JRE/JVM map, first program, jshell) | 2 |
| 1 | Core Java (types, control flow, OOP, interfaces, exceptions, equals/hashCode) | 7 |
| 2 | The JVM, deeply (architecture, memory & GC, tools & reflection) | 3 |
| 3 | Collections & generics (erasure, lists, HashMap vs LinkedHashMap vs TreeMap, sets/queues) | 4 |
| 4 | Modern Java (lambdas, streams, records/sealed/pattern matching, time & I/O) | 4 |
| 5 | Concurrency (threads & JMM, executors & futures, concurrent collections & virtual threads) | 3 |
| 6 | Maven (fundamentals; multi-module, BOMs, conflicts) | 2 |
| 7 | Testing (JUnit 5, Mockito & doubles, integration/E2E/pyramid, TDD/coverage/flaky tests) | 4 |
| 8 | Databases (SQL & PostgreSQL, JDBC & transactions, JPA/Hibernate & migrations) | 3 |
| 9 | Backend with Spring (HTTP/REST/JSON, IoC/DI, Boot REST API, Data & Security/JWT) | 4 |
| 10 | Frontend for Java devs (web essentials, Thymeleaf vs React vs Vaadin) | 2 |
| 11 | Desktop & games (JavaFX, game loop + complete desktop game, libGDX cross-platform) | 3 |
| 12 | Cross-platform apps (Gluon Mobile + GraalVM for iOS/Mac, jlink/jpackage/notarization) | 2 |
| 13 | NLP search in Java (Lucene keyword search; embeddings via ONNX/DJL + pgvector) | 2 |
| 14 | **Capstone: LogPose** (full design doc; backend build guide; clients build guide) | 3 |
| 15 | Beyond Maven & interviews (Gradle/Ant/Bazel, Java interview prep, timed drill) | 2 + drill |

51 modules total, sequenced so every later lesson explicitly reuses concepts and narrative motifs from earlier ones rather than treating each topic in isolation.

## The capstone: LogPose

Named after the One Piece navigation instrument that records where you've been and points where you're going — which is exactly what a research log does. Part 14's design lesson contains the full requirements, entity-relationship diagram, REST API spec, multi-module Maven layout, and milestone plan; the two build-guide lessons sequence the work so that every step uses something you learned earlier in the course. The course never hands you the finished app — it hands you the design and the order of operations, and verifies you know each ingredient.

## Honest expectations

~43 hours is enough to build genuine, interview-ready understanding of the Java stack and everything LogPose needs **if you actually do the labs and then build the capstone yourself** — budget a comparable number of hours again for the capstone build. This course assumes basic programming literacy (the DSA course is more than enough) but no prior Java. If a lab feels unfamiliar rather than just new, slow down and run it locally line by line in `jshell` before moving on.

## Project structure

```
index.html              dashboard: progress, schedule, links
cheat-sheet.html         every "which tool when" table, one page
interview.html           timed randomized interview drill (pulls interview[] from every lesson)
lesson.html              template — loads data/lessons/<id>.js via ?id=
css/style.css
js/app.js                 nav, localStorage progress + notes, optional Supabase sync
js/lesson-loader.js       renders a lesson's concept/story/lab/quiz/interview sections
js/story-anim-engine.js   step-through animation for each lesson's One Piece/sitcom story
js/concept-flow-engine.js interactive click-through pipeline diagrams
js/test-flow-engine.js    branching "test yourself" decision trees
js/episode-engine.js      SVG character portraits + dialogue for episode scenes
js/audio-engine.js        procedurally generated background music/SFX (Web Audio API)
js/voice-engine.js        browser TTS tuning per character (SpeechSynthesis)
js/code-lab-engine.js     in-browser code editor: Java-aware static checks + local-run recipes
js/quiz-engine.js         renders per-lesson quizzes
data/schedule.js          ordered lesson list, by Part (drives nav + dashboard + interview drill pool)
data/characters.js        hand-drawn SVG character portraits (original, not traced or AI-generated)
data/lessons/*.js         one file per lesson (concept, story, storyAnim, tech, code, lab, quiz, interview)
```

Progress and notes are saved in your browser's `localStorage`, scoped to `localhost:8000`. Signing in (via the header auth widget) additionally syncs progress and notes to Supabase (`java_progress` / `java_notes` tables, see `../supabase/schema.sql`) for cross-device access — entirely optional, and nothing gates access to any lesson content.
