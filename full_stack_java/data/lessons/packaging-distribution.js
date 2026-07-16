window.LESSONS = window.LESSONS || {};
window.LESSONS['packaging-distribution'] = {
  id: 'packaging-distribution',
  title: 'Shipping It: jlink, jpackage, Mac .app/.dmg, Signing & Notarization',
  category: 'Part 12 — Cross-Platform Apps',
  timeMin: 40,
  summary: 'gluon-mobile-graalvm shipped LogPose to iOS via GraalVM AOT compilation. Part 12\'s final lesson ships javafx-desktop\'s LogPose desktop client the ordinary Mac way: jlink builds a custom, minimal Java runtime containing ONLY the modules the app actually uses (not a full JDK), jpackage wraps that runtime plus the application into a genuine native installer (a .app bundle, then a .dmg disk image) a user can simply double-click — no "install a JDK first" step at all — and, because this course targets Mac specifically, code signing and Apple\'s notarization requirement close the loop: an unsigned or unnotarized Mac app is blocked or scarily-warned-about by Gatekeeper the moment a real user tries to open it, regardless of how correct the application itself is.',
  goals: [
    'Explain what jlink does — building a custom runtime image containing only the JDK modules an application actually needs — and why this produces a dramatically smaller distributable than bundling a full JDK',
    'Use jpackage to wrap a JAR and a jlink-built runtime into a native, double-clickable application (a Mac .app bundle)',
    'Package a .app bundle into a .dmg disk image, the standard Mac distribution format',
    'Explain what code signing proves (and does not prove) about a Mac application, and why an app distributed outside the Mac App Store still needs a valid Developer ID signature',
    'Explain Apple\'s notarization requirement precisely: what it checks, why it exists in addition to signing, and what happens when a user tries to open an app that lacks it'
  ],
  concept: [
    {
      h: 'jlink: a custom runtime containing only the modules an app actually needs',
      p: [
        'Distributing a Java desktop application traditionally meant either requiring the USER to separately install a JDK first (a real barrier for an ordinary, non-technical user simply trying to run an app) or bundling an ENTIRE, full JDK alongside the application — every standard library module, whether the app uses it or not, often adding well over 150MB to the download for functionality the specific application may never touch at all. <code>jlink</code> (the Java LINKer, part of every JDK installation since Java 9\'s introduction of the module system) solves this by building a CUSTOM, MINIMAL runtime image containing ONLY the specific JDK modules the application actually declares it depends on — <code>jlink --module-path ... --add-modules java.base,java.sql,javafx.controls --output myapp-runtime</code> produces a working, complete Java runtime (capable of running the application, with its own bundled <code>java</code> launcher) containing JUST those named modules and whatever they themselves transitively require, omitting every other standard module the full JDK would otherwise include unconditionally.',
        'This directly connects to jvm-architecture\'s own memory/footprint material and this course\'s repeated "measure and include only what you actually need" instinct (maven-fundamentals\' dependency scopes, this course\'s own repeated warnings against including more than a specific use case requires) — a jlink-built runtime for a modest JavaFX desktop application, needing perhaps <code>java.base</code>, <code>java.sql</code>, and JavaFX\'s own modules, can be a small fraction of a full JDK\'s size, meaningfully smaller to download and distribute, with a correspondingly smaller ATTACK SURFACE too (a module never included at all cannot be a vector for a vulnerability in code the application never actually uses). <code>jlink</code> requires the application\'s dependencies to be expressed as JDK MODULES (a <code>module-info.java</code> declaring <code>requires java.sql;</code> and similar) — an application not yet modularized needs either genuine modularization or jlink\'s own support for treating non-modular JARs as "automatic modules," a real, sometimes friction-adding migration step for an existing, pre-modular codebase.'
      ]
    },
    {
      h: 'jpackage: wrapping a runtime and a JAR into a real, native, double-clickable app',
      p: [
        'A jlink-built runtime plus a JAR file is still, on its own, something a typical user would need to run from a command line — genuinely unfriendly for real, ordinary distribution. <code>jpackage</code> (also standard since JDK 14+) solves the remaining gap: it wraps a JAR (or an entire jlink-built runtime image) into an actual, NATIVE application package for whatever platform it\'s run on — a genuine <code>.app</code> bundle on macOS, an <code>.exe</code>/<code>.msi</code> installer on Windows, a <code>.deb</code>/<code>.rpm</code> package on Linux — each one the SAME kind of artifact a user\'s operating system already knows how to install and launch through its own normal, familiar mechanisms (double-clicking an app icon, running a standard installer wizard), with NO separate "please install a JDK first" instruction needed anywhere, since the ENTIRE required runtime is bundled inside the package itself.',
        '<code>jpackage --input target/ --name LogPose --main-jar logpose-desktop.jar --main-class com.logpose.LogPoseApp --type app-image --icon logpose.icns --runtime-image myapp-runtime</code> (the exact flags vary somewhat by target platform and jpackage version) produces a genuine <code>LogPose.app</code> bundle on macOS — a real, self-contained application directory structure macOS itself recognizes and can launch directly, containing the application\'s compiled classes, the jlink-built minimal runtime from the previous section, an application icon, and the platform-appropriate metadata (an <code>Info.plist</code> file, macOS\'s own standard application-descriptor format) every genuine Mac application needs. <code>--type dmg</code> (or a separate jpackage invocation with that type) instead produces a <code>.dmg</code> DISK IMAGE — the standard, familiar macOS distribution format users are accustomed to downloading, double-clicking to mount, and dragging the application icon from into their Applications folder, the conventional final packaging step for genuinely public Mac software distribution.'
      ]
    },
    {
      h: 'Code signing: proving who built it and that it hasn\'t been tampered with — not proving it\'s safe',
      p: [
        'Once a genuine <code>.app</code> bundle exists, macOS\'s GATEKEEPER security system checks whether it\'s been CODE SIGNED before allowing a user to run it without a scary warning — signing an application with a valid Apple DEVELOPER ID certificate (obtained through Apple\'s paid Developer Program) cryptographically attaches the DEVELOPER\'S IDENTITY to the app bundle, and, critically, a TAMPER-DETECTION mechanism: if even a single byte of the signed application is modified AFTER signing (by a virus injecting malicious code into a legitimate app, say, or simple corruption during download), the signature verification FAILS, and Gatekeeper refuses to run the now-invalid, tampered bundle at all. This is worth stating with the same precision spring-data-security\'s JWT-signature material used for exactly the same distinction: signing proves AUTHENTICITY (this really came from the developer who holds this specific Developer ID) and INTEGRITY (it hasn\'t been modified since that developer signed it) — it does NOT prove the application is SAFE, well-behaved, or free of bugs/malicious intent; a signed app can, in principle, still be a genuinely malicious app, AS LONG AS the actual malicious developer legitimately holds a valid Developer ID certificate under their own real identity.',
        'This directly explains WHY signing alone, while necessary, is not the entire security mechanism macOS relies on: a valid signature traces malicious behavior back to a SPECIFIC, real, accountable Developer ID (letting Apple revoke that specific developer\'s certificate and block every app they\'ve ever signed, once malicious behavior is discovered) — a meaningful deterrent and remediation mechanism, but one that acts AFTER the fact, once a problem is already discovered, not a guarantee that PREVENTS a signed app from ever behaving badly in the first place. This gap is exactly what the next section\'s notarization requirement exists specifically to help close.'
      ]
    },
    {
      h: 'Notarization: Apple\'s own automated scan, required in addition to signing',
      p: [
        'NOTARIZATION is a genuinely SEPARATE requirement from signing, and conflating the two is a common, understandable mistake worth correcting precisely: after building and SIGNING a <code>.app</code> (or a <code>.dmg</code> containing one), the developer additionally UPLOADS it to APPLE\'S OWN servers (via <code>xcrun notarytool submit</code>) — Apple runs its OWN AUTOMATED MALWARE-SCANNING analysis against the submitted binary, checking for known malicious code patterns, disallowed API usage, and other automated red flags — entirely SEPARATE from and IN ADDITION TO the app already being correctly signed with a valid Developer ID. If Apple\'s automated scan finds nothing concerning, it issues a NOTARIZATION TICKET, which the developer then STAPLES to the app bundle (<code>xcrun stapler staple LogPose.app</code>) — a permanently-attached record that this SPECIFIC binary was submitted to and cleared by Apple\'s own scanning process, verifiable even later, OFFLINE, without needing to re-contact Apple\'s servers every single time the app is subsequently launched.',
        'This closes exactly the gap the previous section named: signing alone proves WHO built it and that it hasn\'t been tampered with SINCE that specific developer signed it — notarization ADDS an independent, Apple-run automated check that the SUBMITTED CONTENT ITSELF didn\'t trip any of Apple\'s own known-malware/suspicious-behavior detectors, at the specific moment it was submitted. An app distributed OUTSIDE the Mac App Store (any distribution method OTHER than Apple\'s own store, including a downloadable .dmg from a developer\'s own website — precisely how a LogPose desktop client would likely be distributed) that is signed but NOT notarized triggers Gatekeeper to either BLOCK the app from launching entirely or show the user a genuinely alarming, trust-eroding security warning (the exact wording and severity has changed across macOS versions, but the practical effect — most ordinary users abandoning the install rather than working around a scary warning — is consistent) — meaning notarization, despite being conceptually a separate, additional step from signing, is, in PRACTICE, an unconditional requirement for any Mac application meant for real, ordinary public distribution outside the App Store, not an optional extra polish step.'
      ]
    },
    {
      h: 'Putting it together: the complete pipeline from compiled code to a distributable .dmg',
      p: [
        'The full, ordered pipeline for shipping javafx-desktop\'s LogPose client as a real Mac application: (1) compile the application normally (<code>mvn package</code>, producing the ordinary JAR this course has built throughout); (2) run <code>jlink</code> to build a MINIMAL custom runtime containing only the specific JDK/JavaFX modules the application actually declares it needs; (3) run <code>jpackage</code>, combining the compiled JAR and the jlink-built runtime into a genuine <code>LogPose.app</code> bundle (and/or directly into a <code>.dmg</code>, depending on the exact invocation); (4) CODE SIGN the resulting <code>.app</code>/<code>.dmg</code> with a valid Apple Developer ID certificate, cryptographically attaching the developer\'s identity and a tamper-detection guarantee; (5) SUBMIT the signed artifact to Apple\'s notarization service and wait for a clearance ticket; (6) STAPLE that ticket to the final artifact, producing something a real, ordinary user can download, double-click, and run with NO scary Gatekeeper warning, and NO separate JDK installation step, at all.',
        'This entire pipeline is worth recognizing as the SAME general shape this course has built toward repeatedly, now applied specifically to DESKTOP distribution rather than a database schema, a REST API, or a mobile app: each stage takes the OUTPUT of the previous one and adds exactly ONE well-defined additional guarantee — jlink minimizes size/attack-surface, jpackage adds native platform integration, signing adds authenticity/tamper-detection, notarization adds Apple\'s own independent safety check — precisely mirroring the layered, each-stage-adds-one-specific-guarantee structure this course built for HTTP requests moving through validation-then-business-logic-then-persistence in spring-boot-rest-api, or a JWT\'s own signature-plus-claims structure in spring-data-security. Understanding each stage\'s SPECIFIC, distinct contribution (rather than treating "packaging a Mac app" as one opaque, monolithic step) is exactly what lets a developer correctly diagnose WHICH stage is actually failing when a real distribution pipeline breaks — a signing failure, a notarization rejection, and a jpackage configuration error all produce genuinely different symptoms, and knowing which stage is actually responsible is the difference between a quick, targeted fix and a frustrating, unfocused debugging session.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s traveling gift crate: only the tools this trip needs, a proper crate, a wax seal, and the Marine inspection stamp',
      text: 'When Franky sends a finished invention off to a distant ally as a gift, he never just hands over his ENTIRE workshop\'s full toolkit along with it — that would be enormous, wasteful, and mostly useless cargo for a recipient who only needs to USE the one specific invention, not maintain Franky\'s entire shipyard. Instead, he carefully selects and packs ONLY the specific spare parts and tools THIS SPECIFIC invention actually needs to keep running — nothing more (jlink: a minimal runtime containing only the modules an application actually declares it needs). He then builds a proper, sturdy, clearly-labeled CRATE around the invention and its minimal parts kit — something the receiving crew can simply open and start using immediately, with no need to separately assemble a workshop of their own first (jpackage: wrapping the app and its minimal runtime into a real, ready-to-use native package). Franky presses his own personal, distinctive WAX SEAL into the crate before it ships — a seal that proves, unmistakably, that THIS crate genuinely came from Franky himself, and that breaks visibly and unmistakably if anyone tampers with the crate\'s contents after it left his hands (code signing: proving authenticity and detecting tampering, though NOT, on its own, proving the CONTENTS are safe — Franky\'s seal only proves the crate is genuinely his, not that nothing dangerous is inside). And beyond Franky\'s own personal seal, before this crate is allowed to cross into allied territory at all, it must ALSO pass through an independent MARINE INSPECTION CHECKPOINT — officials who open and specifically examine the crate\'s actual contents themselves, checking for anything genuinely dangerous, and stamp it with their OWN separate, additional clearance mark once satisfied (notarization: Apple\'s own independent, automated scan, checked and stapled ON TOP of the developer\'s own signature — a genuinely separate step, not simply a formality of the sealing process). A crate bearing ONLY Franky\'s wax seal but missing the Marine inspection stamp gets stopped and flagged with real suspicion at every allied checkpoint, regardless of how trustworthy Franky himself actually is — both marks, together, are what actually lets the crate through smoothly and without alarm.',
    },
    sitcom: {
      show: 'Friends',
      title: 'Monica\'s care package: only the ingredients this recipe needs, a proper box, a signature, and the shipping company\'s own inspection',
      text: 'When Monica sends a homemade dish to a friend out of town, she never packs her ENTIRE kitchen along with it — that would be enormous, wasteful, and mostly useless for a friend who only needs to EAT the one specific dish, not run a restaurant kitchen themselves. Instead, she carefully selects and packs ONLY the specific ingredients and reheating instructions THIS SPECIFIC dish actually needs — nothing more (jlink: a minimal runtime containing only the modules an application actually declares it needs). She then packs everything into a proper, sturdy, clearly-labeled BOX the recipient can simply open and start using immediately, with no separate trip to the grocery store first (jpackage: wrapping the app and its minimal runtime into a real, ready-to-use native package). Monica writes and signs a personal note on the box before it ships — proving, unmistakably, that this package genuinely came from HER, and immediately noticeable if the box has been opened and tampered with after leaving her hands (code signing: proving authenticity and detecting tampering, though NOT, on its own, proving the CONTENTS are actually safe to eat — Monica\'s own signature only proves the box is genuinely hers, not that nothing\'s gone wrong with it in transit). And beyond Monica\'s own personal note, before this package is allowed to actually reach her friend at all, it must ALSO pass through the SHIPPING COMPANY\'S OWN INSPECTION — an independent check specifically scanning for anything genuinely dangerous inside any package they carry, stamped with their OWN separate clearance mark once satisfied (notarization: an independent automated scan, checked and stapled ON TOP of the sender\'s own signature — a genuinely separate step, not simply part of signing the note). A package bearing ONLY Monica\'s personal note but missing the shipping company\'s own clearance stamp gets held up and flagged with real suspicion, regardless of how trustworthy Monica herself actually is — both marks, together, are what actually lets the package arrive smoothly and without alarm.',
    },
    why: 'Franky\'s / Monica\'s selecting only the specific parts/ingredients THIS invention/dish actually needs, rather than the whole workshop/kitchen, is jlink\'s minimal custom runtime. Packing everything into one sturdy, ready-to-use crate/box is jpackage wrapping the app and runtime into a real native package. The personal wax seal / signed note, proving genuine origin and detecting tampering but NOT proving the contents are safe on its own, is code signing. And the SEPARATE, independent Marine inspection stamp / shipping company\'s own scan, required IN ADDITION to the personal seal before the package is allowed through, is Apple\'s notarization — genuinely additional, not a formality folded into signing, and unconditionally required in practice for real public distribution.'
  },
  storyAnim: {
    title: 'Only the parts this invention needs, a sturdy crate, a personal seal, and an independent inspection stamp',
    h: 340,
    props: [
      { id: 'selectparts', emoji: '🧰', label: 'only the specific parts THIS invention needs -- not the whole workshop (jlink)', x: 6, y: 8 },
      { id: 'crate', emoji: '📦', label: 'a sturdy, ready-to-use crate around it (jpackage: .app / .dmg)', x: 30, y: 8 },
      { id: 'seal', emoji: '🖋️', label: 'Franky\'s personal wax seal -- proves origin, breaks if tampered with (code signing)', x: 54, y: 8 },
      { id: 'inspection', emoji: '🔍', label: 'a SEPARATE Marine inspection stamp, required in addition (notarization)', x: 78, y: 8 },
      { id: 'blocked', emoji: '🚫', label: 'sealed but uninspected: stopped and flagged at every checkpoint regardless of trust', x: 40, y: 50 },
      { id: 'clearedthrough', emoji: '✅', label: 'both marks together: through smoothly, no alarm', x: 68, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 78 },
      { id: 'marine', emoji: '🎖️', label: 'inspector', x: 65, y: 78 }
    ],
    steps: [
      { c: 'Franky selects only the specific parts THIS invention actually needs -- not his whole workshop.', p: { selectparts: 'lit' }, a: { franky: [20, 30] } },
      { c: 'Everything is packed into one sturdy crate, ready to use immediately.', p: { crate: 'good' } },
      { c: 'Franky presses his own personal wax seal into the crate -- proof of origin, and it breaks visibly if tampered with.', p: { seal: 'good' } },
      { c: 'A SEPARATE, independent Marine inspection is also required before the crate crosses into allied territory.', p: { inspection: 'lit' }, a: { marine: [65, 30] } },
      { c: 'A crate with the seal but missing the inspection stamp is stopped and flagged, regardless of how trustworthy the sender is.', p: { blocked: 'bad' } },
      { c: 'Only with BOTH marks together does the crate pass through smoothly, without alarm.', p: { clearedthrough: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From jlink\'s minimal runtime to jpackage, signing, and notarization',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'jlink',
        nodes: [
          { id: 'jlinkmin', text: 'jlink: a custom runtime with\nONLY the modules actually needed' },
          { id: 'jlinksize', text: 'far smaller than bundling\na full JDK, smaller attack surface' }
        ]
      },
      {
        label: 'jpackage',
        nodes: [
          { id: 'nativewrap', text: 'jpackage: JAR + jlink runtime\n-> a real .app / .exe / .deb' },
          { id: 'dmgformat', text: '.dmg: the standard Mac\ndistribution disk image' }
        ]
      },
      {
        label: 'Signing',
        nodes: [
          { id: 'signingproves', text: 'signing: proves WHO built it,\nand no tampering since' },
          { id: 'signingnotenough', text: 'does NOT prove the app\nis safe or bug-free' }
        ]
      },
      {
        label: 'Notarization',
        nodes: [
          { id: 'notarizescan', text: 'Apple\'s own automated scan,\nSEPARATE from signing' },
          { id: 'gatekeeperblock', text: 'signed but not notarized:\nGatekeeper blocks or warns' }
        ]
      }
    ],
    steps: [
      { active: ['jlinkmin'], note: 'jlink builds a runtime image containing only the specific JDK/JavaFX modules the application actually declares it needs.' },
      { active: ['jlinksize'], note: 'This is dramatically smaller than bundling a full JDK, and reduces the attack surface, since unused modules are never included at all.' },
      { active: ['nativewrap'], note: 'jpackage wraps a JAR plus a jlink runtime into a genuine native application package for the target platform.' },
      { active: ['dmgformat'], note: 'On macOS, this produces a .app bundle and, ultimately, a .dmg disk image -- the standard, familiar Mac distribution format.' },
      { active: ['signingproves'], note: 'Code signing with a Developer ID certificate proves the app came from a specific, accountable developer and hasn\'t been tampered with since.' },
      { active: ['signingnotenough'], note: 'Signing does not prove the app is safe or well-behaved -- a malicious developer with a valid certificate could still sign a harmful app.' },
      { active: ['notarizescan'], note: 'Notarization is Apple\'s own, separate, automated malware scan of the submitted binary, required in addition to signing.' },
      { active: ['gatekeeperblock'], note: 'An app that is signed but not notarized is blocked or shown an alarming warning by Gatekeeper when a user tries to open it.' }
    ]
  },
  tech: [
    {
      q: 'A developer bundles a full JDK alongside their JavaFX application instead of using jlink, reasoning "it\'s simpler, and disk space is cheap anyway." Evaluate this reasoning, including the security dimension beyond just download size.',
      a: 'The "disk space is cheap" argument addresses only ONE of two genuinely separate costs, and even on that narrow dimension, understates the real-world impact: a full JDK bundled unconditionally can add well over 150MB to every single download and every future update, a genuinely real cost at scale (across potentially thousands or millions of users, and for anyone on a slow or metered connection) even if any INDIVIDUAL user\'s local disk space is indeed cheap. But the more significant, frequently-overlooked cost is the SECURITY dimension this lesson\'s jlink section names explicitly: every module bundled in a full JDK, WHETHER THE APPLICATION ACTUALLY USES IT OR NOT, is a module whose code is now PRESENT and RUNNABLE inside the shipped application — if a security vulnerability is later discovered in some JDK module the application never actually touches at all (say, a module handling a specific network protocol the app has no use for), that vulnerability is still technically present and exploitable inside every copy of the unnecessarily-bundled full JDK, purely because it was included "just in case" rather than because the application genuinely needs it. jlink\'s minimal-modules approach means a module never included in the first place literally cannot be a vector for a vulnerability in code that was never shipped at all — this is a genuine, structural security benefit ("cheap disk space" doesn\'t address at all, since the concern isn\'t storage cost, it\'s the ATTACK SURFACE of code present and exploitable regardless of whether it\'s ever intentionally invoked by the application\'s own logic. The correct evaluation: "disk space is cheap" is true but answers the wrong question — the real cost of skipping jlink is a combination of unnecessary download/update size AND a genuinely larger, avoidable security attack surface, both of which jlink\'s minimal-modules approach directly and specifically addresses.'
    },
    {
      q: 'An application\'s .app bundle is correctly signed with a valid Developer ID certificate, but a user reports that opening it produces a genuinely alarming Gatekeeper security warning (not a clean, silent launch). Diagnose the most likely missing step, and explain precisely why signing alone was insufficient.',
      a: 'The most likely missing step is NOTARIZATION — this lesson\'s concept section draws exactly this distinction precisely: signing and notarization are two genuinely SEPARATE requirements, and a correctly-signed app that has NOT ALSO been submitted to and cleared by Apple\'s own notarization service will, for distribution outside the Mac App Store, trigger Gatekeeper to show a security warning (or outright block launching, depending on the specific macOS version and configuration) DESPITE the signature itself being entirely valid and correctly applied. This is precisely why signing alone is insufficient in practice, even though it IS a genuine, necessary security mechanism on its own terms: signing proves the app came from a specific, identifiable Developer ID and hasn\'t been tampered with SINCE that developer signed it — but it says NOTHING about whether APPLE\'S OWN independent, automated malware-scanning analysis has ever actually examined this SPECIFIC binary\'s contents at all; a developer could, in principle, sign a genuinely malicious application with their own perfectly valid, legitimately-obtained Developer ID certificate, and the SIGNATURE alone would remain completely valid despite the app being harmful — Apple\'s notarization step exists SPECIFICALLY to add an independent check the developer\'s own signature cannot provide on its own. The fix is straightforward once correctly diagnosed: submit the ALREADY-SIGNED .app (or .dmg) to Apple\'s notarization service (xcrun notarytool submit), wait for the clearance ticket, and STAPLE that ticket to the final distributed artifact (xcrun stapler staple) — after which the SAME signed binary, now ALSO notarized, launches cleanly for users with no Gatekeeper warning at all.'
    },
    {
      q: 'Explain precisely why jlink requires an application\'s dependencies to be expressed as JDK modules (via module-info.java or jlink\'s "automatic module" support for plain JARs), rather than working directly against an arbitrary classpath the way a normal `java -cp ...` invocation does.',
      a: 'jlink\'s entire value proposition — building a MINIMAL runtime containing ONLY the specific modules an application actually needs — REQUIRES a mechanism for precisely determining WHICH modules are actually needed at all, and the Java Platform Module System\'s module declarations (requires java.sql; and similar, in a module-info.java) are specifically what makes this determination POSSIBLE and RELIABLE in the first place. A plain, unstructured CLASSPATH (the traditional -cp mechanism, predating the module system) carries NO explicit, checkable declaration of which specific JDK modules a given JAR actually depends on at all — from jlink\'s perspective, examining an ordinary, non-modular JAR gives no reliable, structured signal about "this specific JAR needs java.sql but not java.desktop," since classpath-based code can, in principle, reflectively reference ANY class on the classpath at runtime with no static, checkable declaration of that dependency existing anywhere at all (directly connecting back to gluon-mobile-graalvm\'s own closed-world-assumption material — a similar fundamental tension between "genuinely dynamic, undeclared runtime behavior" and "a build-time tool needing to know in advance exactly what will be needed"). Explicit module declarations solve this by making dependencies a STATIC, DECLARED, checkable fact jlink\'s own tooling can actually read and act on directly, rather than something it would need to somehow infer or guess at from unstructured, potentially dynamically-dispatched classpath code. jlink\'s support for treating plain, non-modular JARs as "automatic modules" is a genuine, useful accommodation for legacy code not yet fully modularized — but it works by INFERRING a module\'s name and treating the ENTIRE JAR as one coarse-grained dependency unit (rather than the fine-grained, package-level dependency declarations a genuine module-info.java provides), meaning the minimality benefit jlink provides is generally WEAKER for an application built entirely from automatic modules than for one using genuine, fully-declared module dependencies throughout.'
    },
    {
      q: 'A team\'s CI pipeline successfully builds, signs, and notarizes a Mac app, but a user on an OLDER version of macOS reports the app fails to launch with an error unrelated to signing or notarization entirely. Given this lesson\'s "each stage adds one specific guarantee, diagnose which stage is actually failing" framing, what should the team investigate, and why is this NOT a signing/notarization problem?',
      a: 'Given that the app was successfully SIGNED and NOTARIZED (both stages, per this lesson\'s explicit framing, specifically address AUTHENTICITY/TAMPER-DETECTION and APPLE\'S OWN MALWARE SCAN respectively — neither of which has anything to do with whether the bundled RUNTIME itself is actually compatible with a given macOS version), and the reported failure is described as "unrelated to signing or notarization entirely," the most likely root cause lies in an EARLIER stage of this lesson\'s own pipeline: the jlink-built runtime, or the jpackage-produced native bundle itself, being built for or targeting a NEWER macOS version/architecture than the user\'s older system actually has — a genuinely different KIND of problem than anything signing or notarization could ever catch, since both of those stages operate on the ALREADY-BUILT artifact\'s authenticity and safety, entirely independent of whether that artifact is actually functionally COMPATIBLE with a given user\'s specific OS version or CPU architecture (Intel vs. Apple Silicon, a genuinely separate concern from anything covered in this lesson\'s five sections, though a real, practical consideration for actual Mac distribution). The team should investigate: (1) whether jpackage was invoked with a MINIMUM macOS version target compatible with the user\'s system (jpackage/Xcode tooling support specifying a deployment target, and building for a version newer than the user\'s actual system is a common, real cause of exactly this symptom); (2) whether the build produced a UNIVERSAL binary (supporting both Intel and Apple Silicon architectures) or was built for only ONE architecture that doesn\'t match the reporting user\'s specific Mac hardware; (3) whether the jlink-built runtime itself has any minimum-OS-version requirement inherited from the specific JDK/JavaFX version used to build it. The general, precise diagnostic principle this lesson\'s own "each stage adds one specific, distinct guarantee" framing directly supports: a failure symptom should be matched against WHICH stage\'s specific guarantee is actually relevant to that symptom — signing/notarization issues manifest specifically as Gatekeeper warnings/blocks ABOUT TRUST, not as a generic launch failure or crash, which instead points toward an earlier, build/compatibility-related stage entirely.'
    }
  ],
  code: {
    title: 'The complete pipeline: jlink, jpackage, signing, and notarization for LogPose Desktop',
    intro: 'Building javafx-desktop\'s LogPose client into a signed, notarized .dmg — each command shown in the exact order the pipeline actually requires, with a comment on what specific guarantee that stage adds.',
    code: `# --- STAGE 1: build the application normally (this course's standard Maven build) ---
mvn package
# produces target/logpose-desktop.jar


# --- STAGE 2: jlink -- a MINIMAL custom runtime, only the modules LogPose actually needs ---
jlink \\
  --module-path "$JAVA_HOME/jmods:target/javafx-jmods" \\
  --add-modules java.base,java.sql,java.net.http,javafx.controls,javafx.fxml \\
  --output target/logpose-runtime \\
  --strip-debug --no-header-files --no-man-pages
# produces target/logpose-runtime/ -- a complete, working Java runtime containing
# ONLY these five modules (and whatever they themselves transitively require),
# NOT an entire full JDK's worth of every standard module


# --- STAGE 3: jpackage -- wrap the JAR + runtime into a genuine native .app bundle ---
jpackage \\
  --input target/ \\
  --name LogPose \\
  --main-jar logpose-desktop.jar \\
  --main-class com.logpose.LogPoseApp \\
  --runtime-image target/logpose-runtime \\
  --icon logpose.icns \\
  --type app-image \\
  --mac-package-identifier com.logpose.desktop
# produces LogPose.app -- a real, double-clickable macOS application bundle,
# self-contained, requiring NO separately-installed JDK on the user's machine at all


# --- STAGE 4: code signing -- proves WHO built it, detects any tampering since ---
codesign --deep --force --verify --verbose \\
  --sign "Developer ID Application: Example Studio (TEAMID1234)" \\
  --options runtime \\
  LogPose.app
# NOTE: --options runtime enables the "hardened runtime" -- required by Apple
# for an app to be eligible for notarization in the next stage at all


# --- STAGE 5: package the signed .app into a .dmg -- the standard Mac distribution format ---
jpackage \\
  --app-image LogPose.app \\
  --name LogPose \\
  --type dmg
# produces LogPose.dmg


# --- STAGE 6: notarization -- Apple's OWN, SEPARATE automated malware scan ---
xcrun notarytool submit LogPose.dmg \\
  --apple-id "developer@example.com" \\
  --team-id "TEAMID1234" \\
  --password "@keychain:AC_PASSWORD" \\
  --wait
# uploads LogPose.dmg to Apple's servers; --wait blocks until Apple's automated
# scan completes and returns a result -- either a clearance ticket, or a rejection
# report explaining specifically what Apple's scan flagged


# --- STAGE 7: staple the notarization ticket -- a permanent, offline-verifiable record ---
xcrun stapler staple LogPose.dmg
# from this point on, ANY user's Gatekeeper can verify LogPose.dmg was notarized
# without needing to re-contact Apple's servers at launch time -- the ticket
# is now permanently embedded in the distributed artifact itself`,
    notes: [
      'Stage 2\'s --add-modules list is deliberately minimal -- java.base,java.sql,java.net.http,javafx.controls,javafx.fxml, not an entire JDK\'s worth of modules -- directly matching this lesson\'s "only what the application actually needs" argument.',
      'Stage 4\'s codesign must run BEFORE stage 6\'s notarization submission -- Apple\'s notarization service requires an already-validly-signed artifact (with the hardened runtime enabled) as a precondition for submission at all.',
      'Stage 6\'s --wait flag is optional but genuinely useful in a CI pipeline specifically -- without it, the submission happens asynchronously and the pipeline would need a separate step to poll for and check the result before proceeding to stapling.',
      'Stage 7\'s stapling is what lets the FINAL distributed .dmg be verified entirely OFFLINE by any user\'s Gatekeeper -- without stapling, Gatekeeper would need to contact Apple\'s servers at every single launch to re-verify notarization status, a real reliability risk if a user is offline.'
    ]
  },
  lab: {
    title: 'Diagnose a broken packaging pipeline from its actual symptom',
    prompt: 'Given a packaging pipeline matching the code demo\'s seven stages, and FOUR reported symptoms below, write a Java-style comment block (as a single string constant, for automated checking) mapping each symptom to the SPECIFIC stage most likely responsible, following the pattern: <code>"Symptom: ... -> Stage: ..."</code> for each of the four. Symptoms: (1) "The app fails to launch on an older macOS version with a generic incompatibility error, unrelated to any security warning."; (2) "Gatekeeper shows a security warning even though the app was correctly code signed."; (3) "The distributed download is over 180MB despite the application itself being tiny."; (4) "A user\'s Gatekeeper check works correctly even while their machine is completely offline."',
    starter: `public class PipelineDiagnosis {
    public static final String DIAGNOSIS = """
        Symptom: The app fails to launch on an older macOS version with a generic incompatibility error, unrelated to any security warning. -> Stage: TODO
        Symptom: Gatekeeper shows a security warning even though the app was correctly code signed. -> Stage: TODO
        Symptom: The distributed download is over 180MB despite the application itself being tiny. -> Stage: TODO
        Symptom: A user's Gatekeeper check works correctly even while their machine is completely offline. -> Stage: TODO
        """;
}`,
    checks: [
      { re: 'incompatibility[^\\n]*->\\s*Stage:\\s*jpackage', must: true, hint: 'The older-macOS incompatibility symptom should be attributed to the jpackage stage (build/deployment target compatibility).', pass: 'incompatibility symptom -> jpackage ✓' },
      { re: 'Gatekeeper shows a security warning[^\\n]*->\\s*Stage:\\s*notariz', must: true, hint: 'The signed-but-still-warned symptom should be attributed to the notarization stage (missing or incomplete).', pass: 'signed-but-warned symptom -> notarization ✓' },
      { re: '180MB[^\\n]*->\\s*Stage:\\s*jlink', must: true, hint: 'The oversized-download symptom should be attributed to the jlink stage (not using a minimal module set, or skipping jlink entirely).', pass: 'oversized-download symptom -> jlink ✓' },
      { re: 'offline[^\\n]*->\\s*Stage:\\s*stapl', must: true, hint: 'The works-while-offline symptom should be attributed to the stapling stage.', pass: 'offline-verification symptom -> stapling ✓' }
    ],
    run: 'Compare each mapping against this lesson\'s seven-stage pipeline — each symptom should trace to exactly the stage whose SPECIFIC guarantee (module minimality, platform/version compatibility, Apple\'s independent scan, or offline-verifiable stapled record) is actually responsible for that symptom.',
    solution: `public class PipelineDiagnosis {
    public static final String DIAGNOSIS = """
        Symptom: The app fails to launch on an older macOS version with a generic incompatibility error, unrelated to any security warning. -> Stage: jpackage (deployment target / architecture compatibility, not a signing or notarization concern at all)
        Symptom: Gatekeeper shows a security warning even though the app was correctly code signed. -> Stage: notarization (missing or incomplete -- signing alone does not satisfy Gatekeeper's requirement for public distribution)
        Symptom: The distributed download is over 180MB despite the application itself being tiny. -> Stage: jlink (likely skipped, or --add-modules includes far more than the application actually needs, bundling something closer to a full JDK)
        Symptom: A user's Gatekeeper check works correctly even while their machine is completely offline. -> Stage: stapling (the notarization ticket is permanently embedded in the distributed artifact, requiring no live contact with Apple's servers at launch time)
        """;
}`,
    notes: [
      'The older-macOS symptom is deliberately described as "unrelated to any security warning" -- a direct textual cue that it is NOT a signing/notarization problem, matching this lesson\'s own tech-question reasoning about matching symptoms to the stage whose guarantee is actually relevant.',
      'The oversized-download symptom maps to jlink specifically, not jpackage -- jpackage wraps whatever runtime it\'s given; the runtime\'s own size is determined entirely by jlink\'s module selection (or the absence of jlink altogether, bundling a full JDK instead).',
      'The offline-verification symptom is the clearest possible signal for stapling specifically, since this lesson\'s concept section names stapling as exactly the mechanism that removes the need to contact Apple\'s servers at every subsequent launch.'
    ]
  },
  quiz: [
    {
      q: 'What does jlink produce, and why is it dramatically smaller than bundling a full JDK?',
      options: ['A custom runtime image containing ONLY the specific JDK/JavaFX modules the application actually declares it needs, omitting every other standard module a full JDK would include unconditionally', 'A compressed archive of the entire JDK, using better compression than a standard zip file', 'A minified version of the application\'s own source code, unrelated to which JDK modules are included', 'An empty placeholder runtime that downloads the actual JDK modules on first launch'],
      correct: 0,
      explain: 'jlink builds a runtime containing only the modules an application actually declares as dependencies (via module-info.java or automatic modules), dramatically smaller than a full JDK which includes every standard module regardless of whether a given application uses it.'
    },
    {
      q: 'What does jpackage do with a jlink-built runtime and a compiled JAR?',
      options: ['Wraps them into a genuine native application package for the target platform (a .app bundle and .dmg on macOS, an .exe/.msi on Windows) that a user can install and launch through their OS\'s normal, familiar mechanisms', 'Recompiles the JAR into native machine code, replacing the JVM runtime entirely', 'Uploads the JAR and runtime to a cloud service for remote execution', 'Merges multiple separate JAR files into a single, larger JAR file'],
      correct: 0,
      explain: 'jpackage wraps the JAR and its bundled runtime into a real, native platform package -- a .app/.dmg on macOS -- requiring no separate JDK installation and launchable through the OS\'s own normal application mechanisms.'
    },
    {
      q: 'What does a valid code signature on a Mac application actually prove, and what does it NOT prove?',
      options: ['It proves the app came from a specific, identifiable Developer ID and hasn\'t been tampered with since signing -- it does NOT prove the app is safe, well-behaved, or free of malicious intent', 'It proves the app has been reviewed and approved by Apple as safe to use', 'It proves the app contains no bugs of any kind', 'It proves the app will run correctly on every version of macOS'],
      correct: 0,
      explain: 'Signing establishes authenticity (a specific, accountable developer identity) and integrity (no tampering since signing) -- it says nothing about whether the app itself is actually safe or well-behaved, which a malicious developer with a valid certificate could still violate.'
    },
    {
      q: 'A Mac application is correctly code signed but is distributed outside the Mac App Store without being notarized. What happens when a user tries to open it?',
      options: ['Gatekeeper blocks the app from launching or shows a genuinely alarming security warning, despite the valid signature, because notarization is a separate, additional requirement signing alone does not satisfy', 'The app launches normally with no issues, since a valid signature is the only requirement Gatekeeper checks', 'The app launches but with reduced functionality until notarization is later completed', 'macOS automatically notarizes the app on the user\'s behalf the first time it is launched'],
      correct: 0,
      explain: 'Notarization is a separate requirement from signing -- Apple\'s own independent, automated malware scan of the submitted binary. A signed-but-not-notarized app distributed outside the App Store triggers a Gatekeeper block or warning regardless of the signature\'s validity.'
    },
    {
      q: 'Why is stapling (xcrun stapler staple) performed as the final step after notarization succeeds?',
      options: ['It permanently embeds the notarization ticket into the distributed artifact itself, letting any user\'s Gatekeeper verify notarization status entirely offline, without needing to contact Apple\'s servers at every launch', 'It compresses the final artifact to reduce its distributed file size', 'It applies the code signature for the first time, after notarization has already been granted', 'It is an optional, purely cosmetic step with no functional effect on Gatekeeper\'s behavior'],
      correct: 0,
      explain: 'Stapling attaches the notarization ticket directly to the distributed artifact, making the notarization status verifiable offline by any user\'s Gatekeeper, rather than requiring a live check against Apple\'s servers at every single launch.'
    }
  ],
  testFlow: {
    title: 'Test yourself: matching packaging symptoms to the right pipeline stage',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A team skips jlink entirely and bundles a full JDK with their jpackage-built app. What is the most direct, described consequence?',
        choices: [
          { text: 'A much larger distributable (potentially 150MB+ more) and a larger attack surface, since every standard JDK module is present and runnable regardless of whether the application actually uses it', to: 'q1_right' },
          { text: 'The application will fail to launch entirely, since jpackage requires a jlink-built runtime as a hard prerequisite', to: 'q1_wrong_fails' },
          { text: 'Code signing and notarization become unnecessary, since a full JDK is already trusted by Gatekeeper', to: 'q1_wrong_unneeded' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- skipping jlink means bundling every standard JDK module unconditionally, producing a much larger download and a larger attack surface, exactly this lesson\'s central jlink argument.', next: 'q2' },
      q1_wrong_fails: { end: true, correct: false, text: 'jpackage can work with a full JDK runtime instead of a jlink-built one -- it will still function, just with the size/attack-surface costs jlink specifically exists to avoid.', retry: 'q1' },
      q1_wrong_unneeded: { end: true, correct: false, text: 'Signing and notarization requirements are entirely independent of whether jlink was used -- Gatekeeper\'s requirements apply to any distributed Mac app regardless of how its runtime was assembled.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A developer signs their app with a valid Developer ID and reasons "since this proves I built it and nothing was tampered with, that should be sufficient for safe distribution." What is missing from this reasoning?',
        choices: [
          { text: 'Notarization -- a separate, additional requirement where Apple runs its own independent automated malware scan; signing alone does not satisfy this, and an unnotarized app triggers Gatekeeper warnings/blocks regardless of a valid signature', to: 'q2_right' },
          { text: 'Nothing is missing -- a valid Developer ID signature is the complete, sufficient requirement for Mac distribution', to: 'q2_wrong_sufficient' },
          { text: 'The app additionally needs to be submitted to and approved for the Mac App Store, even for direct-download distribution', to: 'q2_wrong_appstore' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- notarization is a genuinely separate, additional requirement from signing. Apple\'s own automated scan checks something signing alone cannot: whether the submitted binary itself trips any known malware/suspicious-behavior detectors.', next: 'q3' },
      q2_wrong_sufficient: { end: true, correct: false, text: 'This is exactly the misconception this lesson corrects -- a validly signed app distributed outside the App Store still requires separate notarization, or Gatekeeper blocks/warns regardless of the signature\'s validity.', retry: 'q2' },
      q2_wrong_appstore: { end: true, correct: false, text: 'Direct, outside-the-App-Store distribution (a downloadable .dmg) does not require Mac App Store approval at all -- it requires signing AND notarization specifically, which is a genuinely different (and less restrictive) path than App Store submission.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A user reports their Gatekeeper check succeeds even though their machine has no internet connection at the moment of launch. What specific pipeline stage explains this?',
        choices: [
          { text: 'Stapling -- the notarization ticket was permanently embedded in the distributed artifact, letting Gatekeeper verify it entirely offline without contacting Apple\'s servers', to: 'q3_right' },
          { text: 'jlink -- a minimal runtime inherently requires no network access for any operation, including Gatekeeper checks', to: 'q3_wrong_jlink' },
          { text: 'This indicates a bug -- Gatekeeper should always require an active internet connection to verify any application', to: 'q3_wrong_bug' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- stapling is specifically designed to make notarization status verifiable offline, embedding the clearance ticket directly into the distributed artifact rather than requiring a live check against Apple\'s servers at every launch.', next: null },
      q3_wrong_jlink: { end: true, correct: false, text: 'jlink\'s minimal runtime is unrelated to Gatekeeper\'s verification mechanism entirely -- jlink addresses runtime size/module selection, not signing or notarization verification at all.', retry: 'q3' },
      q3_wrong_bug: { end: true, correct: false, text: 'This is expected, correct behavior specifically because of stapling -- Apple deliberately designed the stapling mechanism to allow offline verification, precisely to avoid requiring users to be online at every single app launch.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Bundling a full JDK instead of using jlink to build a minimal, application-specific runtime -- adds significant unnecessary download size and a larger, avoidable security attack surface.',
    'Treating code signing as sufficient on its own for public Mac distribution -- a signed-but-not-notarized app triggers Gatekeeper warnings or blocks regardless of the signature\'s validity.',
    'Attempting notarization submission on an app that wasn\'t signed with the hardened runtime enabled (--options runtime) -- Apple\'s notarization service requires this as a precondition and will reject the submission otherwise.',
    'Forgetting to staple the notarization ticket after a successful notarization -- the app IS notarized, but a user\'s Gatekeeper would need to contact Apple\'s servers to verify this at every launch, a real reliability risk if the user is offline.',
    'Assuming jlink works identically for any codebase regardless of whether it\'s modularized -- an application without module-info.java declarations relies on jlink\'s weaker "automatic module" support, providing less precise minimality than genuine module declarations.',
    'Diagnosing every Mac packaging/launch failure as a signing or notarization problem by default -- a generic incompatibility error (wrong macOS version target, wrong CPU architecture) points to an earlier pipeline stage (jpackage\'s build configuration) entirely, not signing or notarization at all.'
  ],
  interview: [
    {
      q: 'A team building a cross-platform desktop app (Windows, macOS, and Linux) asks whether jlink and jpackage need to be run once, or separately per target platform. Answer precisely, and explain the underlying reason.',
      a: 'jlink and jpackage must both be run SEPARATELY, once per TARGET platform, and the underlying reason is precise and worth stating clearly: both tools produce a NATIVE artifact specific to the platform they run ON — jlink builds a runtime image containing platform-specific native launcher binaries and platform-specific JDK module implementations (the actual native code underlying java.base and similar modules genuinely differs between Windows, macOS, and Linux, even though the JAVA-LEVEL API surface those modules expose is identical across all three, which is exactly what lets the SAME application-level Java code run unmodified everywhere) — and jpackage similarly produces a genuinely platform-specific package format (a .app/.dmg specifically for macOS, an .exe/.msi specifically for Windows, a .deb/.rpm specifically for Linux), none of which are interchangeable or usable on a different target OS at all. In practice, this means a real CI pipeline building for all three platforms needs either three SEPARATE build environments (a macOS build machine/VM producing the .app/.dmg, a Windows machine producing the .exe/.msi, a Linux machine producing the .deb/.rpm) or a cross-compilation setup specifically capable of producing platform-specific artifacts from a single build host (a genuinely more advanced, less commonly used setup for jlink/jpackage specifically, given how tightly the produced artifacts are coupled to actual platform-native mechanisms) — three separate build-and-package invocations, using the SAME underlying compiled Java application code (compiled once, genuinely platform-independent at the bytecode level, exactly this course\'s "write once" theme since Part 0), but three DIFFERENT jlink/jpackage invocations, each producing a genuinely native artifact for its own specific target.'
    },
    {
      q: 'Design (in words) how a CI pipeline should handle a notarization SUBMISSION that Apple actually REJECTS (rather than approves), including what information should be surfaced to the development team and what the likely next steps would be.',
      a: 'Apple\'s notarytool submission, when rejected, returns a SPECIFIC report (retrievable via a separate xcrun notarytool log command referencing the submission\'s ID) detailing exactly WHAT Apple\'s automated scan flagged — commonly things like unsigned or improperly-signed embedded libraries/frameworks bundled inside the app (a common, real gotcha: notarization requires EVERY executable component INSIDE the bundle, including any bundled native libraries a JavaFX application might include, to ALSO be properly signed, not merely the top-level .app itself), disallowed API usage patterns Apple\'s scanner specifically checks for, or (rarely, but not impossible) a genuine false-positive flagging something legitimate as suspicious. A well-designed CI pipeline should: (1) treat a notarization REJECTION as a hard pipeline failure, never silently proceeding to stapling/distribution with an app Apple\'s own scan explicitly declined to clear — exactly the "loud failure over silent, dangerous success" discipline this course has argued for repeatedly (sql-postgresql\'s CHECK constraints, jdbc-transactions\' PreparedStatement, spring-core-di\'s NoUniqueBeanDefinitionException); (2) automatically fetch and surface Apple\'s SPECIFIC rejection log/reason directly in the CI failure output, rather than merely reporting "notarization failed" with no further detail — the specific reason (an unsigned embedded library, say) is what actually lets a developer fix the real problem quickly, versus a bare pass/fail signal forcing manual investigation from scratch; (3) for the SPECIFIC, common "unsigned embedded component" cause, ensure the earlier signing stage (this lesson\'s stage 4) uses codesign\'s --deep flag (as shown in the code demo) SPECIFICALLY to recursively sign every nested executable component inside the bundle, not just the top-level .app — often the actual, correct fix for this specific, common rejection reason; (4) treat a genuine notarization rejection as a signal worth investigating THOROUGHLY rather than simply re-submitting the identical artifact hoping for a different result — Apple\'s scan is deterministic for the SAME submitted content, so an identical resubmission without an actual fix would predictably fail identically again.'
    },
    {
      q: 'Compare this lesson\'s Mac-specific signing/notarization pipeline with gluon-mobile-graalvm\'s iOS App Store submission process. Are these the same underlying mechanism applied to two platforms, or genuinely different processes? Explain precisely.',
      a: 'These are related in SPIRIT (both are Apple-specific mechanisms for establishing trust and safety before an application reaches a real user\'s device) but are GENUINELY DIFFERENT PROCESSES with meaningfully different mechanics, and conflating them would be a real mistake worth correcting precisely. Mac distribution OUTSIDE the App Store (this lesson\'s own focus, matching a downloadable .dmg from a developer\'s own website) uses signing PLUS a separate, DEVELOPER-INITIATED notarization submission specifically because Apple allows this "sideloading"-adjacent distribution model for Mac software at all — a developer can, in principle, distribute Mac software without EVER going through Apple\'s App Store review process, PROVIDED they still satisfy the signing+notarization requirement this lesson builds around. iOS, by contrast (gluon-mobile-graalvm\'s own focus), has HISTORICALLY had a much more restrictive distribution model for ordinary end users — genuine, real-world iOS App Store distribution requires going through APPLE\'S OWN, human-involved APP REVIEW PROCESS (a genuinely different, more involved gate than the largely-automated Mac notarization scan this lesson describes), checking not just for malware-pattern red flags the way notarization does, but against Apple\'s own substantive App Store Review Guidelines covering content policy, UI/UX conventions, in-app purchase requirements, and considerably more — a HUMAN reviewer (or a review process with substantial human involvement) actually examines a submitted iOS app\'s actual behavior and content in ways considerably more involved than Mac notarization\'s largely-automated malware scan. The precise, correct comparison: Mac\'s signing+notarization is a NECESSARY but comparatively LIGHTER-WEIGHT gate (automated, focused specifically on malware/tampering, allowing distribution entirely outside Apple\'s own store); iOS App Store submission is a HEAVIER, more involved gate (substantial human review, broader content/behavior policy enforcement, and, notably, essentially the ONLY realistic path for reaching ordinary iOS users at all, unlike Mac\'s genuine outside-the-App-Store option) — related Apple trust-and-safety mechanisms, applied with genuinely different scope and process depth to two platforms Apple treats with meaningfully different distribution philosophies.'
    },
    {
      q: 'A team\'s LogPose desktop client works flawlessly for every internal team member testing on their own development machines, but multiple real customers report the app "won\'t open" with no further detail, immediately after downloading the officially-distributed .dmg. Diagnose the most likely category of problem, given this scenario\'s specific detail that internal team members never see the issue.',
      a: 'The specific detail that internal team members NEVER see this issue while ACTUAL CUSTOMERS downloading the OFFICIALLY-DISTRIBUTED artifact consistently do is the single most important diagnostic clue here, and it points directly at this lesson\'s signing/notarization material rather than at a genuine application bug. Internal team members, developing and testing locally, are almost certainly running the application DIRECTLY from their own build output (an IDE\'s "run" command, a locally-built .app not yet through the FULL signing+notarization pipeline, or a machine where Gatekeeper\'s checks are configured more permissively for a known developer\'s own local builds) — none of which exercises the SAME Gatekeeper gauntlet a genuinely FRESH DOWNLOAD from an external customer\'s machine, with default macOS security settings, actually goes through. Real customers downloading the OFFICIAL, publicly-distributed .dmg are the ONLY ones actually subject to Gatekeeper\'s full signing+notarization verification exactly as a genuinely new, externally-downloaded application experiences it — a vague "won\'t open" report with "no further detail" is EXACTLY the symptom this lesson\'s notarization section describes: Gatekeeper, for an unnotarized (or improperly notarized/stapled) app, either silently refuses to launch it at all or shows a security dialog many non-technical users might dismiss/screenshot vaguely as simply "it won\'t open" without correctly reporting the SPECIFIC Gatekeeper warning text back to the development team. The most likely root cause: the officially-distributed .dmg was signed but NOT successfully notarized (or notarized but NOT correctly stapled, meaning users with certain network conditions at launch time might fail Gatekeeper\'s online re-verification attempt) — the fix is verifying the ACTUAL distributed artifact (not a local development build) has genuinely completed BOTH signing AND notarization AND stapling correctly, likely by re-running the full pipeline\'s verification steps (codesign --verify, and Apple\'s own spctl --assess --verbose tool, which specifically reports Gatekeeper\'s own assessment of a given artifact) directly against the EXACT file customers are actually downloading, rather than assuming a successful LOCAL development build implies the same about the separately-built, separately-distributed release artifact.'
    }
  ]
};
