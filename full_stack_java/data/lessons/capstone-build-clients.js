window.LESSONS = window.LESSONS || {};
window.LESSONS['capstone-build-clients'] = {
  id: 'capstone-build-clients',
  title: 'Building LogPose II: Web UI, JavaFX Desktop & Gluon iOS Clients',
  category: 'Part 14 — Capstone: LogPose',
  timeMin: 70,
  summary: 'This is the payoff. capstone-build-backend produced ONE working, stateless REST API. This lesson builds THREE genuinely different clients against it, unmodified — a web page (web-frontend-basics\' fetch() pattern, extended to the new /ideas and /search endpoints), a JavaFX desktop app (javafx-desktop\'s Scene Graph/Task pattern, extended the same way), and a Gluon-compiled iOS binary (gluon-mobile-graalvm\'s exact "same code, AOT-compiled" promise) — reusing the SAME JavaFX code the desktop client already uses, not a rewrite. Create an idea from the web browser; see it in the desktop app; search for it by meaning from the phone. One backend, three windows into the same data — the concrete, working proof of every architectural argument this course has made since spring-boot-rest-api.',
  goals: [
    'Extend web-frontend-basics\' fetch()-based page with an ideas section and a search box calling the new /ideas and /search endpoints',
    'Extend javafx-desktop\'s Scene Graph pattern with an ideas view and a search feature, using the same Task-based background-loading discipline',
    'Update gluon-mobile-graalvm\'s reflect-config.json for the new IdeaDto/ProjectDto types, and cross-compile the extended JavaFX client for iOS unchanged',
    'Verify, concretely, that data created through one client is correctly visible through the other two, proving LogPose\'s single-backend architecture works in practice, not just in design',
    'Identify what would need to change (and what would not) if a fourth client were added, tying back to capstone-design\'s own architecture argument'
  ],
  concept: [
    {
      h: 'The web client: extending fetch() to the new endpoints',
      p: [
        'web-frontend-basics\' page already has a working papers list and submission form, calling <code>GET/POST /papers</code>. Extending it to ideas requires ZERO new JavaScript CONCEPTS — an <code>#idea-list</code> element, an <code>#idea-form</code>, and <code>loadIdeas()</code>/<code>submitIdea()</code> functions following the EXACT same shape as <code>loadPapers()</code>/<code>submitPaper()</code>: <code>fetch("/ideas")</code>, check <code>response.ok</code>, render results; <code>fetch("/ideas", { method: "POST", ... })</code>, check <code>response.ok</code>, branch on status for errors. A new <code>#search-box</code> with an <code>oninput</code> handler calling <code>fetch(`/search?q=${encodeURIComponent(query)}`)</code> and rendering the returned titles is the ONLY genuinely new piece — and even that reuses every discipline web-frontend-basics already taught (checking <code>response.ok</code>, since <code>/search</code> can fail exactly like any other endpoint).',
        'Worth noting explicitly, since it validates capstone-design\'s whole "one API" argument concretely: NOTHING about the backend needed to change to support this — <code>/ideas</code> and <code>/search</code> already existed, fully working, from capstone-build-backend\'s own verification step; this section is entirely about the CLIENT catching up to endpoints that were already correct.'
      ]
    },
    {
      h: 'The JavaFX desktop client: an ideas view and search, using the same Task discipline',
      p: [
        'javafx-desktop\'s <code>PapersController</code>/<code>PaperRow</code> pattern extends directly: an <code>IdeaRow</code> class (the same JavaBean-shaped view model javafx-desktop\'s own material required, since <code>IdeaDto</code> is a record and cannot be bound directly), an <code>ideas-view.fxml</code>/<code>IdeasController</code> pair mirroring <code>papers-view.fxml</code>/<code>PapersController</code> exactly, and a <code>handleLoadIdeas()</code> method using the SAME <code>javafx.concurrent.Task</code> pattern (never blocking the Application Thread, callbacks automatically marshaled back). A search feature — a <code>TextField</code>, a <code>Button</code>, a <code>ListView&lt;String&gt;</code> — calls <code>/search?q=...</code> via ANOTHER <code>Task</code>, populating the list with returned titles on <code>setOnSucceeded</code>, exactly the same shape as every other network call this client makes.',
        'The genuinely satisfying moment here: creating an idea with NO related paper (via the web client, say) and then loading the desktop client\'s ideas view shows that SAME idea, correctly, with no code anywhere needing to handle "what if the desktop client and the web client disagree about what an idea looks like" — they can\'t disagree, since both are rendering the identical JSON shape the SAME backend returns.'
      ]
    },
    {
      h: 'The Gluon iOS client: the same code, cross-compiled — with one new reflection-config entry',
      p: [
        'gluon-mobile-graalvm\'s central promise — the exact same Scene Graph/FXML/Controller code, unmodified, running on iOS via GraalVM native-image — now gets its most concrete demonstration: the EXTENDED <code>PapersController</code>/<code>IdeasController</code>/search code from the previous section, not just the original desktop-only version, compiles and runs on iOS with the SAME <code>mvn gluonfx:build -Pios</code> command, no UI code changes at all. The ONE thing that genuinely needs updating: <code>reflect-config.json</code> needs a NEW entry for <code>IdeaDto</code> and <code>ProjectDto</code> (and, if the client deserializes search results as structured objects rather than plain strings, whatever DTO wraps a search hit) — gluon-mobile-graalvm\'s own closed-world-assumption argument, applied concretely: Jackson\'s reflective deserialization of these NEW record types is just as invisible to native-image\'s build-time analysis as <code>PaperDto</code>/<code>AuthorDto</code> were, and needs the identical <code>allDeclaredFields</code>/<code>allDeclaredMethods</code>/<code>allDeclaredConstructors</code> treatment.',
        'This is worth stating precisely as the SPECIFIC, concrete cost of adding a new resource to an AOT-compiled client — not a UI rewrite, not new Gluon configuration, ONE new JSON object in a configuration file, exactly matching the scope gluon-mobile-graalvm\'s own lab exercise (adding a <code>ReviewDto</code> entry) already walked through.'
      ]
    },
    {
      h: 'Verifying one backend, three windows into the same data',
      p: [
        'The concrete proof, worth actually running through rather than just asserting: (1) create a paper via the WEB client\'s form; (2) confirm it appears in the JAVAFX DESKTOP client\'s table with NO manual refresh of anything but the desktop client\'s own load button; (3) create an idea with NO related paper via the DESKTOP client; (4) search for it, by MEANING, not exact words, from the GLUON IOS build; (5) confirm the SAME result appears searching from the web client too. Every one of these crossings works because exactly ONE thing is true underneath all of them: there is exactly ONE <code>papers</code> table, ONE <code>ideas</code> table, ONE running instance of <code>HybridSearchIndex</code>, and every client is nothing more than a different WINDOW onto that same, single, shared reality — never a separate copy, never a separate backend, never data that could silently drift out of sync between clients.',
        'This is the concrete, working conclusion of capstone-design\'s own architecture argument, spring-boot-rest-api\'s thin-controller/real-service-layer split, and frontend-choices\' entire "why build API-first" case — not a claim this course is asking you to trust, but something you can literally watch happen by creating data in one client and finding it, correctly, in the other two.'
      ]
    },
    {
      h: 'What a fourth client would cost — and what it would not',
      p: [
        'capstone-design\'s own closing interview question asked this hypothetically; here it\'s concrete. Adding a FOURTH client — a CLI tool for scripting searches, say — costs EXACTLY the work of writing that one new client: parsing the same JSON shapes, calling the same endpoints, handling the same status codes. It costs NOTHING in the backend at all — no new controller, no new entity, no new migration, since <code>/papers</code>, <code>/ideas</code>, and <code>/search</code> already exist, fully general, client-agnostic, and complete. This asymmetry — REAL, ongoing cost to add a new CLIENT; ZERO cost to the shared backend — is the single clearest, most concrete demonstration this entire course can offer of why building API-first, stateless, and client-agnostic from spring-boot-rest-api onward was the right foundational decision, made over 20 lessons ago, precisely so THIS moment — adding a genuinely new way to reach LogPose\'s data — would be this cheap.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky tests the signal tower: the same message, sent three different ways, arrives understood every time',
      text: 'With the ship built and the signal tower wired, Franky runs the test the whole crew has been waiting for. He sends ONE message — "new sighting logged, no destination confirmed yet" — through the tower\'s main line, boarded directly. Then he has Usopp relay the EXACT SAME kind of message from a small skiff pulling alongside. Then, days later, an entirely different allied vessel radios in with its OWN version of the same kind of report. Every single time, the message arrives at the SAME central log, understood identically, filed the SAME way — because there was never more than ONE log to begin with, just three different paths reaching it (the web client, the desktop client, and the Gluon iOS build, all hitting the same backend). When the crew wants to check whether a new device (say, a small handheld reader some ally wants to add) could ALSO reach the ship\'s signal tower, Franky doesn\'t need to modify the tower itself at all — he only needs to teach the NEW device how to speak the tower\'s existing, already-working protocol; the tower itself, and everything it manages, never changes for a new device to join in (a fourth client costing nothing on the backend). And the proof the whole crew actually trusts isn\'t Franky\'s blueprint, or his word that it SHOULD work — it\'s watching Nami log a sighting from the deck, and Robin, in a completely different part of the ship, immediately being able to pull up that exact same sighting, correctly, with nothing lost or changed in translation.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon tests the shared notes system: the same query, from three different devices, returns the same answer every time',
      text: 'With the apartment\'s renovated systems finally wired together, Sheldon runs the test the whole group has been waiting for. He looks up ONE specific research note from his own laptop. Then he looks up the EXACT SAME note from Amy\'s laptop, logged in separately. Then, later, from his phone while out getting food. Every single time, the SAME note appears, worded identically, filed the SAME way — because there was never more than ONE actual set of notes to begin with, just three different devices reaching it (the web client, the desktop client, and the Gluon iOS build, all hitting the same backend). When Penny jokingly asks whether HER phone could also somehow check the group\'s shared notes, Sheldon doesn\'t need to rebuild the notes system at all — he only needs to teach Penny\'s device how to speak the system\'s existing, already-working protocol; the actual notes system itself never changes for a new device to join in (a fourth client costing nothing on the backend). And the proof the group actually believes isn\'t Sheldon\'s diagram, or his insistence that it SHOULD work — it\'s watching Leonard add a note from the couch, and Amy, on a completely different device in a completely different room, immediately seeing that exact same note, correctly, with nothing lost or changed.',
    },
    why: 'Franky\'s / Sheldon\'s test — the SAME message/note, reaching the SAME single log/notes system through THREE genuinely different paths/devices, arriving identical every time — is the concrete, working proof of LogPose\'s entire architecture: one backend, one shared data store, three genuinely independent clients, none of them a separate copy. And the fact that a brand-new device/client could join in by learning the EXISTING protocol, with zero change to the tower/notes system itself, is exactly capstone-design\'s own "what would a fourth client cost" argument, now demonstrated as a real, concrete, near-zero-backend-cost fact rather than a claim to take on faith.'
  },
  storyAnim: {
    title: 'One message, three paths, one log -- and a fourth device that costs the tower nothing',
    h: 340,
    props: [
      { id: 'directboard', emoji: '🚢', label: 'boarded directly, message sent (web client -> backend)', x: 6, y: 8 },
      { id: 'skiff', emoji: '🚣', label: 'relayed from a skiff (desktop client -> the SAME backend)', x: 28, y: 8 },
      { id: 'allyvessel', emoji: '⛵', label: 'radioed from an ally vessel (Gluon iOS -> the SAME backend)', x: 50, y: 8 },
      { id: 'onelog', emoji: '📖', label: 'ONE central log -- every path arrives understood identically', x: 74, y: 8 },
      { id: 'newdevice', emoji: '📱', label: 'a brand-new device joins by learning the EXISTING protocol -- the tower never changes', x: 40, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 78 },
      { id: 'robin', emoji: '📖', label: 'Robin', x: 65, y: 78 }
    ],
    steps: [
      { c: 'A message boarded directly reaches the signal tower.', p: { directboard: 'lit' }, a: { franky: [20, 30] } },
      { c: 'The exact same kind of message, relayed from a small skiff, reaches the SAME tower.', p: { skiff: 'lit' } },
      { c: 'Days later, an entirely different allied vessel radios in the same kind of report.', p: { allyvessel: 'lit' } },
      { c: 'Every path arrives at the SAME central log, understood identically -- there was only ever one log.', p: { onelog: 'good' }, a: { robin: [74, 60] } },
      { c: 'A brand-new device could join in by learning the existing protocol alone -- the tower itself never has to change.', p: { newdevice: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From the web client to the desktop client, the iOS build, and the final cross-client proof',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Web client',
        nodes: [
          { id: 'webextend', text: 'ideas + search sections,\nSAME fetch()/response.ok pattern' }
        ]
      },
      {
        label: 'Desktop client',
        nodes: [
          { id: 'desktopextend', text: 'IdeaRow + IdeasController,\nSAME Task-based background loading' }
        ]
      },
      {
        label: 'iOS client',
        nodes: [
          { id: 'iosreuse', text: 'the SAME extended JavaFX code,\ncross-compiled unchanged' },
          { id: 'newreflect', text: 'ONE new reflect-config entry\nfor IdeaDto/ProjectDto' }
        ]
      },
      {
        label: 'The proof',
        nodes: [
          { id: 'crossclient', text: 'create in one client,\nsee it correctly in the other two' },
          { id: 'fourthclient', text: 'a 4th client costs client work\nonly -- zero backend changes' }
        ]
      }
    ],
    steps: [
      { active: ['webextend'], note: 'The web client\'s ideas and search sections reuse the exact fetch()/response.ok pattern already established for papers.' },
      { active: ['desktopextend'], note: 'The desktop client\'s ideas view and search feature reuse the exact Task-based background-loading pattern already established for papers.' },
      { active: ['iosreuse'], note: 'The extended JavaFX code, unmodified, cross-compiles for iOS via the same GraalVM native-image pipeline.' },
      { active: ['newreflect'], note: 'The only genuinely new AOT-specific work is one new reflect-config.json entry for the new DTO types.' },
      { active: ['crossclient'], note: 'Data created in any one client is immediately, correctly visible in the other two -- concrete proof of one shared backend, not three separate copies.' },
      { active: ['fourthclient'], note: 'Adding a new client costs exactly the work of writing that client -- zero new backend code, since the API was already general and client-agnostic.' }
    ]
  },
  tech: [
    {
      q: 'A developer creates an idea via the JavaFX desktop client, then immediately checks the web client\'s ideas list and doesn\'t see it, even after reloading the page. Diagnose the most likely cause, distinguishing an architecture problem from an ordinary client-side bug.',
      a: 'Given this course\'s architecture (one backend, one database, both clients calling the identical /ideas endpoint), this is almost certainly an ORDINARY client-side bug, not an architectural flaw — the most likely cause is the web client\'s loadIdeas() function not actually being called again (a missing event handler, a caching issue in the browser, or the desktop client\'s create call actually failing silently, per web-frontend-basics\' own "fetch() resolves even for errors" warning — if the desktop client\'s POST failed with a 400/422 and that failure wasn\'t surfaced, the idea was never actually created at all). The diagnostic step: check directly, via curl or the backend\'s own logs, whether the idea actually exists in the database at all — if it does, the bug is in the WEB client\'s reload logic specifically; if it does not, the bug is in the DESKTOP client\'s create-and-verify-success logic, not in the shared architecture, which has no mechanism for one client\'s writes to be invisible to another at all once genuinely persisted.'
    },
    {
      q: 'Explain precisely why extending the desktop client to search /search requires reusing javafx-desktop\'s Task pattern rather than calling PaperClient.search(query) directly inside a button\'s onAction handler.',
      a: 'A search request is a blocking network call, exactly like loading papers or ideas — calling it directly inside an onAction handler would run it ON the JavaFX Application Thread, freezing the entire UI (unresponsive to any other click, unable to repaint) for the request\'s duration, precisely the violation javafx-desktop\'s own material built real depth around. Wrapping it in a Task, with the actual network call inside call() (running on a background thread) and the ListView population inside setOnSucceeded (guaranteed to run on the Application Thread automatically), keeps the UI responsive throughout — the exact same reasoning, applied to a new feature, that already governed every other network call this client makes.'
    },
    {
      q: 'A team ships the extended JavaFX client to desktop successfully but the Gluon iOS build throws a runtime reflection exception the first time a user searches for an idea. Diagnose precisely, connecting to gluon-mobile-graalvm\'s own material.',
      a: 'This is almost certainly a missing reflect-config.json entry — if the search results are deserialized as a structured DTO (rather than plain strings) via Jackson, and that specific DTO type has no entry in reflect-config.json, native-image\'s closed-world build-time analysis never discovered it needed reflective access, exactly gluon-mobile-graalvm\'s own central warning: the SAME code works flawlessly on the desktop client (a normal JVM, reflection always works) and fails specifically inside the native image, silently, until that exact code path runs. The fix is adding the missing DTO\'s entry (allDeclaredFields/allDeclaredMethods/allDeclaredConstructors) to reflect-config.json and rebuilding — exactly gluon-mobile-graalvm\'s own lab exercise, now needed for real rather than as a practice exercise.'
    },
    {
      q: 'A stakeholder asks what would need to change in the BACKEND if LogPose added a fourth client (a command-line scripting tool). Answer precisely, using this lesson\'s own closing argument.',
      a: 'Nothing in the backend would need to change at all — this is the concrete, demonstrated conclusion of this whole lesson: /papers, /ideas, /search, and every other endpoint are already general-purpose, JSON-over-HTTP, and entirely client-agnostic; a CLI tool making ordinary HTTP requests (via Java\'s HttpClient, or any language\'s HTTP library, since JSON-over-HTTP has no Java-specific dependency on the client side at all) against these SAME endpoints would work identically to the three clients already built. The entire cost of a fourth client is writing that client itself — parsing the same JSON shapes, handling the same status codes — precisely the asymmetry (real client-side cost, zero backend cost) this lesson\'s final concept section names as the concrete payoff of every architectural decision made since Part 9.'
    }
  ],
  code: {
    title: 'Extending each client: web ideas+search, JavaFX IdeasController+search Task, and the new reflect-config entry',
    intro: 'The genuinely new pieces each client needs — everything else (fetch()\'s discipline, Task-based background loading, the Gluon build pipeline) already exists unchanged from earlier lessons.',
    code: `// --- WEB CLIENT: extending web-frontend-basics' page with ideas + search ---
async function loadIdeas() {
    const response = await fetch("/ideas");
    if (!response.ok) { messageEl.textContent = "Could not load ideas."; return; }
    const ideas = await response.json();
    ideaList.innerHTML = "";
    for (const idea of ideas) {
        const li = document.createElement("li");
        li.textContent = idea.title;
        ideaList.appendChild(li);
    }
}

async function search(query) {
    const response = await fetch(\`/search?q=\${encodeURIComponent(query)}\`);
    if (!response.ok) { messageEl.textContent = "Search failed."; return; }
    const titles = await response.json();
    resultsList.innerHTML = "";
    for (const title of titles) {
        const li = document.createElement("li");
        li.textContent = title;
        resultsList.appendChild(li);
    }
}


// --- JAVAFX DESKTOP: IdeaRow (JavaBean-shaped, mirroring PaperRow) + a search feature ---
public class IdeaRow {
    private final StringProperty title = new SimpleStringProperty();
    private final StringProperty body = new SimpleStringProperty();

    public IdeaRow(String title, String body) {
        this.title.set(title);
        this.body.set(body);
    }

    public String getTitle() { return title.get(); }
    public StringProperty titleProperty() { return title; }
    public String getBody() { return body.get(); }
    public StringProperty bodyProperty() { return body; }
}

// inside a Controller, alongside the existing papers logic:
@FXML private TextField searchField;
@FXML private ListView<String> searchResults;

@FXML
private void handleSearch() {
    String query = searchField.getText();
    Task<List<String>> task = new Task<>() {
        @Override
        protected List<String> call() throws Exception {
            return paperClient.search(query);   // a blocking HTTP call -- runs off the Application Thread
        }
    };
    task.setOnSucceeded(event -> searchResults.setItems(FXCollections.observableArrayList(task.getValue())));
    new Thread(task).start();
}


// --- GLUON iOS: the ONLY new configuration needed -- everything else is unmodified ---
// META-INF/native-image/reflect-config.json, one new entry appended:
// {
//   "name": "com.logpose.IdeaDto",
//   "allDeclaredFields": true,
//   "allDeclaredMethods": true,
//   "allDeclaredConstructors": true
// }
//
// mvn gluonfx:build -Pios   -- the SAME command, now compiling the EXTENDED client unchanged`,
    notes: [
      'loadIdeas() and search() are structurally identical to loadPapers()/submitPaper() from web-frontend-basics -- no new JavaScript concepts, only a new resource and a new query parameter.',
      'IdeaRow follows the EXACT JavaBean-shaped pattern PaperRow established in javafx-desktop -- the same interoperability gotcha (records don\'t bind directly) applies identically to the new resource.',
      'handleSearch() uses the SAME Task pattern as every other network call in this client -- no new concurrency reasoning is needed, only applying the existing rule to a new feature.',
      'The Gluon iOS build needs exactly ONE new configuration entry (for IdeaDto) -- the UI code itself, extended in the previous section, requires zero iOS-specific changes at all.'
    ]
  },
  lab: {
    title: 'Add a ProjectRow and wire it into a projects search-results display',
    prompt: 'Given <code>Project(Long id, String name, String status)</code> (a record, matching this course\'s DTO pattern) and a JavaFX <code>ListView&lt;ProjectRow&gt; projectResults</code> field: (1) write <code>class ProjectRow</code> with a <code>StringProperty name</code> and a <code>StringProperty status</code>, each with a getter and matching <code>xProperty()</code> method (mirroring <code>IdeaRow</code> exactly); (2) write a method <code>void displayProjects(List&lt;Project&gt; projects)</code> that maps each <code>Project</code> to a <code>ProjectRow</code> and calls <code>projectResults.setItems(FXCollections.observableArrayList(...))</code> with the mapped list.',
    starter: `import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.collections.FXCollections;
import javafx.scene.control.ListView;

import java.util.List;

// TODO 1: class ProjectRow with StringProperty name, StringProperty status, getters + xProperty() methods

class ProjectsController {
    private final ListView<ProjectRow> projectResults = new ListView<>();

    void displayProjects(List<Project> projects) {
        // TODO 2: map each Project to a ProjectRow, then projectResults.setItems(FXCollections.observableArrayList(...))
    }
}`,
    checks: [
      { re: 'class\\s+ProjectRow', must: true, hint: 'Declare class ProjectRow.', pass: 'ProjectRow class declared ✓' },
      { re: 'StringProperty\\s+name\\s*=\\s*new\\s+SimpleStringProperty', must: true, hint: 'ProjectRow needs a StringProperty name field.', pass: 'name StringProperty field ✓' },
      { re: 'StringProperty\\s+status\\s*=\\s*new\\s+SimpleStringProperty', must: true, hint: 'ProjectRow needs a StringProperty status field.', pass: 'status StringProperty field ✓' },
      { re: 'StringProperty\\s+nameProperty\\s*\\(\\s*\\)\\s*\\{\\s*return\\s+name\\s*;', must: true, hint: 'Add public StringProperty nameProperty() { return name; }.', pass: 'nameProperty() method ✓' },
      { re: 'StringProperty\\s+statusProperty\\s*\\(\\s*\\)\\s*\\{\\s*return\\s+status\\s*;', must: true, hint: 'Add public StringProperty statusProperty() { return status; }.', pass: 'statusProperty() method ✓' },
      { re: 'projects\\.stream\\(\\)\\s*\\.map\\(', must: true, hint: 'Map each Project to a ProjectRow using projects.stream().map(...).', pass: 'projects mapped via stream ✓' },
      { re: 'projectResults\\.setItems\\(\\s*FXCollections\\.observableArrayList\\(', must: true, hint: 'Call projectResults.setItems(FXCollections.observableArrayList(...)).', pass: 'projectResults.setItems(...) called ✓' }
    ],
    run: 'A ListView<ProjectRow> should correctly display each project\'s name and status after calling displayProjects(...) with data returned from GET /projects.',
    solution: `import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.StringProperty;
import javafx.collections.FXCollections;
import javafx.scene.control.ListView;

import java.util.List;

class ProjectRow {
    private final StringProperty name = new SimpleStringProperty();
    private final StringProperty status = new SimpleStringProperty();

    ProjectRow(String name, String status) {
        this.name.set(name);
        this.status.set(status);
    }

    public String getName() { return name.get(); }
    public StringProperty nameProperty() { return name; }

    public String getStatus() { return status.get(); }
    public StringProperty statusProperty() { return status; }
}

class ProjectsController {
    private final ListView<ProjectRow> projectResults = new ListView<>();

    void displayProjects(List<Project> projects) {
        List<ProjectRow> rows = projects.stream()
            .map(p -> new ProjectRow(p.name(), p.status()))
            .toList();
        projectResults.setItems(FXCollections.observableArrayList(rows));
    }
}`,
    notes: [
      'ProjectRow is structurally identical to PaperRow and IdeaRow -- the same JavaBean-shaped view model pattern, applied to a third resource, with zero new design decisions needed.',
      'This lab is deliberately the SAME shape as extending the web client to a new resource -- confirming, a third time, that the pattern this course established generalizes cleanly rather than requiring fresh thinking per resource.'
    ]
  },
  quiz: [
    {
      q: 'Why does extending the web client to support ideas require no new JavaScript concepts, only new function calls following the existing pattern?',
      options: ['loadIdeas()/submitIdea() are structurally identical in shape to loadPapers()/submitPaper() -- the same fetch()/response.ok discipline applies to any resource, not something specific to papers', 'JavaScript automatically generates the required functions for any new REST resource without developer intervention', 'Ideas do not actually require any client-side code at all, since they display identically to papers by default', 'The backend automatically pushes idea data to the client without any fetch() call being needed'],
      correct: 0,
      explain: 'The fetch()/response.ok pattern web-frontend-basics established is resource-agnostic -- it applies identically whether calling /papers or /ideas, requiring no new concepts, just the same pattern applied to a new endpoint.'
    },
    {
      q: 'Why must the JavaFX desktop client\'s new search feature use a javafx.concurrent.Task rather than calling the search API directly inside a button\'s onAction handler?',
      options: ['A direct call would run the blocking network request on the JavaFX Application Thread, freezing the entire UI for its duration -- exactly the thread-safety violation javafx-desktop built real depth around', 'Task is required by Spring Boot for any client making requests to a Spring Boot backend', 'onAction handlers are technically incapable of making network requests of any kind', 'This is purely a style preference with no functional consequence either way'],
      correct: 0,
      explain: 'A blocking network call executed directly in an event handler runs on the Application Thread, freezing the UI. Task runs the call on a background thread and safely marshals the result back, keeping the UI responsive throughout.'
    },
    {
      q: 'What is the ONE genuinely new piece of configuration the Gluon iOS build needs for the extended (ideas + search) client, versus the original papers-only client from gluon-mobile-graalvm?',
      options: ['A new reflect-config.json entry for the new DTO type(s) -- native-image\'s closed-world analysis cannot discover Jackson\'s reflective access to a new record type on its own', 'An entirely separate GraalVM native-image build pipeline specific to the new resource', 'A rewritten Scene Graph, since JavaFX code cannot be reused across different resource types', 'A new Apple Developer ID certificate specific to each new resource type added to the app'],
      correct: 0,
      explain: 'gluon-mobile-graalvm\'s central lesson: reflective access to a new type needs an explicit reflect-config.json entry, since native-image\'s build-time analysis cannot discover it on its own. Everything else about the pipeline and UI code remains unchanged.'
    },
    {
      q: 'What is the significance of creating data through one client and immediately seeing it correctly in the other two clients?',
      options: ['It is concrete, working proof that all three clients share exactly one backend and one database -- never separate copies of data that could drift out of sync', 'It proves that JavaFX and JavaScript share an identical runtime environment', 'It indicates the three clients are actually communicating directly with each other rather than through a shared backend', 'It has no particular significance beyond confirming that each client individually works in isolation'],
      correct: 0,
      explain: 'This is the concrete demonstration of the entire API-first architecture: one shared backend and database means data created anywhere is immediately, correctly visible everywhere else, with no possibility of client-specific data copies drifting apart.'
    },
    {
      q: 'What would it cost, specifically, to add a fourth client (a CLI scripting tool) to LogPose, according to this lesson\'s closing argument?',
      options: ['The work of writing that one new client (parsing the same JSON, calling the same endpoints) -- with ZERO required changes to the backend, since the API is already general-purpose and client-agnostic', 'A complete backend rewrite to support a fourth simultaneous client type', 'Nothing at all -- a CLI tool would need no development work whatsoever to interact with LogPose', 'A new database schema specific to command-line access patterns'],
      correct: 0,
      explain: 'The backend needs zero changes -- it was already built client-agnostic. The entire cost is writing the new client itself, the concrete payoff of every architectural decision this course made building the API first.'
    }
  ],
  testFlow: {
    title: 'Test yourself: cross-client consistency, Task discipline, and the fourth-client thought experiment',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'An idea is created via the web client with no relatedPaperId. Loading the JavaFX desktop client\'s ideas view afterward shows that same idea correctly. Why does this work with no special handling anywhere?',
        choices: [
          { text: 'Both clients call the same /ideas endpoint against the same backend and database -- the idea exists once, in one place, and any client asking for it sees the exact same data', to: 'q1_right' },
          { text: 'The desktop client automatically synchronizes with the web client\'s local browser storage', to: 'q1_wrong_localsync' },
          { text: 'JavaFX and JavaScript share a common in-memory cache that keeps both clients\' data in sync', to: 'q1_wrong_sharedcache' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- there is exactly one backend and one database. Both clients are simply different windows onto the same underlying data, with no synchronization mechanism needed because there was never more than one copy to begin with.', next: 'q2' },
      q1_wrong_localsync: { end: true, correct: false, text: 'The desktop client has no access to or awareness of the web client\'s browser storage at all -- both clients independently call the same backend API, which is the actual, sole source of truth.', retry: 'q1' },
      q1_wrong_sharedcache: { end: true, correct: false, text: 'JavaFX and JavaScript run in completely separate runtimes with no shared memory of any kind -- the consistency comes entirely from both calling the same backend, not from any client-side cache.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'The desktop client\'s new search feature is implemented by calling paperClient.search(query) directly inside a Button\'s onAction handler, with no Task involved. What breaks?',
        choices: [
          { text: 'The entire UI freezes for the duration of the network call, since it now runs on the JavaFX Application Thread instead of a background thread', to: 'q2_right' },
          { text: 'The search silently returns no results at all, regardless of the query', to: 'q2_wrong_noresults' },
          { text: 'Nothing breaks -- Task is only required for the initial papers-loading feature, not for search specifically', to: 'q2_wrong_notrequired' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- any blocking network call executed directly on the Application Thread freezes the whole UI for its duration, exactly javafx-desktop\'s thread-safety warning, now relevant to this new feature just as much as any other network call.', next: 'q3' },
      q2_wrong_noresults: { end: true, correct: false, text: 'The search would still eventually return correct results -- the problem is that the UI becomes completely unresponsive WHILE waiting for them, not that the results themselves are wrong.', retry: 'q2' },
      q2_wrong_notrequired: { end: true, correct: false, text: 'Task\'s thread-safety discipline applies to ANY blocking network call inside a JavaFX application, not just the specific feature it was first introduced for -- search is exactly as much a blocking call as loading papers.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A stakeholder asks how much backend work is needed to add a fourth client (a CLI tool). What is the accurate answer, given this lesson\'s architecture?',
        choices: [
          { text: 'Zero backend work -- the existing endpoints are already general-purpose and client-agnostic; the entire cost is writing the new client itself', to: 'q3_right' },
          { text: 'A new set of CLI-specific endpoints would need to be built alongside the existing ones', to: 'q3_wrong_newendpoints' },
          { text: 'The database schema would need a new column specifically identifying which client created each record', to: 'q3_wrong_newcolumn' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- this is the concrete payoff of building the API client-agnostic from the start: a fourth client costs exactly the work of writing that client, with zero required backend changes at all.', next: null },
      q3_wrong_newendpoints: { end: true, correct: false, text: 'This is exactly the anti-pattern capstone-design argued against -- per-client endpoint groups reintroduce duplicated logic; the existing endpoints already serve any HTTP-capable client identically, CLI included.', retry: 'q3' },
      q3_wrong_newcolumn: { end: true, correct: false, text: 'Nothing about the schema needs to track which client created a record -- the API is deliberately agnostic to which client is calling it, and there is no architectural reason to distinguish clients at the data layer at all.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Assuming a new client-side feature needs new JavaScript/JavaFX concepts rather than the existing fetch()/Task pattern applied to a new endpoint -- every new resource this lesson adds reuses the identical pattern already established.',
    'Calling a blocking network method directly inside a JavaFX event handler for a NEW feature, forgetting the Task discipline applies to every network call, not just the ones from earlier lessons.',
    'Forgetting to add a reflect-config.json entry for each new DTO type before rebuilding the Gluon iOS client -- the exact same closed-world gap gluon-mobile-graalvm warned about, now relevant to every new resource added.',
    'Diagnosing a cross-client data mismatch as an architecture problem before checking, directly, whether the data actually exists in the database at all -- most such issues are an ordinary client-side bug (a silently-failed create, per web-frontend-basics\' own fetch()-resolves-on-error warning), not a flaw in the shared-backend design.',
    'Proposing per-client-tailored endpoints "for convenience" once multiple clients exist -- reintroduces exactly the duplicated-logic risk building one shared, client-agnostic API was specifically meant to avoid.',
    'Treating the "one backend, three clients" architecture as a design claim to trust rather than something to actually verify by creating data in one client and confirming it in the others -- this lesson\'s whole point is running that proof, not just asserting it.'
  ],
  interview: [
    {
      q: 'Walk through, concretely, how you would demonstrate to a skeptical stakeholder that LogPose\'s three clients genuinely share one backend rather than maintaining separate data.',
      a: 'I would run exactly this lesson\'s own verification sequence live: create a paper with a distinctive title through the web client, then immediately load the JavaFX desktop client\'s papers view and show that same paper appearing, with no manual data transfer of any kind between them. Then create an idea with no related paper specifically through the desktop client, and search for it by MEANING (not exact words) from the Gluon iOS build, showing it surface correctly. The concrete, undeniable proof isn\'t an architecture diagram — it\'s watching data created in one place appear correctly somewhere else, with nothing but a network request in between.'
    },
    {
      q: 'A team member proposes caching search results locally in each client to "reduce backend load." Evaluate this against the architecture this lesson demonstrates.',
      a: 'This is a legitimate performance optimization IF the actual load justifies it, but it introduces a genuine cost worth naming precisely: a LOCAL cache means each client now potentially shows STALE results if the underlying data changes elsewhere — exactly the cross-client consistency this lesson\'s whole verification exercise depends on would be at risk the moment ANY client caches aggressively without an invalidation strategy. Before adding this, I would want actual evidence backend load from search is a real bottleneck (not a hypothetical one), and if so, cache at the SHARED level (a Redis layer in front of the backend, say) rather than per-client, preserving the one-source-of-truth guarantee every client currently relies on.'
    },
    {
      q: 'Defend the decision to build the Gluon iOS client by cross-compiling the SAME JavaFX code as the desktop client, rather than writing a native Swift/SwiftUI app.',
      a: 'A native Swift app would likely offer a more polished, platform-idiomatic feel, and that\'s a real, legitimate tradeoff. But it would mean maintaining TWO entirely separate UI codebases (JavaFX for desktop, Swift for iOS) implementing the SAME features twice, in two different languages, with two independent chances to drift out of sync — exactly the duplicated-logic risk this course has argued against since maven-multi-module\'s dependencyManagement and jdbc-transactions\' PreparedStatement discipline. Gluon\'s value proposition is specifically that ONE UI codebase, written once, serves both platforms — a real, deliberate tradeoff of some platform-specific polish in exchange for a single source of truth for LogPose\'s actual UI logic, which for a personal research tool (not a commercially-polished consumer app) is the right tradeoff.'
    },
    {
      q: 'A new engineer joins the team and asks: "If I need to add a fifth resource type to LogPose next month, what do I actually need to build?" Give a precise, complete answer based on this lesson\'s and capstone-build-backend\'s patterns.',
      a: 'Backend: a migration creating the table (in dependency order, per capstone-build-backend\'s own material), a JPA entity, a Spring Data repository, a thin service and controller following PaperController/IdeaController\'s exact shape, and — if it needs to be searchable — adding it to HybridSearchIndex\'s indexing logic. Clients: a fetch()-based section in the web client, a JavaBean-shaped view model (an "XRow" class) plus a Controller in the JavaFX client, and one new reflect-config.json entry for the Gluon iOS build. Every single piece of this is a DIRECT repetition of a pattern already established at least twice in this course — there is no new architectural decision required at all, only applying the existing, proven pattern to a new resource.'
    }
  ]
};
