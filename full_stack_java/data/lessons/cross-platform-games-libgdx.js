window.LESSONS = window.LESSONS || {};
window.LESSONS['cross-platform-games-libgdx'] = {
  id: 'cross-platform-games-libgdx',
  title: 'Game Programming II: libGDX — One Codebase for Desktop, Web & Mobile Games',
  category: 'Part 11 — Desktop & Games',
  timeMin: 55,
  summary: 'game-loop-desktop-game built Berry Catcher directly against JavaFX Canvas — real, working, but locked to desktop, since JavaFX itself only targets desktop JVMs. libGDX solves exactly the problem that lesson\'s own closing question raised: it abstracts over platform-specific rendering/input backends (desktop, web via GWT, Android, iOS) so the SAME core game logic — literally the same update() method, nearly line for line — runs everywhere, with only a thin, platform-specific LAUNCHER module differing per target, structured as a genuine multi-module build directly parallel to maven-multi-module\'s parent/child pattern. This lesson ports Berry Catcher to libGDX: ApplicationAdapter\'s lifecycle, SpriteBatch\'s batched texture drawing, Viewport-based resolution independence, and POLLED input — a genuinely different input model from JavaFX\'s event listeners, worth understanding precisely.',
  goals: [
    'Explain why JavaFX/Canvas cannot target web or mobile platforms, and what libGDX abstracts over to make one codebase run on desktop, web, and mobile',
    'Structure a libGDX project as a multi-module build (a platform-independent core module plus per-platform launcher modules), connecting directly to maven-multi-module\'s parent/child pattern',
    'Use ApplicationAdapter\'s create()/render()/resize()/dispose() lifecycle, and explain why Texture and SpriteBatch require explicit dispose() rather than relying on garbage collection',
    'Use SpriteBatch to draw textures efficiently, and explain why batching draw calls between begin()/end() matters for performance',
    'Explain the difference between JavaFX\'s event-driven input listeners and libGDX\'s polled input model (Gdx.input.isKeyPressed(...), checked every frame inside render())'
  ],
  concept: [
    {
      h: 'Why JavaFX/Canvas can\'t go cross-platform, and what libGDX abstracts over',
      p: [
        'game-loop-desktop-game\'s Berry Catcher is genuine, working code — but it is PERMANENTLY locked to desktop, because JavaFX itself only runs on a desktop JVM; there is no JavaFX runtime for a web browser or a mobile device\'s native app environment at all (Gluon, arriving next lesson, extends JavaFX specifically toward mobile, but that\'s a separate, additional technology, not something Canvas/AnimationTimer alone provide). libGDX solves a genuinely different problem: it is a game framework built around a BACKEND ABSTRACTION — the actual GAME CODE is written ONCE, against libGDX\'s own APIs (<code>SpriteBatch</code>, <code>Gdx.input</code>, <code>ApplicationAdapter</code>), and a separate, swappable BACKEND implementation translates those calls into whatever the TARGET PLATFORM actually needs underneath: LWJGL for desktop (OpenGL, essentially what JavaFX itself ultimately sits on), a GWT-based backend compiling to JavaScript/WebGL for web browsers, and native Android/iOS backends for mobile — the SAME core game code, unmodified, runs against ANY of these backends.',
        'This is architecturally, and deliberately, a real multi-module build — directly parallel to maven-multi-module\'s parent/child pattern: a genuine libGDX project has a <code>core</code> module containing ALL the actual game logic (everything this lesson\'s code demo shows), with NO platform-specific code in it at all, and separate, thin <code>desktop</code>/<code>html</code>/<code>android</code> LAUNCHER modules, each depending on <code>core</code> and supplying ONLY the few lines of platform-specific bootstrapping needed to actually start that platform\'s backend and hand control to the shared core code — exactly the "one shared module, several thin launcher modules depending on it" shape maven-multi-module built for logpose-core/logpose-search, now applied to targeting genuinely different platforms rather than genuinely different Maven artifacts.'
      ]
    },
    {
      h: 'ApplicationAdapter: the same lifecycle pattern, cross-platform',
      p: [
        'libGDX\'s <code>ApplicationAdapter</code> (a convenience base class implementing the <code>ApplicationListener</code> interface) provides the SAME conceptual lifecycle javafx-desktop\'s <code>Application</code> class did, expressed platform-independently: <code>create()</code> runs ONCE, when the backend has finished initializing — the right place to load textures and construct long-lived objects (directly analogous to <code>Application.start(Stage)</code>). <code>render()</code> is called ONCE PER FRAME, automatically, by whichever backend is currently running the game — this IS the game loop from the previous lesson, just supplied by the framework instead of built by hand against AnimationTimer; the SAME update-then-render pattern applies, just inside one single method now rather than split across handle() and a separate render helper. <code>resize(int width, int height)</code> is called whenever the window (or, on mobile, the device orientation) changes size — genuinely important for a cross-platform game, since a desktop window can be resized freely and a phone can rotate, neither of which JavaFX-desktop\'s fixed-size Canvas needed to handle at all.',
        '<code>dispose()</code> is called once, when the application is shutting down — and this is where a genuinely important, easy-to-miss resource-management discipline applies, directly connecting back to the exceptions lesson\'s try-with-resources material: a <code>Texture</code> and a <code>SpriteBatch</code> hold NATIVE GPU RESOURCES (video memory, GPU handles) that live OUTSIDE the JVM heap entirely — Java\'s garbage collector has NO knowledge of GPU memory at all and cannot reclaim it automatically, no matter how thoroughly a Texture object itself becomes unreachable from Java code. Every Texture, SpriteBatch, and similar libGDX resource MUST be explicitly disposed via its own <code>.dispose()</code> method inside <code>dispose()</code> — failing to do so leaks real GPU memory for the entire lifetime of the running application, exactly the same category of leak forgetting to close a file handle or a database connection causes, just for a resource the JVM\'s own memory management has no visibility into whatsoever.'
      ]
    },
    {
      h: 'SpriteBatch: efficient, batched texture drawing',
      p: [
        'game-loop-desktop-game drew simple filled shapes directly via GraphicsContext, one call at a time. libGDX games typically draw TEXTURES (loaded images) via <code>SpriteBatch</code>, and its <code>begin()</code>/<code>draw(...)</code>/<code>end()</code> pattern exists specifically for a real performance reason worth understanding precisely: every individual "draw this to the GPU" instruction has real overhead — switching which texture the GPU is currently using, or issuing a separate draw command for every single sprite, is genuinely expensive at the scale of potentially hundreds of on-screen game objects, 60 times per second. <code>batch.begin()</code> starts accumulating draw REQUESTS rather than immediately executing each one; multiple <code>batch.draw(texture, x, y, width, height)</code> calls using the SAME texture get automatically BATCHED together into far fewer actual GPU operations, and <code>batch.end()</code> flushes everything accumulated since <code>begin()</code> in one efficient pass — this is precisely the same "batch operations together rather than doing them one at a time" instinct behind jdbc-transactions\' connection pooling and integration-testing\'s Testcontainers reuse, now applied at the GPU-draw-call level specifically.',
        'Texture loading (<code>new Texture("berry.png")</code>, loading an image file into GPU memory) is itself a genuinely expensive operation, appropriate to do ONCE, inside <code>create()</code> — never repeatedly inside <code>render()</code>, which would reload the same image from disk into GPU memory 60 times every second for absolutely no benefit, an easy and genuinely costly mistake for someone unfamiliar with this distinction. The general pattern this lesson\'s code demo follows: load every texture ONCE in create(), draw them (potentially many times, cheaply, via the already-loaded Texture object) every frame inside render()\'s batch.begin()/end() block, and dispose of them ONCE in dispose() — three genuinely distinct lifecycle phases, each with its own, different appropriate frequency.'
      ]
    },
    {
      h: 'Viewport and camera: resolution independence across wildly different screens',
      p: [
        'game-loop-desktop-game\'s Berry Catcher used raw pixel coordinates directly (a 600×600 fixed-size Canvas) — perfectly fine for one, known, fixed-size desktop window, but genuinely broken the moment the SAME game needs to run correctly on a resized desktop window, a web browser tab of arbitrary size, or a phone screen with a completely different resolution and aspect ratio than 600×600. libGDX\'s <code>Viewport</code> (commonly <code>FitViewport</code>, maintaining the game\'s intended aspect ratio while scaling to fit whatever screen space is actually available, letterboxing if needed) combined with an <code>OrthographicCamera</code> solves this: game logic and rendering CODE continues to work in the SAME fixed, virtual coordinate system (this lesson\'s code demo keeps using a 600×600 virtual game world, exactly matching the previous lesson\'s coordinates) — the Viewport handles the ACTUAL, real-world translation between those virtual game-world coordinates and whatever the real screen\'s actual pixel dimensions happen to be, automatically, updated inside <code>resize(...)</code> whenever the real window/screen size changes.',
        'This is a genuinely important architectural separation worth naming precisely: game LOGIC (where is the player, where are the falling items, did a collision happen) is expressed and computed ENTIRELY in the fixed VIRTUAL coordinate system, with NO awareness of the real screen\'s actual size at all — only the Viewport/camera layer, at the very final RENDERING step, needs to know or care about the real, current screen dimensions, translating virtual coordinates to real ones at the last possible moment. This separation is precisely why the SAME update() logic this lesson reuses nearly unchanged from the previous one continues to work correctly regardless of what actual screen it eventually runs on — the game\'s own logic was never coupled to real screen pixels in the first place, only to its own internal, fixed virtual coordinate space.'
      ]
    },
    {
      h: 'Polled input: checking state every frame, not waiting for an event',
      p: [
        'javafx-desktop and game-loop-desktop-game both used EVENT-DRIVEN input: <code>scene.setOnKeyPressed(handler)</code> registers a CALLBACK that JavaFX invokes WHEN a key event actually occurs, asynchronously, whenever that happens to be. libGDX takes a genuinely different, POLLING-based approach instead: <code>Gdx.input.isKeyPressed(Input.Keys.LEFT)</code> is called DIRECTLY, inside <code>render()</code>, EVERY single frame, and simply returns the CURRENT true/false state of that key AT THIS EXACT MOMENT — there is no callback registered anywhere, no event handler at all; the game loop itself actively ASKS, every frame, "is this key currently held down right now?" rather than waiting to be told a key event happened.',
        'This maps naturally onto the exact SAME "read a flag inside the update step" pattern game-loop-desktop-game already used — except libGDX removes even the manual "set a boolean flag in an event handler" step entirely, since <code>Gdx.input.isKeyPressed(...)</code> already IS that current-state check, provided directly by the framework with no event-listener boilerplate needed at all. <code>Gdx.graphics.getDeltaTime()</code> similarly hands you the previous lesson\'s entire manual nanosecond-timestamp-subtraction calculation, done for you, returned directly as a float representing the elapsed seconds since the last frame — libGDX, as a purpose-built game framework, automates precisely the two pieces of bookkeeping (delta time, current input state) game-loop-desktop-game had to build by hand directly against general-purpose JavaFX APIs never specifically designed for games in the first place, while the actual GAME LOGIC these pieces feed into — move the player if a direction is held, advance every falling item by fallSpeed times delta time, check squared-distance collisions — remains, deliberately, nearly identical code.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s traveling invention show: one core mechanism, a different adapter kit per island, and a backdrop that always fits the stage',
      text: 'Franky\'s traveling invention show tours a different island every stop, and he built it around one deliberate principle: the CORE MECHANISM — the actual working device, all its internal gears and logic — is built EXACTLY ONCE, and NEVER changes from island to island. What DOES change, per island, is a small, separate ADAPTER KIT — since different islands\' docks and power hookups use genuinely different physical fittings, Franky built a handful of thin, swappable adapters, each one translating the SAME core mechanism\'s connections into whatever THAT specific island\'s dock actually expects — never touching the mechanism itself, only the thin translation layer around it (a libGDX core module, plus per-platform launcher modules). Some of the show\'s components use genuinely expensive, physical raw materials — cannon powder, rare gears — and Franky is absolute about one rule: every single one gets explicitly ACCOUNTED FOR and RETURNED after the show ends, never just left lying around assuming it\'ll sort itself out eventually (Texture/SpriteBatch disposal — native GPU resources the garbage collector has no visibility into at all). The show\'s backdrop screen is specially rigged so it automatically SCALES to fit whatever size stage each island happens to provide — performed identically, proportioned correctly, whether the venue is a tiny village square or a massive island\'s grand hall, with the ACTUAL PERFORMANCE choreography never needing to know or care what the real stage size happens to be (Viewport/camera: game logic stays in a fixed virtual space, only the final rendering step translates to the real screen). And rather than waiting for a crew member to shout out every single lever pull as it happens, Franky\'s device instead simply CHECKS, every single beat of the performance, exactly what\'s currently being held down or pressed at that exact moment — polling the current state directly rather than waiting to be told about a past event (libGDX\'s polled input model, versus an event-driven callback). And the device\'s own internal mechanism tells Franky directly, automatically, exactly how much real time has passed since the last beat — he never has to work it out by hand from raw timestamps himself (Gdx.graphics.getDeltaTime(), automating the previous lesson\'s manual nanosecond math).',
    },
    sitcom: {
      show: 'Friends',
      title: 'The gang\'s touring skit: one core script, a different setup kit per venue, and a backdrop that always fits the stage',
      text: 'When the gang puts together a skit that ends up performed at several different venues — a tiny apartment party, a bigger community hall, eventually a real small theater — they build it around one deliberate principle: the CORE SCRIPT — the actual jokes, the blocking, the timing — is written EXACTLY ONCE, and never changes from venue to venue. What DOES change, per venue, is a small, separate SETUP KIT — since different venues have genuinely different outlets, stage sizes, and sound setups, they assemble a handful of thin, swappable setup kits, each one adapting the SAME core script\'s needs to whatever THAT specific venue actually has available, never touching the script itself, only the thin logistics layer around it (a core module, plus per-venue/per-platform launcher setups). Some of the props are genuinely expensive rentals — a fog machine, borrowed lighting rigs — and the group is strict about one rule: every single one gets explicitly RETURNED after the show ends, never just left behind assuming someone else will deal with it eventually (Texture/SpriteBatch disposal — resources outside normal cleanup that must be explicitly returned). The show\'s backdrop banner is specially designed so it automatically SCALES to fit whatever size stage each venue happens to have, performed identically and correctly proportioned whether the space is tiny or genuinely large, with the ACTUAL PERFORMANCE never needing to know or care what the real stage size happens to be (Viewport/camera: logic stays in a fixed virtual space, only rendering translates to the real screen). And rather than someone shouting out every single cue as it happens, the performers instead simply CHECK, every single beat of the scene, exactly what prop is currently in their hand or what mark they\'re currently standing on — polling the current state directly rather than waiting to be told about a past cue (libGDX\'s polled input model, versus an event-driven callback). And the stage manager\'s own stopwatch tells everyone directly, automatically, exactly how much real time has passed since the last beat — nobody has to work it out by hand from raw timestamps themselves (Gdx.graphics.getDeltaTime(), automating the previous lesson\'s manual math).',
    },
    why: 'Franky\'s / the gang\'s single, unchanging core mechanism/script, with only a thin, swappable adapter/setup kit differing per island/venue, is libGDX\'s core-module-plus-platform-launchers structure. The strict rule about returning expensive materials/props rather than leaving them behind is Texture/SpriteBatch\'s explicit dispose() requirement for native GPU resources. The auto-scaling backdrop, with the actual performance never needing to know the real stage size, is Viewport/camera-based resolution independence. And checking, every beat, what\'s CURRENTLY being held or where someone\'s CURRENTLY standing, rather than waiting for an announcement, is libGDX\'s polled input model — with the stopwatch telling everyone the elapsed time directly being Gdx.graphics.getDeltaTime(), automating what the previous lesson computed by hand.'
  },
  storyAnim: {
    title: 'One core mechanism, a thin adapter per island, expensive materials returned, and a backdrop that always fits',
    h: 340,
    props: [
      { id: 'core', emoji: '⚙️', label: 'ONE core mechanism, built exactly once (the libGDX core module)', x: 6, y: 8 },
      { id: 'adapter', emoji: '🔌', label: 'a thin, swappable adapter kit PER island (per-platform launcher module)', x: 30, y: 8 },
      { id: 'materials', emoji: '💥', label: 'expensive raw materials explicitly RETURNED after the show (Texture/SpriteBatch dispose())', x: 54, y: 8 },
      { id: 'backdrop', emoji: '🖼️', label: 'a backdrop that auto-scales to fit any stage size (Viewport/camera)', x: 78, y: 8 },
      { id: 'polling', emoji: '👀', label: 'checking what\'s CURRENTLY held every beat, not waiting for an announcement (polled input)', x: 30, y: 50 },
      { id: 'stopwatch', emoji: '⏱️', label: 'the stopwatch tells everyone elapsed time directly (Gdx.graphics.getDeltaTime())', x: 60, y: 50 }
    ],
    actors: [
      { id: 'franky', emoji: '🛠️', label: 'Franky', x: 20, y: 78 },
      { id: 'crew', emoji: '⚓', label: 'stagehands', x: 65, y: 78 }
    ],
    steps: [
      { c: 'Franky builds ONE core mechanism -- it never changes, no matter which island the show tours to.', p: { core: 'lit' }, a: { franky: [20, 30] } },
      { c: 'Only a thin, swappable adapter kit changes per island, translating the same mechanism to each dock\'s specific fittings.', p: { adapter: 'lit' } },
      { c: 'Expensive raw materials are explicitly accounted for and returned after every show -- never just left lying around.', p: { materials: 'good' } },
      { c: 'The backdrop automatically scales to fit whatever stage size each island provides.', p: { backdrop: 'good' } },
      { c: 'Rather than waiting for an announcement, the device checks every beat exactly what\'s currently being held.', p: { polling: 'lit' }, a: { crew: [30, 60] } },
      { c: 'The internal mechanism tells Franky directly how much real time has passed since the last beat.', p: { stopwatch: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'From the cross-platform problem to ApplicationAdapter, SpriteBatch, Viewport, and polled input',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'Cross-platform structure',
        nodes: [
          { id: 'backendabstraction', text: 'one core module, swappable\nplatform-specific backends' },
          { id: 'multimodule', text: 'core + desktop/html/android\nlauncher modules (maven-multi-module\'s pattern)' }
        ]
      },
      {
        label: 'Lifecycle',
        nodes: [
          { id: 'lifecycle', text: 'create()/render()/resize()/dispose()\n-- same shape as Application' },
          { id: 'disposal', text: 'Texture/SpriteBatch: native GPU\nresources, must be disposed explicitly' }
        ]
      },
      {
        label: 'Rendering',
        nodes: [
          { id: 'spritebatch', text: 'SpriteBatch begin/draw/end:\nbatches draw calls for performance' },
          { id: 'viewport', text: 'Viewport/camera: fixed virtual\ncoordinates, scaled to any real screen' }
        ]
      },
      {
        label: 'Input & timing',
        nodes: [
          { id: 'polledinput', text: 'Gdx.input.isKeyPressed():\nchecked every frame, no listeners' },
          { id: 'deltatime', text: 'Gdx.graphics.getDeltaTime():\nautomates the manual nanosecond math' }
        ]
      }
    ],
    steps: [
      { active: ['backendabstraction'], note: 'libGDX abstracts platform-specific rendering/input behind its own API, with swappable backends for desktop, web, and mobile.' },
      { active: ['multimodule'], note: 'A real libGDX project is a multi-module build: one platform-independent core module, plus thin per-platform launcher modules -- directly parallel to maven-multi-module.' },
      { active: ['lifecycle'], note: 'ApplicationAdapter provides the same conceptual lifecycle as JavaFX\'s Application, expressed platform-independently.' },
      { active: ['disposal'], note: 'Textures and SpriteBatch hold native GPU memory the JVM garbage collector cannot see or reclaim -- explicit dispose() is required.' },
      { active: ['spritebatch'], note: 'SpriteBatch batches multiple draw calls using the same texture into far fewer actual GPU operations, avoiding per-call overhead.' },
      { active: ['viewport'], note: 'Game logic operates in a fixed virtual coordinate space; the Viewport translates it to whatever the real screen size actually is, only at render time.' },
      { active: ['polledinput'], note: 'Instead of registering event listeners, libGDX checks current input state directly, every single frame, inside render().' },
      { active: ['deltatime'], note: 'Gdx.graphics.getDeltaTime() provides the elapsed time since the last frame directly, automating the manual timestamp math from game-loop-desktop-game.' }
    ]
  },
  tech: [
    {
      q: 'Explain precisely why a real libGDX project structures its game logic as a "core" module separate from "desktop"/"html"/"android" launcher modules, tracing the reasoning to maven-multi-module\'s own parent/child argument.',
      a: 'The reasoning is structurally identical to maven-multi-module\'s core argument, applied to a different axis of variation: that lesson split logpose-core and logpose-search into separate modules specifically so each could be built, versioned, and depended upon independently, without duplicating shared code across them. A libGDX project\'s core module contains ALL the genuinely platform-independent game logic (Player, FallingItem, the update() method, collision detection — everything this lesson\'s and the previous lesson\'s code demonstrate) with ZERO reference to any platform-specific backend class at all; this module compiles and is meaningful entirely on its own, exactly the way logpose-core had no dependency on logpose-search. Each of desktop/html/android is a SEPARATE, genuinely thin module containing ONLY the few lines needed to initialize that SPECIFIC platform\'s backend (LWJGL for desktop, GWT for web, the Android SDK\'s own application lifecycle for mobile) and hand control over to the shared core module\'s ApplicationAdapter — each launcher module DEPENDS ON core (exactly the dependency direction logpose-search depended on logpose-core), never the reverse, and none of the three launcher modules depends on either of the OTHER two at all, since a desktop launcher has no reason to reference anything Android-specific. This structure gives the exact same benefit maven-multi-module argued for generally: the shared, valuable logic (core) can be built, tested, and reasoned about entirely independently of any specific platform, and adding support for a BRAND NEW platform in the future (say, a hypothetical future console backend) means writing ONE NEW, thin launcher module depending on the EXISTING, unchanged core — never touching or duplicating the actual game logic at all.'
    },
    {
      q: 'A developer writes `Texture berryTexture = new Texture("berry.png");` inside render() instead of create(), reasoning "it needs to be available whenever the game draws a berry, so loading it right before drawing seems safest." Evaluate this reasoning and its concrete performance consequence.',
      a: 'This reasoning confuses "available when needed" with "loaded fresh every single time it\'s used," and the concrete consequence is severe: render() is called roughly 60 times EVERY SECOND — placing new Texture("berry.png") inside it means the image file is read from DISK and uploaded into GPU MEMORY sixty times per second, for the ENTIRE duration the game runs, even though the actual image data never changes between those sixty loads at all. Texture loading is a genuinely EXPENSIVE operation (disk I/O, image decoding, a GPU memory upload) — appropriate to do exactly ONCE, since the resulting Texture object, once loaded, can be drawn as many times as needed via cheap batch.draw(...) calls referencing the ALREADY-LOADED texture, with zero need to reload the underlying image data for each individual draw. The concrete, measurable consequence of this specific mistake: severe, unnecessary performance degradation (disk I/O and GPU uploads happening 60 times per second where ONE load would suffice for the entire application\'s lifetime), likely dropping the actual achieved frame rate well below the target 60 FPS, especially as more textures accumulate this same mistake — and, separately, a genuine RESOURCE LEAK, since each new Texture(...) call allocates a NEW GPU-memory-backed object that is NEVER disposed (dispose() is meant to be called once, in the dispose() lifecycle method, matching each texture\'s single load in create()) — creating sixty new, never-disposed Texture objects every second would exhaust available GPU memory extremely quickly, likely crashing the application outright within seconds of running. The fix is exactly this lesson\'s pattern: load every texture ONCE, in create(), store the resulting Texture object as a field, and reference that SAME already-loaded object every time render() needs to draw it.'
    },
    {
      q: 'Explain precisely why libGDX\'s Gdx.input.isKeyPressed(...) polling model, called directly inside render(), does not need a separate boolean flag (like game-loop-desktop-game\'s movingLeft/movingRight) set by a registered event listener.',
      a: 'game-loop-desktop-game needed a separate movingLeft boolean flag specifically because JavaFX\'s input model is fundamentally EVENT-DRIVEN — a key-press EVENT fires the registered listener asynchronously, at whatever moment the key is actually pressed, entirely independent of the game loop\'s own timing; since the game loop\'s update() step runs on its OWN separate schedule (once per AnimationTimer.handle() call) and needs to know, AT THAT MOMENT, whether a direction is CURRENTLY being held, a boolean flag was the necessary bridge between "an asynchronous event happened at some point" and "what is the CURRENT state, right now, as the update step executes." Gdx.input.isKeyPressed(...) works completely differently at the API level: it doesn\'t rely on any previously-fired event at all — it QUERIES the underlying input system\'s CURRENT state DIRECTLY, at the exact moment it\'s called, returning true or false based on whether that specific key is ACTUALLY held down RIGHT NOW, this instant — there is no listener, no callback, no asynchronous event delivery involved anywhere in this specific mechanism at all. Calling it directly inside render() (or a helper it calls) gets the CURRENT true/false state immediately, with no intermediate flag needed to bridge "an event happened earlier" and "what\'s true right now," precisely because isKeyPressed() already IS a direct, synchronous query of the current state — the flag pattern game-loop-desktop-game needed exists specifically to solve a problem (bridging asynchronous events to a polling loop) that simply doesn\'t arise at all when the underlying input API itself is already poll-based rather than event-based.'
    },
    {
      q: 'A game\'s update() logic uses raw pixel coordinates (e.g. "the player is caught if x > 300") without any Viewport/camera abstraction, and works correctly on a 600x600 desktop window. Explain precisely what breaks when this same code is deployed to a phone with a 1080x2400 screen, and how Viewport/camera fixes it without requiring update() itself to change.',
      a: 'Hardcoding raw pixel values like "x > 300" implicitly assumes the game world IS exactly as wide as the specific screen this code happened to be tested on (600 pixels, in this case, making 300 meaningfully "the horizontal center") — deployed to a 1080-pixel-wide phone screen with NO Viewport abstraction, that SAME literal value 300 is no longer anywhere near the horizontal center of the ACTUAL screen at all (it\'s now roughly 28% of the way across a 1080-pixel-wide screen, not 50%), silently breaking the game\'s actual intended behavior — collision boundaries, spawn positions, and anything else expressed as a raw pixel number would all be subtly or badly wrong relative to the real screen\'s actual dimensions, without any code throwing an error at all; the game would simply behave incorrectly, visually, in a way that might not even be obvious without directly comparing it against the intended design. The Viewport/camera fix works specifically by introducing a layer of INDIRECTION: game logic (update(), collision checks, spawn logic) continues operating ENTIRELY in a FIXED, VIRTUAL coordinate system (this lesson keeps the previous lesson\'s 600×600 virtual space, regardless of what real screen the game eventually runs on) — "x > 300" continues to correctly mean "past the virtual horizontal center" REGARDLESS of the real screen\'s actual size, because that comparison is happening entirely within the FIXED virtual space, never against real screen pixels directly at all. The Viewport, configured once (and updated inside resize(...) whenever the real screen size changes), handles the ENTIRELY SEPARATE job of translating those fixed virtual coordinates into whatever the REAL screen\'s actual pixel dimensions happen to be, ONLY at the final rendering step — meaning update()\'s own logic genuinely never needs to change at all, regardless of whether the game eventually runs on a 600×600 desktop window, a 1080×2400 phone, or anything else, since it was never actually coupled to real screen pixels in the first place.'
    }
  ],
  code: {
    title: 'Berry Catcher, ported to libGDX: ApplicationAdapter, SpriteBatch, Viewport, and polled input',
    intro: 'The SAME Player/FallingItem game logic from game-loop-desktop-game, now running against libGDX instead of JavaFX — nearly identical update() logic, with SpriteBatch replacing GraphicsContext, a FitViewport replacing raw pixel coordinates, and polled Gdx.input calls replacing JavaFX\'s event listeners.',
    code: `import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.ScreenUtils;
import com.badlogic.gdx.utils.viewport.FitViewport;
import com.badlogic.gdx.utils.viewport.Viewport;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

// Player and FallingItem are UNCHANGED from game-loop-desktop-game -- plain mutable fields, no framework dependency
class Player {
    float x = 270, y = 20;
    float width = 60, height = 20;
    float speed = 350;
}

class FallingItem {
    float x, y, radius = 12;
    float fallSpeed;
    boolean isTreasure;

    FallingItem(float x, float fallSpeed, boolean isTreasure) {
        this.x = x;
        this.y = 620;
        this.fallSpeed = fallSpeed;
        this.isTreasure = isTreasure;
    }
}

public class BerryCatcherGame extends ApplicationAdapter {
    private SpriteBatch batch;
    private Texture playerTexture, treasureTexture, cannonballTexture;
    private OrthographicCamera camera;
    private Viewport viewport;

    private final Player player = new Player();
    private final List<FallingItem> items = new ArrayList<>();
    private final Random random = new Random();
    private int score = 0;
    private boolean gameOver = false;
    private float timeSinceLastSpawn = 0, gameTimeSeconds = 0;

    @Override
    public void create() {
        // textures loaded ONCE here -- never inside render(), which would reload them 60 times a second
        batch = new SpriteBatch();
        playerTexture = new Texture("basket.png");
        treasureTexture = new Texture("berry.png");
        cannonballTexture = new Texture("cannonball.png");

        camera = new OrthographicCamera();
        viewport = new FitViewport(600, 600, camera);   // a FIXED virtual 600x600 game world, any real screen size
    }

    @Override
    public void resize(int width, int height) {
        viewport.update(width, height);   // updates the real-to-virtual translation whenever the real screen changes
    }

    @Override
    public void render() {
        float deltaSeconds = Gdx.graphics.getDeltaTime();   // libGDX computes this for you -- no manual timestamp math
        if (!gameOver) update(deltaSeconds);

        ScreenUtils.clear(0.1f, 0.1f, 0.15f, 1f);
        camera.update();
        batch.setProjectionMatrix(camera.combined);

        batch.begin();   // start batching -- individual draw() calls below are accumulated, not immediately executed
        batch.draw(playerTexture, player.x, player.y, player.width, player.height);
        for (FallingItem item : items) {
            Texture t = item.isTreasure ? treasureTexture : cannonballTexture;
            batch.draw(t, item.x - item.radius, item.y - item.radius, item.radius * 2, item.radius * 2);
        }
        batch.end();   // flush everything accumulated since begin() in one efficient pass
    }

    private void update(float deltaSeconds) {
        // POLLED input -- checked directly, every frame, no event listener registered anywhere
        if (Gdx.input.isKeyPressed(Input.Keys.LEFT)) player.x -= player.speed * deltaSeconds;
        if (Gdx.input.isKeyPressed(Input.Keys.RIGHT)) player.x += player.speed * deltaSeconds;
        player.x = Math.max(0, Math.min(540, player.x));

        gameTimeSeconds += deltaSeconds;
        timeSinceLastSpawn += deltaSeconds;
        if (timeSinceLastSpawn > 0.8f) {
            timeSinceLastSpawn = 0;
            boolean isTreasure = random.nextDouble() < 0.7;
            items.add(new FallingItem(random.nextFloat() * 570, 150 + gameTimeSeconds * 5, isTreasure));
        }

        // this collision/movement logic is NEARLY IDENTICAL to game-loop-desktop-game's -- the core logic doesn't change
        Iterator<FallingItem> iterator = items.iterator();
        while (iterator.hasNext()) {
            FallingItem item = iterator.next();
            item.y -= item.fallSpeed * deltaSeconds;   // libGDX's Y axis increases upward -- items fall by DECREASING y

            float dx = item.x - (player.x + player.width / 2);
            float dy = item.y - (player.y + player.height / 2);
            float collisionDistance = item.radius + player.width / 2;
            if (dx * dx + dy * dy < collisionDistance * collisionDistance) {
                if (item.isTreasure) score += 10; else gameOver = true;
                iterator.remove();
            } else if (item.y < -20) {
                iterator.remove();
            }
        }
    }

    @Override
    public void dispose() {
        // native GPU resources -- the garbage collector has no visibility into these at all; must dispose explicitly
        batch.dispose();
        playerTexture.dispose();
        treasureTexture.dispose();
        cannonballTexture.dispose();
    }
}`,
    notes: [
      'Player and FallingItem are essentially unchanged from game-loop-desktop-game -- plain mutable fields with zero dependency on either JavaFX or libGDX, confirming the core game logic genuinely is framework-independent.',
      'Gdx.graphics.getDeltaTime() replaces the previous lesson\'s manual `(now - lastFrameTime) / 1_000_000_000.0` nanosecond calculation entirely -- libGDX provides this directly.',
      'Gdx.input.isKeyPressed(...) replaces the previous lesson\'s movingLeft/movingRight boolean flags set by JavaFX event listeners -- libGDX\'s polling model queries current state directly, with no listener registration needed.',
      'create() loads every Texture exactly once; dispose() releases every native resource exactly once -- render() itself never constructs or destroys a Texture, only draws with already-loaded ones.'
    ]
  },
  lab: {
    title: 'Add a pause feature using polled input, keeping rendering alive',
    prompt: 'Extend <code>BerryCatcherGame</code>: (1) add a field <code>private boolean isPaused = false;</code>; (2) inside <code>render()</code>, BEFORE calling <code>update(deltaSeconds)</code>, check <code>Gdx.input.isKeyJustPressed(Input.Keys.P)</code> (a variant that returns <code>true</code> only on the exact frame a key transitions from not-pressed to pressed, avoiding rapid toggling while held) and, if true, flip <code>isPaused = !isPaused;</code>; (3) change the call to <code>update(deltaSeconds)</code> so it only runs <code>if (!gameOver && !isPaused)</code>, while the rendering code below it continues to run unconditionally every frame regardless of <code>isPaused</code>.',
    starter: `// Add to BerryCatcherGame

// TODO 1: add "private boolean isPaused = false;" as a field

@Override
public void render() {
    float deltaSeconds = Gdx.graphics.getDeltaTime();

    // TODO 2: if (Gdx.input.isKeyJustPressed(Input.Keys.P)) { isPaused = !isPaused; }

    // TODO 3: change this line so update() only runs if (!gameOver && !isPaused)
    if (!gameOver) update(deltaSeconds);

    ScreenUtils.clear(0.1f, 0.1f, 0.15f, 1f);
    camera.update();
    batch.setProjectionMatrix(camera.combined);
    batch.begin();
    batch.draw(playerTexture, player.x, player.y, player.width, player.height);
    for (FallingItem item : items) {
        Texture t = item.isTreasure ? treasureTexture : cannonballTexture;
        batch.draw(t, item.x - item.radius, item.y - item.radius, item.radius * 2, item.radius * 2);
    }
    batch.end();
}`,
    checks: [
      { re: 'private\\s+boolean\\s+isPaused\\s*=\\s*false\\s*;', must: true, hint: 'Add the field: private boolean isPaused = false;', pass: 'isPaused field added ✓' },
      { re: 'Gdx\\.input\\.isKeyJustPressed\\(\\s*Input\\.Keys\\.P\\s*\\)', must: true, hint: 'Check Gdx.input.isKeyJustPressed(Input.Keys.P).', pass: 'isKeyJustPressed(Input.Keys.P) checked ✓' },
      { re: 'isPaused\\s*=\\s*!\\s*isPaused', must: true, hint: 'Toggle isPaused = !isPaused when P is just pressed.', pass: 'isPaused toggled ✓' },
      { re: 'if\\s*\\(\\s*!gameOver\\s*&&\\s*!isPaused\\s*\\)\\s*update\\(\\s*deltaSeconds\\s*\\)', must: true, hint: 'The update() call must be guarded by if (!gameOver && !isPaused).', pass: 'update() correctly guarded ✓' },
      { re: 'batch\\.begin\\(\\)', must: true, hint: 'The rendering code (batch.begin()/draw/end()) must remain outside any pause-related condition, still running every frame.', pass: 'rendering still runs unconditionally ✓' }
    ],
    run: 'The application in desktop or web mode — pressing P should freeze all movement (falling items stop, score stops changing) while the window remains fully responsive and still visibly rendering the current (frozen) state, and pressing P again resumes exactly where it left off.',
    solution: `private boolean isPaused = false;

@Override
public void render() {
    float deltaSeconds = Gdx.graphics.getDeltaTime();

    if (Gdx.input.isKeyJustPressed(Input.Keys.P)) {
        isPaused = !isPaused;
    }

    if (!gameOver && !isPaused) update(deltaSeconds);

    ScreenUtils.clear(0.1f, 0.1f, 0.15f, 1f);
    camera.update();
    batch.setProjectionMatrix(camera.combined);
    batch.begin();
    batch.draw(playerTexture, player.x, player.y, player.width, player.height);
    for (FallingItem item : items) {
        Texture t = item.isTreasure ? treasureTexture : cannonballTexture;
        batch.draw(t, item.x - item.radius, item.y - item.radius, item.radius * 2, item.radius * 2);
    }
    batch.end();
}`,
    notes: [
      'isKeyJustPressed (rather than isKeyPressed) is specifically the right choice for a toggle -- isKeyPressed would return true for every single frame P is held down, flipping isPaused back and forth many times per second while the key is held rather than toggling once per press.',
      'The rendering code (ScreenUtils.clear through batch.end()) is left completely unconditional -- exactly the "keep rendering and input processing alive during a pause" design game-loop-desktop-game\'s own interview material argued for over stopping the whole loop entirely.',
      'gameTimeSeconds (used for the difficulty ramp) correctly stops accumulating while paused too, since it\'s only updated inside update(), which is itself skipped while isPaused is true.'
    ]
  },
  quiz: [
    {
      q: 'Why can\'t game-loop-desktop-game\'s JavaFX-based Berry Catcher run on a web browser or a mobile device, and what does libGDX do differently to make that possible?',
      options: ['JavaFX only runs on a desktop JVM, with no browser or mobile-native runtime -- libGDX abstracts platform-specific rendering/input behind its own API, with swappable backends (desktop, web via GWT, Android, iOS) so the same core game code runs against any of them', 'JavaFX code is slower than libGDX code, making it technically incapable of running on less powerful devices', 'libGDX games cannot use Java at all, requiring a completely different programming language', 'JavaFX and libGDX are two names for the exact same underlying technology'],
      correct: 0,
      explain: 'JavaFX has no runtime for web browsers or native mobile app environments. libGDX solves this by abstracting the actual rendering/input calls behind its own API, with a separate, swappable backend implementation per target platform.'
    },
    {
      q: 'How does a real libGDX project\'s module structure relate to maven-multi-module\'s parent/child pattern?',
      options: ['A platform-independent "core" module holds all the actual game logic, with separate, thin per-platform "launcher" modules (desktop, html, android) each depending on core -- directly parallel to a shared module plus dependent modules', 'libGDX projects cannot use Maven or any multi-module build system at all', 'The "core" module depends on each platform-specific launcher module, the reverse of the dependency direction described', 'There is no relationship at all between libGDX\'s structure and Maven multi-module projects'],
      correct: 0,
      explain: 'libGDX projects are genuinely structured as multi-module builds: one core module with all platform-independent logic, and thin launcher modules per platform that depend on core -- exactly the shared-module-plus-dependents shape maven-multi-module built.'
    },
    {
      q: 'Why must Texture and SpriteBatch objects be explicitly disposed via dispose(), rather than relying on Java\'s garbage collector?',
      options: ['They hold native GPU memory/resources that live entirely outside the JVM heap -- the garbage collector has no visibility into or ability to reclaim GPU memory automatically, no matter how unreachable the Java object itself becomes', 'dispose() is only a coding convention with no actual technical necessity behind it', 'Texture and SpriteBatch are the only classes in all of Java that require any manual cleanup at all', 'The garbage collector automatically calls dispose() on any object with that method defined'],
      correct: 0,
      explain: 'GPU memory and native resources exist entirely outside the JVM heap that the garbage collector manages. Without explicit dispose(), that native memory leaks for the application\'s entire lifetime, regardless of the corresponding Java object\'s own reachability.'
    },
    {
      q: 'What is the key difference between JavaFX\'s event-driven input (scene.setOnKeyPressed) and libGDX\'s Gdx.input.isKeyPressed(...)?',
      options: ['JavaFX registers a callback invoked when a key event occurs asynchronously; libGDX directly queries the current true/false state of a key at the exact moment it\'s called, with no callback or listener involved at all', 'They are functionally identical, differing only in method naming convention', 'Gdx.input.isKeyPressed() can only be used for mouse input, never keyboard input', 'JavaFX\'s event-driven model does not require any input handling code at all'],
      correct: 0,
      explain: 'JavaFX\'s model is event-driven (a callback fires when an event happens). libGDX\'s isKeyPressed() is a direct, synchronous poll of current input state, called every frame, with no listener registration or asynchronous event delivery involved.'
    },
    {
      q: 'A game\'s collision logic uses fixed values in a 600x600 virtual coordinate space, but is deployed to run on screens of many different real sizes. What makes this work correctly without changing the collision logic itself?',
      options: ['A Viewport/camera translates the fixed virtual coordinates to whatever the real screen\'s actual pixel dimensions are, only at the final rendering step -- game logic never needs to know or care about the real screen size', 'The collision logic must be rewritten separately for every possible screen size the game might run on', 'libGDX automatically resizes all game objects\' actual coordinate values to match the real screen whenever resize() is called', 'This scenario is not actually possible -- a fixed virtual coordinate system cannot work across different real screen sizes'],
      correct: 0,
      explain: 'The Viewport/camera layer handles translating fixed virtual coordinates to the real screen\'s actual dimensions, entirely at render time -- game logic (including collision detection) operates purely within the fixed virtual space and never needs to change based on the real screen size.'
    }
  ],
  testFlow: {
    title: 'Test yourself: cross-platform structure, resource disposal, and polled input',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A developer wants to add support for a new platform libGDX supports. Following the core/launcher module pattern, what needs to be written?',
        choices: [
          { text: 'A new, thin launcher module depending on the existing, unchanged core module, containing only the platform-specific bootstrapping code needed to start that platform\'s backend', to: 'q1_right' },
          { text: 'The entire game logic must be rewritten from scratch specifically for the new platform', to: 'q1_wrong_rewrite' },
          { text: 'The core module itself must be modified to add platform-specific code for the new target', to: 'q1_wrong_coremod' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- this is precisely the value of the core/launcher split: a new platform requires only a new, thin launcher module depending on the existing core, with the actual game logic untouched and unduplicated.', next: 'q2' },
      q1_wrong_rewrite: { end: true, correct: false, text: 'This defeats the entire purpose of the core/launcher architecture -- the whole point is that the core module\'s game logic is written ONCE and reused, unmodified, across every platform.', retry: 'q1' },
      q1_wrong_coremod: { end: true, correct: false, text: 'The core module is deliberately kept free of ANY platform-specific code at all -- adding platform-specific logic there would defeat the separation the whole architecture is built around.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A game loads five different Texture objects inside create() once, at startup. Where should they be disposed, and why?',
        choices: [
          { text: 'Inside dispose(), called once when the application shuts down -- textures hold native GPU memory the garbage collector cannot reclaim, so each one loaded must be explicitly disposed exactly once', to: 'q2_right' },
          { text: 'Inside render(), disposed and reloaded every single frame to ensure they stay current', to: 'q2_wrong_everyframe' },
          { text: 'They do not need to be disposed at all, since Java\'s garbage collector will eventually reclaim them automatically', to: 'q2_wrong_gc' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- dispose() is called once, at shutdown, and is the correct place to release each texture\'s native GPU memory exactly once, matching each texture\'s single load in create().', next: 'q3' },
      q2_wrong_everyframe: { end: true, correct: false, text: 'This would be both catastrophically wasteful (reloading from disk 60 times a second) and incorrect -- textures should be loaded once in create() and drawn (not reloaded) every frame in render().', retry: 'q2' },
      q2_wrong_gc: { end: true, correct: false, text: 'This is exactly the misconception this lesson warns against -- Texture objects hold NATIVE GPU memory entirely outside the JVM heap, which the garbage collector has no visibility into or ability to reclaim at all, regardless of the Java object\'s own reachability.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'Why does libGDX\'s Gdx.input.isKeyPressed(...) not require a separate boolean flag set by an event listener, unlike game-loop-desktop-game\'s JavaFX-based movingLeft flag?',
        choices: [
          { text: 'isKeyPressed() directly queries the current, real-time state of the key at the moment it\'s called -- there is no asynchronous event to bridge into the update step, since the query itself already reflects the current state', to: 'q3_right' },
          { text: 'libGDX games do not support keyboard input at all, only touch input', to: 'q3_wrong_notouch' },
          { text: 'Gdx.input.isKeyPressed() secretly uses the exact same flag-based mechanism internally, just hidden from the developer', to: 'q3_wrong_hiddenflag' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- isKeyPressed() is a direct, synchronous poll of current input state, fundamentally different from an event-driven callback. There is no asynchronous event to bridge, so no intermediate flag is needed.', next: null },
      q3_wrong_notouch: { end: true, correct: false, text: 'libGDX fully supports keyboard input on platforms where a keyboard exists (desktop, web) -- this lesson\'s own code demo uses Gdx.input.isKeyPressed(Input.Keys.LEFT) directly for exactly this purpose.', retry: 'q3' },
      q3_wrong_hiddenflag: { end: true, correct: false, text: 'isKeyPressed() genuinely queries the underlying input system\'s current state directly at call time -- it is not merely a hidden reimplementation of the event-listener-plus-flag pattern; the whole point is that it is a fundamentally different, poll-based mechanism.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Loading a Texture inside render() instead of once inside create() -- reloads the image from disk into GPU memory 60 times per second, a severe and unnecessary performance cost.',
    'Forgetting to call dispose() on every Texture/SpriteBatch created -- leaks native GPU memory the garbage collector has no visibility into, regardless of the Java object\'s own reachability.',
    'Coupling game logic (collision checks, spawn positions) directly to real screen pixel dimensions instead of a fixed virtual coordinate space -- breaks the moment the game runs on a different screen size without a Viewport/camera layer to translate.',
    'Placing multiple batch.begin()/end() pairs unnecessarily, or switching textures excessively within one begin()/end() block -- undermines the batching optimization SpriteBatch exists to provide.',
    'Using isKeyPressed() (true for every frame a key is held) for a toggle action like pausing, instead of isKeyJustPressed() (true only on the exact frame the key transitions to pressed) -- causes rapid, unwanted repeated toggling while the key is held.',
    'Assuming the "core" module can contain any platform-specific imports at all, even conditionally -- defeats the entire cross-platform architecture; all platform-specific code belongs exclusively in the per-platform launcher modules.'
  ],
  interview: [
    {
      q: 'A team building a libGDX game wants to write automated tests for the collision-detection and scoring logic without spinning up any actual rendering backend (no real window, no real GPU). Design, in words, how the core/launcher module split makes this straightforward, connecting to this course\'s test pyramid material.',
      a: 'This is precisely where the core/launcher architectural separation pays off directly for testability, in a way structurally similar to spring-boot-rest-api\'s thin-controller/real-service-layer argument. The core module\'s classes (Player, FallingItem, and the update() method containing all the actual collision/scoring/spawning logic) have NO dependency on any actual rendering backend at all — update() reads Gdx.input\'s current state and Gdx.graphics.getDeltaTime(), both of which ARE libGDX APIs, but critically, update() itself never constructs a Texture, never calls SpriteBatch, and never requires an actual GPU or window to exist to run correctly; it operates purely on plain Java objects (Player, FallingItem, a List) and simple numeric calculations. This means a plain JUnit test (unit-testing-junit5\'s exact discipline) can construct a Player and a List<FallingItem> directly, set up a specific scenario (a FallingItem positioned to exactly overlap the player), and call the collision-checking logic DIRECTLY — extracted, ideally, into its own small, separately-testable method rather than buried entirely inside update() itself — asserting the expected score/game-over outcome, with ZERO actual libGDX Application/backend ever started, exactly mockito-test-doubles\' and the test pyramid\'s "isolate the logic under test from real, heavyweight collaborators" instinct, now applied to a rendering framework instead of a database or an HTTP server. The one piece requiring actual care: since update() as written directly calls Gdx.input.isKeyPressed(...) and Gdx.graphics.getDeltaTime(), a plain unit test attempting to call update() directly would need EITHER libGDX\'s own headless testing backend (a real, supported mechanism specifically for this exact scenario) OR, more in the spirit of this course\'s constructor-injection arguments, refactoring update() to accept input state and delta time as PARAMETERS rather than reaching out to Gdx.input/Gdx.graphics directly inside its own body — making the method a plain, pure function of its inputs, trivially testable with zero framework involvement at all, exactly the same "depend on what\'s passed in, not what you reach out and grab yourself" discipline spring-core-di\'s constructor-injection argument made generally.'
    },
    {
      q: 'Compare the "delta time" concept as taught in game-loop-desktop-game (manual nanosecond math) versus this lesson\'s Gdx.graphics.getDeltaTime(). Is anything conceptually different, or purely a convenience difference?',
      a: 'This is purely a CONVENIENCE difference, and it\'s worth being precise about exactly what stays the same versus what changes, since conflating "the framework computes it for me" with "this is a fundamentally different concept" would be a real misunderstanding. The underlying CONCEPT — elapsed real time since the previous frame, used to scale movement so the game\'s actual speed stays consistent regardless of frame rate — is IDENTICAL in both lessons, with identical mathematical reasoning (item.y += fallSpeed * deltaSeconds in both cases). What differs is purely WHO performs the timestamp bookkeeping: game-loop-desktop-game required the developer to manually capture `now` inside AnimationTimer.handle(long now), subtract the PREVIOUS frame\'s stored timestamp, divide by a billion to convert nanoseconds to seconds, and remember to update the stored `lastFrameTime` variable for the NEXT frame\'s calculation — several explicit, easy-to-get-wrong steps (forgetting to update lastFrameTime produces an ever-growing, incorrect delta, exactly this lesson\'s own tech-question scenario in the previous lesson). Gdx.graphics.getDeltaTime() performs this EXACT SAME calculation internally, inside libGDX\'s own framework code, and simply hands the developer the already-computed result directly — no manual timestamp storage, no manual subtraction, no possibility of forgetting to update a stored "last frame" value, since libGDX\'s own internal loop machinery handles that bookkeeping itself, correctly, every time. This is a genuinely valuable convenience (eliminating an entire category of easy-to-make bugs around the manual bookkeeping) but it teaches nothing NEW conceptually beyond what game-loop-desktop-game already established — precisely the kind of "the framework automates something you\'ve already learned to do by hand" pattern this course has repeated deliberately several times (raw JDBC to JPA/Hibernate, manual dependency construction to Spring\'s IoC container) specifically so the UNDERLYING mechanism is genuinely understood before the convenience layer hides it.'
    },
    {
      q: 'A developer argues that since libGDX games can target the web via a GWT backend, there\'s no longer any reason to teach or use JavaFX/Canvas at all for game development — libGDX should simply replace it entirely in this course\'s curriculum. Evaluate this argument.',
      a: 'This argument overstates libGDX\'s advantages into a universal replacement, when the actual relationship between the two technologies (and lessons) is complementary, not competitive, for a specific pedagogical and practical reason worth stating precisely. Pedagogically: game-loop-desktop-game deliberately built the game loop, delta time, and collision detection BY HAND, directly against general-purpose JavaFX APIs never specifically designed for games — this exposed the actual, foundational MECHANISM (why delta time matters, why immediate-mode drawing requires redrawing everything, how a squared-distance collision check works) with nothing hidden behind a framework\'s own conveniences; skipping straight to libGDX\'s Gdx.graphics.getDeltaTime() and its own built-in collision-detection utilities (which libGDX also provides, beyond what this lesson\'s code demo shows) would let a student USE these tools correctly without ever understanding WHY they work the way they do, exactly the "understand the raw JDBC underneath before reaching for JPA\'s convenience" pattern this course has applied deliberately and repeatedly. Practically: JavaFX and Canvas remain the genuinely right, simpler choice for a DESKTOP-ONLY application that has no actual need to ALSO target web or mobile — reaching for libGDX\'s cross-platform abstraction, multi-module project structure, and additional API surface (Viewport, SpriteBatch, backend-specific launcher setup) for an application that will only ever run on desktop is real, unneeded complexity paid for a capability (cross-platform deployment) that specific application doesn\'t actually require — directly the same "match the tool to the actual requirement, don\'t reach for more capability than the situation calls for" argument frontend-choices made about React versus Thymeleaf/Vaadin, now applied to game frameworks instead of web frontend strategies. The precise, correct position: teach the foundational mechanism directly and simply first (JavaFX/Canvas, this course\'s actual sequencing), THEN show the cross-platform framework that automates and extends it specifically once a genuine cross-platform requirement exists — not replace one with the other, since they serve genuinely different purposes and, for JavaFX specifically, remain the better fit for genuinely desktop-only needs.'
    },
    {
      q: 'A production libGDX game exhibits a memory leak that grows steadily over a long play session, eventually crashing after several hours. The Java heap profiler shows normal, stable heap usage throughout — the leak is NOT visible in Java heap memory at all. Diagnose the most likely root cause using this lesson\'s material.',
      a: 'A leak that grows steadily over time but is completely INVISIBLE in the Java HEAP profiler is an extremely strong, specific signal pointing directly at this lesson\'s central resource-disposal warning: the leak is almost certainly in NATIVE (GPU) memory — Texture, SpriteBatch, or similar libGDX resources being repeatedly created (say, inside some code path that runs periodically during gameplay, like a new enemy type\'s texture being loaded fresh each time that enemy spawns, rather than loaded once and reused) WITHOUT a corresponding dispose() call ever being made for each one — a Java heap profiler specifically measures JVM-managed heap memory, and native GPU memory allocated via libGDX\'s Texture/SpriteBatch classes lives entirely OUTSIDE that heap, invisible to a tool measuring only heap usage, precisely the "the garbage collector has no visibility into this at all" point this lesson\'s concept section and tech question both build around explicitly. The fix requires auditing every place in the codebase where a `new Texture(...)` (or similar native-resource-allocating call) occurs OUTSIDE of create() specifically — this lesson\'s own code demo deliberately loads every texture exactly once, in create(), specifically to avoid this exact failure mode; any code path that loads a NEW texture repeatedly during gameplay (rather than reusing an already-loaded one) is the most likely candidate, and each such texture needs either to be loaded ONCE, up front, and reused, OR, if genuinely dynamic textures are unavoidable for some specific game mechanic, each dynamically-created one needs an EXPLICIT, matching dispose() call once it\'s no longer needed, rather than simply being abandoned and left to accumulate in GPU memory indefinitely. The general diagnostic principle worth stating precisely: a memory leak invisible in a JVM heap profiler is a strong, specific signal to look OUTSIDE the JVM heap entirely — native resources (GPU memory, file handles, native library allocations) that Java\'s own garbage collector has no visibility into whatsoever, requiring their own, separate, explicit lifecycle management discipline distinct from ordinary Java object lifecycle reasoning.'
    }
  ]
};
