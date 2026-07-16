window.LESSONS = window.LESSONS || {};
window.LESSONS['game-loop-desktop-game'] = {
  id: 'game-loop-desktop-game',
  title: 'Game Programming I: The Game Loop, Canvas & a Complete Desktop Game',
  category: 'Part 11 — Desktop & Games',
  timeMin: 60,
  summary: 'javafx-desktop\'s entire model was EVENT-DRIVEN: code runs in reaction to a click, and the Scene Graph remembers and redraws itself automatically. A game needs something fundamentally different — a GAME LOOP running continuously, tick after tick, regardless of whether the user did anything at all, drawing onto a Canvas that remembers NOTHING between frames unless the game\'s own code redraws it. This lesson builds a complete, working game (Nami\'s Berry Catcher — catch falling treasure, dodge cannonballs) using JavaFX\'s AnimationTimer as the loop, Canvas/GraphicsContext for immediate-mode drawing, delta-time-based movement so the game behaves identically regardless of frame rate, and basic collision detection — the foundational pattern underlying every real-time game, in any language or engine.',
  goals: [
    'Explain the game loop pattern (update, render, repeat continuously) and why it fundamentally differs from javafx-desktop\'s event-driven, react-to-a-click model',
    'Use JavaFX\'s AnimationTimer to drive a continuous loop synchronized with the display\'s own refresh rate',
    'Explain the difference between Canvas\'s immediate-mode drawing and the Scene Graph\'s retained-mode model, and redraw a complete frame using GraphicsContext',
    'Use delta time (elapsed time since the last frame) to make movement frame-rate independent, rather than naively moving a fixed amount every frame',
    'Implement keyboard input handling and basic collision detection to build a complete, playable game'
  ],
  concept: [
    {
      h: 'The game loop: continuous, not event-driven',
      p: [
        'javafx-desktop\'s entire model was fundamentally REACTIVE: code runs when something happens — a button click fires an event handler, a bound property changes and the display updates — and between those moments, NOTHING runs at all; the application simply waits. A game cannot work this way: falling treasure needs to keep falling, cannonballs need to keep moving, and the screen needs to keep updating CONTINUOUSLY, whether or not the player has pressed anything recently at all. The standard pattern every real-time game is built on, regardless of language or engine, is the GAME LOOP: a cycle that runs over and over, as fast as the display can usefully show it (commonly targeting 60 times per second), each iteration doing exactly two things in order — UPDATE (advance the game\'s own state: move every falling item down by some amount, check for collisions, process any input received since the last iteration) and RENDER (draw the CURRENT state of everything onto the screen) — then immediately loop back and do it again.',
        'JavaFX provides <code>AnimationTimer</code> specifically for this: extending it and overriding <code>handle(long now)</code> gives you a method JavaFX itself calls AUTOMATICALLY, once per frame, synchronized with the display\'s own rendering pulse (commonly ~60 times per second) — calling <code>timer.start()</code> begins this continuous cycle, and it keeps running, calling <code>handle(...)</code> again and again, until <code>timer.stop()</code> is called. Critically, and directly building on javafx-desktop\'s thread-safety material: <code>handle(...)</code> is called BY JavaFX itself, ON the Application Thread — this is precisely why it\'s safe to touch Canvas and the rest of the Scene Graph directly inside it, with no Platform.runLater or Task involved at all; JavaFX has already done the thread-marshaling for you, automatically, every single frame.'
      ]
    },
    {
      h: 'Canvas: immediate-mode drawing, the opposite of the Scene Graph',
      p: [
        'javafx-desktop\'s Scene Graph is RETAINED-MODE: you construct a Button once, add it to the tree once, and JavaFX remembers it and keeps redrawing it correctly, forever, with no further work from you — this is why bindings work at all (the Node persists, and JavaFX re-renders it automatically whenever its bound properties change). <code>Canvas</code> and its <code>GraphicsContext</code> are the OPPOSITE, IMMEDIATE-MODE model: <code>canvas.getGraphicsContext2D().fillOval(x, y, width, height)</code> draws a filled oval at the CURRENT moment, onto the CURRENT frame — and then IMMEDIATELY FORGETS IT ENTIRELY. Nothing about that oval persists in any object JavaFX remembers or will redraw automatically next frame; if you want it to appear again on the NEXT frame, your code must call <code>fillOval(...)</code> again, yourself, with (presumably) updated coordinates, inside THAT frame\'s render step too.',
        'This means every single frame must REDRAW EVERYTHING that should be visible, from scratch, typically starting with <code>gc.clearRect(0, 0, width, height)</code> (erasing the previous frame\'s drawing entirely) followed by drawing every current game object at its CURRENT position — the game\'s own data structures (a <code>List&lt;FallingItem&gt;</code>, a <code>Player</code> object\'s current x/y) are the ONLY thing that actually "remembers" anything between frames; Canvas itself remembers nothing at all. This is precisely why game objects are modeled as PLAIN, mutable Java fields (<code>double x, y;</code>) rather than javafx-desktop\'s JavaFX properties — a property\'s whole point is triggering an automatic re-render when it changes, but a game loop ALREADY re-renders everything unconditionally, every single frame, making that automatic-update machinery pure unneeded overhead for data that changes dozens of times per second anyway.'
      ]
    },
    {
      h: 'Delta time: frame-rate-independent movement',
      p: [
        'A naive first attempt at moving a falling item might write <code>item.y += 3;</code> inside every call to <code>handle(...)</code> — moving down by a fixed 3 pixels every frame. This is a genuine, common bug: it makes the GAME\'S ACTUAL SPEED entirely dependent on how fast <code>handle(...)</code> happens to be called, which varies by the player\'s hardware, other running programs, and the display\'s own refresh rate — the identical game would run TWICE as fast on a 120Hz monitor as a 60Hz one, and would visibly slow down or speed up if the frame rate itself fluctuates during play, a genuinely unfair and inconsistent experience. The fix is DELTA TIME: measuring how much REAL TIME actually elapsed since the LAST frame, and scaling every movement by that elapsed time rather than treating each frame as an equal, fixed unit — <code>item.y += fallSpeed * deltaSeconds;</code> (fallSpeed now meaning "pixels per SECOND," a genuine physical rate, rather than "pixels per frame," a rate that only makes sense relative to however fast frames happen to be arriving).',
        '<code>AnimationTimer.handle(long now)</code> receives <code>now</code> as a timestamp in NANOSECONDS (a monotonic clock specifically for measuring elapsed durations — directly connecting to datetime-io-nio\'s Duration-vs-Period distinction: this is exactly a Duration use case, an exact elapsed span, not a calendar-aware one) — computing <code>double deltaSeconds = (now - lastFrameTime) / 1_000_000_000.0;</code> each frame, then updating <code>lastFrameTime = now;</code> for the NEXT frame\'s calculation, gives the exact elapsed time since the previous frame, in seconds, ready to scale every movement by. With this fix, an item falling at "200 pixels per second" genuinely falls at that real-world rate regardless of whether the game happens to be running at 30, 60, or 144 frames per second — a slower frame rate simply means each individual frame\'s delta time is LARGER, so each frame moves the item FURTHER to compensate, keeping the overall real-time speed consistent.'
      ]
    },
    {
      h: 'Game state as plain objects, and processing input each frame',
      p: [
        'A game\'s objects — <code>Player</code> (x, y, a movement speed), <code>FallingItem</code> (x, y, a fall speed, whether it\'s treasure or a cannonball) — are modeled as simple, plain Java classes with mutable fields, updated DIRECTLY by the update step every frame, exactly the "plain data, mutated in place, redrawn from scratch" model the previous section built. Keyboard input is handled by registering listeners on the Scene (<code>scene.setOnKeyPressed(event -&gt; { if (event.getCode() == KeyCode.LEFT) movingLeft = true; })</code>, with a matching <code>setOnKeyReleased</code> clearing the flag) — critically, these handlers do NOT move the player directly; they simply set or clear simple BOOLEAN FLAGS (<code>movingLeft</code>, <code>movingRight</code>), and the update step, running every frame, CHECKS those flags and moves the player accordingly, scaled by delta time exactly like every other movement — this decouples "a key is currently held down" (an event that can happen at any arbitrary moment, asynchronously relative to the game loop) from "how far the player actually moves" (which must happen inside the loop\'s own consistent, delta-time-scaled update step, not inside the event handler itself).',
        'Basic COLLISION DETECTION for this kind of game is a straightforward distance or bounding-box check, run once per frame during the update step, for every falling item against the player: two circular objects with centers <code>(x1,y1)</code> and <code>(x2,y2)</code> and radii <code>r1</code>/<code>r2</code> are considered colliding when the distance between their centers is less than <code>r1 + r2</code> — computed cheaply without an actual square root via comparing SQUARED distances (<code>dx*dx + dy*dy &lt; (r1+r2)*(r1+r2)</code>, avoiding the more expensive <code>Math.sqrt</code> call for a check that only needs a true/false comparison, a small but genuinely common real-world performance habit in code running dozens of times per frame for potentially many objects at once). A caught treasure item increases the score and is removed from the active list; a caught cannonball ends the game — both are ordinary state changes made directly inside the update step, exactly like every other piece of this loop.'
      ]
    },
    {
      h: 'Putting the whole loop together: update, then render, every single frame',
      p: [
        'The complete pattern, inside every single call to <code>handle(now)</code>: compute delta time from <code>now</code> and the previous frame\'s timestamp; UPDATE — move the player based on the current input flags (scaled by delta time), move every falling item down (scaled by delta time and each item\'s own fall speed), check every falling item against the player for a collision (removing caught items and updating score/game-over state), and occasionally spawn a brand-new falling item (commonly on a timer, so items don\'t all appear at once); then RENDER — clear the canvas completely, draw the player at its current position, draw every remaining falling item at its current position, and draw the current score as text. This entire sequence repeats, unconditionally, roughly sixty times every single second, for as long as the game runs — the ENTIRE illusion of smooth, continuous motion is nothing more than this loop redrawing slightly-different-each-time static frames rapidly enough that the human eye perceives continuous movement, exactly the same principle underlying film and animation generally, now driven by real, live game logic rather than pre-recorded frames.',
        'This game loop pattern — independent of JavaFX specifically — is the SAME foundational structure underlying every real-time game engine in existence, from the simplest 2D arcade game to the most sophisticated modern 3D engine: an UPDATE phase advancing simulation state by some amount of elapsed time, and a RENDER phase drawing the CURRENT state, repeating continuously — cross-platform-games-libgdx (next lesson) will show this exact same update/render loop structure, expressed through a different, more full-featured game framework, specifically so a single codebase can target desktop, web, AND mobile simultaneously, but the core pattern this lesson builds by hand, directly against JavaFX, is precisely the same pattern that framework automates and extends.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Usopp\'s target-practice loop: a continuous rhythm, a chalkboard wiped clean every check, and speed measured by the clock, not the count',
      text: 'Usopp\'s target practice never waits for someone to TELL him something changed — he runs a continuous, unbroken RHYTHM: check the target, aim, adjust, fire, check again, over and over, tick after tick, whether or not anything new has happened since the last cycle (the game loop, continuous rather than event-driven). And here\'s the specific discipline that makes his practice actually reliable: he keeps a small chalkboard tracking the target\'s CURRENT position and his own aim — but before EVERY single check, he WIPES it completely clean and redraws EVERYTHING on it fresh, from scratch, with absolutely nothing carried over automatically from the last check unless he personally, deliberately redraws it himself (Canvas\'s immediate-mode drawing — nothing persists between frames unless your own code redraws it, unlike a retained diorama that would remember things for you). Now here\'s the mistake a green apprentice makes on their first day training alongside him: they assume the target moves the SAME fixed distance every single time they happen to check it — but Usopp knows better, and corrects them immediately: the target moves at a REAL, physical speed, regardless of how quickly or slowly the apprentice happens to check it, so if the apprentice sometimes checks in a rush and sometimes checks slowly, they must account for exactly how much REAL TIME passed since their LAST check, scaling the target\'s expected position by that actual elapsed time — never by a fixed "one step per check" rule that would make the target appear to move at wildly different speeds depending purely on how often they happened to look (delta time: movement scaled by actual elapsed time, not by a fixed per-frame amount). Nami directs Usopp\'s aim left or right with quick calls, and Usopp checks, every single cycle, whether his shot\'s actual position overlaps the target closely enough to count as a genuine hit (collision detection) — and the whole practice session, hundreds of these tiny cycles per minute, is nothing more than this same simple rhythm repeated relentlessly, fast enough that it FEELS like one smooth, continuous session rather than hundreds of separate, individual checks.',
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon\'s inventory-check loop: a continuous rhythm, a whiteboard wiped clean every check, and speed measured by the clock, not the count',
      text: 'Sheldon\'s comic-book-and-collectible inventory check never waits for someone to TELL him something changed — he runs a continuous, unbroken RHYTHM: check an item\'s condition, note its position on the shelf, verify nothing\'s been disturbed, move to the next, over and over, whether or not anything new has actually happened since his last pass (the game loop, continuous rather than event-driven). And here\'s the specific discipline that makes his checks actually reliable: he keeps a small whiteboard tracking each item\'s CURRENT status — but before EVERY single pass, he ERASES it completely and rewrites EVERYTHING fresh, from scratch, with absolutely nothing carried over automatically unless he personally, deliberately rewrites it himself (Canvas\'s immediate-mode drawing — nothing persists between frames unless your own code redraws it). Now here\'s the mistake Leonard makes trying to help him once: Leonard assumes an item that\'s supposed to be "aging" or shifting slightly moves by the SAME fixed amount every single time he happens to check it — but Sheldon corrects him immediately, with characteristic exasperation: the real-world process happens at a REAL, physical rate, regardless of how quickly or slowly Leonard happens to check it, so if Leonard sometimes checks in a rush and sometimes checks slowly, he must account for exactly how much REAL TIME passed since his LAST check, scaling his expectation by that actual elapsed time — never a fixed "one step per check" rule that would make the same real process appear to happen at wildly different rates depending purely on how often he happened to look (delta time: movement scaled by actual elapsed time, not by a fixed per-check amount). Amy calls out updates on specific items as she notices them, and Sheldon checks, every single pass, whether a reported change actually corresponds closely enough to something worth flagging (collision detection) — and the whole inventory session, dozens of these tiny cycles per minute, is nothing more than this same simple rhythm repeated relentlessly, fast enough that it FEELS like one smooth, continuous check rather than dozens of separate, individual passes.',
    },
    why: 'Usopp\'s / Sheldon\'s continuous, unbroken check-aim-fire / check-note-verify rhythm, running regardless of whether anything new happened, is the game loop — continuous, not event-driven. The chalkboard/whiteboard wiped completely clean and redrawn from scratch every single cycle, with nothing carried over automatically, is Canvas\'s immediate-mode drawing, the opposite of a retained Scene Graph that would remember things for you. The apprentice\'s / Leonard\'s mistake — assuming a fixed amount of movement per CHECK rather than per unit of REAL TIME — is precisely the naive, frame-rate-DEPENDENT movement bug delta time fixes, scaling movement by actual elapsed time instead. And checking whether a shot/report actually overlaps the target/expectation closely enough to count is collision detection — all repeated so fast it becomes, to the observer, one smooth, continuous experience rather than hundreds of separate individual cycles.'
  },
  storyAnim: {
    title: 'Check, wipe, redraw, fire, check again — a continuous rhythm, not a wait-for-a-signal',
    h: 340,
    props: [
      { id: 'checkloop', emoji: '🔄', label: 'check -> aim -> fire -> check again, continuously (the game loop)', x: 6, y: 8 },
      { id: 'wipeboard', emoji: '🧹', label: 'the chalkboard wiped completely clean before every check (Canvas: immediate mode)', x: 30, y: 8 },
      { id: 'redraw', emoji: '✏️', label: 'everything redrawn fresh, nothing carried over automatically', x: 54, y: 8 },
      { id: 'fixedmistake', emoji: '❌', label: 'the apprentice\'s mistake: one fixed step per CHECK (frame-rate dependent)', x: 30, y: 50 },
      { id: 'deltafix', emoji: '⏱️', label: 'the fix: scale by REAL TIME elapsed since the last check (delta time)', x: 60, y: 50 },
      { id: 'hit', emoji: '🎯', label: 'checking whether the shot overlaps the target closely enough (collision detection)', x: 82, y: 8 }
    ],
    actors: [
      { id: 'usopp', emoji: '🎯', label: 'Usopp', x: 20, y: 78 },
      { id: 'nami', emoji: '🧭', label: 'Nami', x: 65, y: 78 }
    ],
    steps: [
      { c: 'Usopp runs a continuous rhythm -- check, aim, fire, check again -- with no need for anyone to tell him something changed first.', p: { checkloop: 'lit' }, a: { usopp: [20, 30] } },
      { c: 'Before every single check, the chalkboard is wiped completely clean.', p: { wipeboard: 'lit' } },
      { c: 'Everything is redrawn fresh -- nothing persists automatically from the last check.', p: { redraw: 'good' } },
      { c: 'A green apprentice assumes the target moves the same fixed amount every CHECK, regardless of how fast the checks happen.', p: { fixedmistake: 'bad' } },
      { c: 'Usopp corrects them: scale movement by how much REAL TIME actually passed since the last check, not by a fixed per-check amount.', p: { deltafix: 'good' } },
      { c: 'Every cycle, he checks whether his shot\'s position actually overlaps the target closely enough to count.', p: { hit: 'good' }, a: { nami: [82, 30] } }
    ]
  },
  conceptFlow: {
    title: 'From the continuous game loop to Canvas, delta time, and a complete update/render cycle',
    intro: 'Click any box to jump to it, or press Play.',
    stages: [
      {
        label: 'The loop',
        nodes: [
          { id: 'continuous', text: 'continuous, not event-driven --\nruns regardless of user input' },
          { id: 'animationtimer', text: 'AnimationTimer.handle(now):\ncalled ~60x/sec, on the FX thread' }
        ]
      },
      {
        label: 'Canvas',
        nodes: [
          { id: 'immediatemode', text: 'immediate mode: drawing is\nforgotten instantly, unlike the Scene Graph' },
          { id: 'redrawall', text: 'clearRect, then redraw\nEVERYTHING, every single frame' }
        ]
      },
      {
        label: 'Delta time',
        nodes: [
          { id: 'naivebug', text: 'naive: fixed movement PER FRAME\n-- speed depends on frame rate' },
          { id: 'deltatime', text: 'fixed: movement scaled by\nREAL ELAPSED TIME per frame' }
        ]
      },
      {
        label: 'Input & collision',
        nodes: [
          { id: 'inputflags', text: 'key events set simple flags;\nthe update step reads them' },
          { id: 'collision', text: 'squared-distance collision check,\nrun every frame' }
        ]
      }
    ],
    steps: [
      { active: ['continuous'], note: 'A game loop runs continuously, whether or not the user has done anything recently -- fundamentally different from an event-driven UI.' },
      { active: ['animationtimer'], note: 'AnimationTimer.handle(now) is called automatically by JavaFX, on the Application Thread, roughly 60 times per second.' },
      { active: ['immediatemode'], note: 'Canvas drawing calls are forgotten the instant they happen -- nothing persists automatically the way a Scene Graph Node does.' },
      { active: ['redrawall'], note: 'Every frame must clear the canvas and redraw every currently-visible game object from scratch, using the game\'s own remembered state.' },
      { active: ['naivebug'], note: 'Moving a fixed amount every frame makes the game\'s actual speed depend entirely on how fast frames happen to arrive -- inconsistent across different hardware.' },
      { active: ['deltatime'], note: 'Scaling movement by the real elapsed time since the last frame keeps the game\'s actual speed consistent regardless of frame rate.' },
      { active: ['inputflags'], note: 'Keyboard events set simple boolean flags; the update step reads those flags each frame and moves the player accordingly, scaled by delta time.' },
      { active: ['collision'], note: 'A cheap squared-distance check run every frame detects whether a falling item and the player currently overlap.' }
    ]
  },
  tech: [
    {
      q: 'A game moves a falling item with `item.y += 3;` inside handle(now), with no reference to delta time at all. Explain precisely why this game runs at different actual speeds on different machines, even though the code itself never changes.',
      a: 'AnimationTimer.handle(now) is called once per FRAME, and how MANY frames actually occur per second of real time varies by hardware, display refresh rate, and current system load — a fast machine with a 144Hz display might call handle(...) roughly 144 times per real second; a slower machine, or one under heavier load, might only manage 30 times per real second. Since `item.y += 3` moves the item by a FIXED amount every single CALL to handle(...), regardless of how much real time elapsed between calls, the item\'s ACTUAL real-world falling speed is a direct function of how many times per second handle(...) happens to be called: at 144 calls/second, the item moves 3 × 144 = 432 pixels of real, actual screen distance every real second; at 30 calls/second, it only moves 3 × 30 = 90 pixels per real second — nearly FIVE TIMES SLOWER in real, perceived gameplay terms, purely because of a hardware/performance difference that has nothing to do with the game\'s own logic or the developer\'s intent at all. This means the exact same game genuinely PLAYS differently — items fall faster or slower, a level feels easier or harder — purely based on what hardware it happens to run on, an outcome no game designer actually wants; the fix (this lesson\'s delta-time pattern, `item.y += fallSpeed * deltaSeconds`) ties the item\'s movement to a genuine PHYSICAL RATE (pixels per real second) rather than an arbitrary PER-CALL amount, making the game\'s actual behavior consistent regardless of how fast or slow handle(...) happens to be invoked on any given machine.'
    },
    {
      q: 'Explain precisely why game objects in this lesson\'s code (Player, FallingItem) use plain mutable fields rather than javafx-desktop\'s JavaFX properties (StringProperty, IntegerProperty, etc.), tracing the reasoning to what properties/bindings actually exist to solve.',
      a: 'javafx-desktop\'s property/binding system exists specifically to solve ONE problem: automatically keeping a piece of DISPLAYED UI in sync with underlying data, without the developer needing to remember to manually call a "now update the display" method every single time that data changes — the entire VALUE of a binding is that it eliminates a manual synchronization step by making the framework handle it automatically, reactively, whenever the underlying property changes. A game loop, by contrast, ALREADY unconditionally redraws EVERY visible game object, from scratch, every single frame, regardless of whether anything actually changed since the last frame — there is no "sometimes I forget to update the display" risk here to protect against at all, since the render step runs completely unconditionally on a fixed schedule; using a property specifically to trigger a re-render, when a re-render was ALREADY going to happen this frame regardless, adds real overhead (a JavaFX property\'s change-notification machinery is genuinely more expensive per-write than a plain field assignment) for a benefit — "notify something that a value changed so it can re-render" — the game loop doesn\'t actually need, since it re-renders unconditionally anyway. Given that game objects\' positions typically change every SINGLE frame (potentially 60+ times per second, for potentially many objects simultaneously), and none of that machinery is providing any actual value in this specific context, plain mutable fields (`double x, y;` with direct assignment) are the correct, lower-overhead choice — reserving JavaFX\'s property/binding system specifically for the parts of an application where its actual value proposition (avoiding manual re-render bugs for data that changes at UNPREDICTABLE, EVENT-DRIVEN moments, like javafx-desktop\'s status label) genuinely applies.'
    },
    {
      q: 'A collision check computes `double distance = Math.sqrt(dx*dx + dy*dy); if (distance < r1 + r2) { ... }` for every falling item against the player, every single frame, with potentially dozens of active items at once. Explain precisely what the squared-distance optimization this lesson mentions changes, and why it\'s correct (not just faster).',
      a: 'The squared-distance version replaces this with `double distanceSquared = dx*dx + dy*dy; if (distanceSquared < (r1+r2)*(r1+r2)) { ... }` — entirely avoiding the `Math.sqrt(...)` call, which is a measurably more expensive operation than simple multiplication and addition, especially when this check runs potentially dozens of times PER FRAME (once per active falling item), 60 times per second — a real, compounding cost across a busy frame with many active objects. This optimization is CORRECT, not merely faster, because of a basic property of the square root function relevant here: for any two NON-NEGATIVE numbers a and b, `a < b` is true if and only if `sqrt(a) < sqrt(b)` is ALSO true — square root is a strictly increasing function over non-negative numbers, meaning it preserves ORDERING relationships exactly; comparing the SQUARED distance against the SQUARED sum-of-radii produces the EXACT SAME true/false result as comparing the actual, square-rooted distance against the actual sum-of-radii, without ever needing to compute the (expensive) square root at all — the two comparisons are mathematically GUARANTEED equivalent, not merely approximately similar. This is a genuinely common, real-world pattern in game and graphics code specifically: whenever a computation\'s ONLY use is a comparison against another value (rather than needing the actual distance value itself for some other purpose, like displaying it as a number), skip the expensive operation (square root, in this case) and compare the CHEAPER, order-preserving version instead — a small, easily-overlooked optimization that adds up meaningfully across code paths executed many times per second.'
    },
    {
      q: 'A developer wants to add a "pause" feature: pressing P should freeze all game motion (falling items stop moving) but the game window should remain fully responsive (still redrawing, still processing other input) rather than becoming frozen or unresponsive. Design, precisely, how this should be implemented using this lesson\'s update/render separation, and explain why simply calling `timer.stop()` when P is pressed is a worse solution.',
      a: 'The precise, correct implementation adds a single boolean field, `isPaused`, toggled by the P keypress handler — and the UPDATE step (moving items, checking collisions, spawning new items) is made CONDITIONAL on `!isPaused` (skipped entirely while paused), while the RENDER step continues to run UNCONDITIONALLY, every single frame, regardless of the pause state — this means the screen keeps showing the current (now frozen, unmoving) game state clearly and continuously, the player\'s "P to unpause" keypress is still being actively listened for and processed (since input handling and the overall handle(now) call itself are unaffected by isPaused), and the whole application remains visually and interactively alive, just with the actual GAME SIMULATION specifically halted. Calling `timer.stop()` instead would be a meaningfully WORSE solution for a precise, concrete reason: stopping the AnimationTimer entirely means handle(now) is NEVER CALLED AGAIN until something explicitly calls timer.start() again — but the KEYBOARD EVENT HANDLER that\'s supposed to detect the "unpause" keypress and call timer.start() again is a COMPLETELY SEPARATE piece of code (registered via scene.setOnKeyPressed, independent of AnimationTimer entirely) that WOULD, in fact, still fire correctly even with the timer stopped, since key event handling doesn\'t depend on the game loop being active at all — so functionally, `timer.stop()`/`timer.start()` toggled by a keypress WOULD technically work for a simple pause/unpause toggle. But it is still the WEAKER design for a real, extensible game: any additional UI that should remain visually LIVE while paused (an animated "PAUSED" overlay, a subtly pulsing icon, anything requiring the render step to keep running even while the actual simulation is frozen) becomes impossible with `timer.stop()`, since NOTHING at all runs per-frame once the timer is stopped, render included — the isPaused-flag approach, by contrast, naturally and cleanly supports "simulation frozen, but rendering (and therefore any paused-state visual polish) continues," a strictly more flexible and more correct separation of concerns, directly reflecting this lesson\'s own update-vs-render distinction rather than conflating "pause the simulation" with "stop the entire loop, rendering included."'
    }
  ],
  code: {
    title: 'Nami\'s Berry Catcher: a complete game loop with delta time, input, and collision detection',
    intro: 'A full, playable JavaFX Canvas game — a player-controlled basket catching falling Berry treasure while dodging cannonballs, driven by an AnimationTimer computing delta time each frame, updating plain mutable game objects, and redrawing the entire scene from scratch every frame.',
    code: `import javafx.animation.AnimationTimer;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.stage.Stage;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

class Player {
    double x = 300, y = 550;
    double width = 60, height = 20;
    double speed = 350;   // pixels per SECOND, not per frame
}

class FallingItem {
    double x, y;
    double radius = 12;
    double fallSpeed;      // pixels per second
    boolean isTreasure;    // true = Berry (catch it); false = cannonball (dodge it)

    FallingItem(double x, double fallSpeed, boolean isTreasure) {
        this.x = x;
        this.y = -20;
        this.fallSpeed = fallSpeed;
        this.isTreasure = isTreasure;
    }
}

public class BerryCatcherApp extends Application {
    private final Player player = new Player();
    private final List<FallingItem> items = new ArrayList<>();
    private final Random random = new Random();

    private boolean movingLeft = false;
    private boolean movingRight = false;
    private int score = 0;
    private boolean gameOver = false;
    private double timeSinceLastSpawn = 0;

    private long lastFrameTime = -1;

    @Override
    public void start(Stage stage) {
        Canvas canvas = new Canvas(600, 600);
        GraphicsContext gc = canvas.getGraphicsContext2D();

        Scene scene = new Scene(new Pane(canvas), 600, 600);
        scene.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.LEFT) movingLeft = true;
            if (e.getCode() == KeyCode.RIGHT) movingRight = true;
        });
        scene.setOnKeyReleased(e -> {
            if (e.getCode() == KeyCode.LEFT) movingLeft = false;
            if (e.getCode() == KeyCode.RIGHT) movingRight = false;
        });

        new AnimationTimer() {
            @Override
            public void handle(long now) {
                if (lastFrameTime < 0) { lastFrameTime = now; return; }   // skip the very first frame
                double deltaSeconds = (now - lastFrameTime) / 1_000_000_000.0;
                lastFrameTime = now;

                if (!gameOver) {
                    update(deltaSeconds);
                }
                render(gc);
            }
        }.start();

        stage.setScene(scene);
        stage.setTitle("Berry Catcher");
        stage.show();
    }

    private void update(double deltaSeconds) {
        // --- move the player, scaled by delta time -- NOT a fixed amount per frame ---
        if (movingLeft) player.x -= player.speed * deltaSeconds;
        if (movingRight) player.x += player.speed * deltaSeconds;
        player.x = Math.max(0, Math.min(540, player.x));   // keep the player on screen

        // --- spawn new items on a timer ---
        timeSinceLastSpawn += deltaSeconds;
        if (timeSinceLastSpawn > 0.8) {
            timeSinceLastSpawn = 0;
            boolean isTreasure = random.nextDouble() < 0.7;   // 70% treasure, 30% cannonball
            items.add(new FallingItem(random.nextDouble() * 570, 150 + random.nextDouble() * 100, isTreasure));
        }

        // --- move every item, and check collisions with the player ---
        Iterator<FallingItem> iterator = items.iterator();
        while (iterator.hasNext()) {
            FallingItem item = iterator.next();
            item.y += item.fallSpeed * deltaSeconds;

            double playerCenterX = player.x + player.width / 2;
            double playerCenterY = player.y + player.height / 2;
            double dx = item.x - playerCenterX;
            double dy = item.y - playerCenterY;
            double collisionDistance = item.radius + player.width / 2;

            if (dx * dx + dy * dy < collisionDistance * collisionDistance) {   // squared-distance check
                if (item.isTreasure) {
                    score += 10;
                } else {
                    gameOver = true;
                }
                iterator.remove();
            } else if (item.y > 620) {
                iterator.remove();   // missed -- fell off the bottom of the screen
            }
        }
    }

    private void render(GraphicsContext gc) {
        gc.clearRect(0, 0, 600, 600);   // Canvas remembers NOTHING -- redraw everything, every frame

        gc.setFill(Color.SADDLEBROWN);
        gc.fillRect(player.x, player.y, player.width, player.height);

        for (FallingItem item : items) {
            gc.setFill(item.isTreasure ? Color.GOLD : Color.BLACK);
            gc.fillOval(item.x - item.radius, item.y - item.radius, item.radius * 2, item.radius * 2);
        }

        gc.setFill(Color.WHITE);
        gc.setFont(new Font(20));
        gc.fillText("Score: " + score, 10, 30);
        if (gameOver) {
            gc.fillText("GAME OVER", 250, 300);
        }
    }

    public static void main(String[] args) { launch(args); }
}`,
    notes: [
      'Player and FallingItem use plain mutable double fields, not JavaFX properties -- these values change every single frame, and render() redraws everything unconditionally regardless, so property-based change notification would add cost with no benefit here.',
      'player.speed and item.fallSpeed are both expressed as "pixels per SECOND" -- multiplying by deltaSeconds each frame is what makes the game run at the same real-world speed regardless of frame rate.',
      'movingLeft/movingRight are simple booleans set by key event handlers and READ inside update() -- the event handlers never move the player directly, keeping all actual movement logic inside the loop\'s own delta-time-scaled update step.',
      'The collision check compares dx*dx + dy*dy against collisionDistance*collisionDistance directly -- avoiding Math.sqrt() for a check run against potentially many items, every single frame.'
    ]
  },
  lab: {
    title: 'Add a difficulty ramp and a power-up item to Berry Catcher',
    prompt: 'Extend the <code>BerryCatcherApp</code> code demo: (1) add a field <code>double gameTimeSeconds = 0;</code> that accumulates <code>deltaSeconds</code> every frame inside <code>update(double deltaSeconds)</code>; (2) change the spawn-interval check so newly-spawned items use a fall speed that increases over time — spawn each <code>FallingItem</code> with fall speed <code>150 + gameTimeSeconds * 5</code> instead of the original fixed range, so the game gets harder the longer it runs; (3) add a method <code>private boolean isFarEnoughFromPlayer(FallingItem item)</code> that returns <code>true</code> if the item\'s current distance to the player\'s center is greater than <code>100</code> (using the squared-distance pattern from the code demo, no <code>Math.sqrt</code>), intended to be checked before spawning a power-up too close to the player.',
    starter: `// Add these to BerryCatcherApp

// TODO 1: add "double gameTimeSeconds = 0;" as a field

// Inside update(double deltaSeconds), TODO: accumulate gameTimeSeconds += deltaSeconds
// and change the spawn line to use fall speed: 150 + gameTimeSeconds * 5

// TODO 3: add this method
private boolean isFarEnoughFromPlayer(FallingItem item) {
    // TODO: compute dx, dy from item's position to the player's CENTER (player.x + player.width/2, player.y + player.height/2)
    // TODO: return true if dx*dx + dy*dy > 100*100, using squared distance (no Math.sqrt)
}`,
    checks: [
      { re: 'double\\s+gameTimeSeconds\\s*=\\s*0\\s*;', must: true, hint: 'Add the field: double gameTimeSeconds = 0;', pass: 'gameTimeSeconds field added ✓' },
      { re: 'gameTimeSeconds\\s*\\+=\\s*deltaSeconds', must: true, hint: 'Accumulate gameTimeSeconds += deltaSeconds inside update().', pass: 'gameTimeSeconds accumulated ✓' },
      { re: '150\\s*\\+\\s*gameTimeSeconds\\s*\\*\\s*5', must: true, hint: 'Spawn new items with fall speed 150 + gameTimeSeconds * 5.', pass: 'difficulty-ramped fall speed used ✓' },
      { re: 'private\\s+boolean\\s+isFarEnoughFromPlayer\\s*\\(\\s*FallingItem\\s+item\\s*\\)', must: true, hint: 'Declare private boolean isFarEnoughFromPlayer(FallingItem item).', pass: 'isFarEnoughFromPlayer method declared ✓' },
      { re: 'dx\\s*\\*\\s*dx\\s*\\+\\s*dy\\s*\\*\\s*dy\\s*>\\s*100\\s*\\*\\s*100', must: true, hint: 'Return dx*dx + dy*dy > 100*100 (squared-distance comparison, no Math.sqrt).', pass: 'squared-distance comparison used ✓' },
      { re: 'Math\\.sqrt', must: false, hint: 'Do not use Math.sqrt -- use the squared-distance comparison pattern instead.', pass: 'no Math.sqrt used ✓' }
    ],
    run: 'mvn javafx:run — as the game runs longer, newly-spawned items should visibly fall faster, and isFarEnoughFromPlayer should correctly report false for any point within 100 pixels of the player\'s center, true otherwise, with no square root computed anywhere.',
    solution: `// Field
double gameTimeSeconds = 0;

// Inside update(double deltaSeconds), near the top:
gameTimeSeconds += deltaSeconds;

// Spawn line, updated:
items.add(new FallingItem(random.nextDouble() * 570, 150 + gameTimeSeconds * 5, isTreasure));

// New method
private boolean isFarEnoughFromPlayer(FallingItem item) {
    double playerCenterX = player.x + player.width / 2;
    double playerCenterY = player.y + player.height / 2;
    double dx = item.x - playerCenterX;
    double dy = item.y - playerCenterY;
    return dx * dx + dy * dy > 100 * 100;
}`,
    notes: [
      'gameTimeSeconds accumulates real elapsed seconds using the same deltaSeconds already computed each frame -- it is itself frame-rate independent, exactly like the movement it drives.',
      'The difficulty ramp (150 + gameTimeSeconds * 5) is a genuine physical rate increasing over real time, not a per-frame or per-spawn counter -- the game gets harder at the same real-world pace regardless of frame rate.',
      'isFarEnoughFromPlayer reuses the exact squared-distance collision pattern from the code demo -- the same correctness argument (squaring preserves ordering, avoiding an unnecessary Math.sqrt call) applies here too.'
    ]
  },
  quiz: [
    {
      q: 'Why does a game need a continuous game loop rather than javafx-desktop\'s event-driven model of only running code in response to a click?',
      options: ['Game elements (falling items, moving enemies) need to keep updating and the screen needs to keep redrawing continuously, whether or not the player has interacted recently -- an event-driven model only runs code in reaction to specific events, with nothing happening in between', 'Event-driven code is technically impossible to combine with any drawing operations in JavaFX', 'A game loop is only needed for games with more than one player', 'AnimationTimer is required by the Java language for any application using Canvas'],
      correct: 0,
      explain: 'A game\'s state (falling items, timers, enemy movement) must keep advancing continuously, independent of user input -- an event-driven model, which only reacts to specific user actions, cannot provide this on its own.'
    },
    {
      q: 'What is the key difference between Canvas\'s drawing model and the Scene Graph\'s model from javafx-desktop?',
      options: ['Canvas is immediate-mode: a drawing call is forgotten instantly and must be repeated every frame to remain visible; the Scene Graph is retained-mode: a Node persists and JavaFX automatically redraws it', 'Canvas and the Scene Graph are two names for exactly the same underlying rendering mechanism', 'The Scene Graph can only display text, while Canvas can only display shapes', 'Canvas requires a separate JavaFX license, while the Scene Graph does not'],
      correct: 0,
      explain: 'Canvas drawing calls affect only the current frame and are not remembered -- everything must be redrawn every frame from the game\'s own tracked state. The Scene Graph, by contrast, retains Nodes and automatically re-renders them as needed.'
    },
    {
      q: 'A game moves an object with `x += 5;` inside every call to AnimationTimer.handle(now), with no reference to elapsed time. What problem does this cause?',
      options: ['The object\'s actual real-world movement speed depends entirely on how many times per second handle() happens to be called, making the game run at inconsistent speeds on different hardware or frame rates', 'This code will fail to compile, since AnimationTimer requires delta time to be used explicitly', 'Nothing -- this is the correct, standard way to move objects in a JavaFX game', 'The object will move in a random direction instead of consistently to the right'],
      correct: 0,
      explain: 'Moving a fixed amount per FRAME rather than per unit of real TIME ties the object\'s actual speed to the frame rate, which varies by hardware and system load -- producing inconsistent gameplay speed across different machines.'
    },
    {
      q: 'Why does this lesson use plain mutable fields (double x, y) for game objects instead of JavaFX properties (StringProperty, etc.)?',
      options: ['The render step already redraws everything unconditionally every frame, so property-based change notification (whose value is triggering an automatic re-render) provides no benefit here while adding real per-write overhead', 'JavaFX properties cannot legally be used inside a class that is not a Controller', 'Plain fields are required specifically when using AnimationTimer, by API restriction', 'JavaFX properties can only hold String values, never numeric values like coordinates'],
      correct: 0,
      explain: 'Properties exist to trigger automatic re-rendering when a value changes -- but a game loop already re-renders everything unconditionally every frame, making that notification machinery unnecessary overhead for data that changes constantly anyway.'
    },
    {
      q: 'Why does a collision check compare `dx*dx + dy*dy < r*r` instead of `Math.sqrt(dx*dx + dy*dy) < r`, and why are both approaches correct?',
      options: ['Since square root is a strictly increasing function for non-negative numbers, comparing squared values produces the identical true/false result as comparing the square-rooted values, while avoiding the more expensive Math.sqrt computation', 'Only the squared-distance version is mathematically correct; the square-root version produces wrong results', 'Math.sqrt cannot be called from inside an AnimationTimer\'s handle() method', 'The two approaches produce different results, and the squared version is simply an acceptable approximation'],
      correct: 0,
      explain: 'Both approaches are mathematically equivalent and produce identical true/false results, since squaring preserves ordering for non-negative numbers -- but the squared-distance version avoids computing an expensive square root for a check that only needs a comparison.'
    }
  ],
  testFlow: {
    title: 'Test yourself: the game loop, delta time, and Canvas\'s immediate-mode model',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'A game draws a player character with gc.fillRect(...) inside render(), called every frame. The player never moves. Does gc.fillRect(...) need to be called again on every single frame, even though nothing about the player has changed?',
        choices: [
          { text: 'Yes -- Canvas is immediate-mode and forgets every drawing call instantly; the player would disappear from view the very next frame if fillRect isn\'t called again, regardless of whether its position actually changed', to: 'q1_right' },
          { text: 'No -- once drawn, a shape on a Canvas persists automatically across frames until explicitly cleared', to: 'q1_wrong_persists' },
          { text: 'No, but only if the player object uses JavaFX properties instead of plain fields', to: 'q1_wrong_properties' }
        ]
      },
      q1_right: { end: true, correct: true, text: 'Correct -- Canvas\'s immediate-mode model means every drawing call only affects the CURRENT frame. Even an unchanged, motionless player must be redrawn every single frame or it will vanish from the very next one.', next: 'q2' },
      q1_wrong_persists: { end: true, correct: false, text: 'This describes the Scene Graph\'s retained-mode behavior, not Canvas\'s. Canvas drawing calls are forgotten the instant the frame is done -- nothing persists automatically at all, regardless of whether the object changed.', retry: 'q1' },
      q1_wrong_properties: { end: true, correct: false, text: 'JavaFX properties have no relationship to Canvas\'s drawing model at all -- properties trigger automatic re-rendering of Scene Graph Nodes specifically, which has nothing to do with how Canvas drawing calls behave.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'A game runs at 30 FPS on one machine and 60 FPS on another. With proper delta-time-based movement (position += speed * deltaSeconds), does the game\'s actual, real-world speed differ between the two machines?',
        choices: [
          { text: 'No -- delta time scales each frame\'s movement by the actual elapsed real time, so the object reaches the same real-world position after the same real-world duration regardless of how many frames that took', to: 'q2_right' },
          { text: 'Yes -- the 60 FPS machine will always show the game running exactly twice as fast, even with delta time applied correctly', to: 'q2_wrong_stillfaster' },
          { text: 'Yes -- delta time only affects rendering smoothness, not actual game logic speed', to: 'q2_wrong_onlyvisual' }
        ]
      },
      q2_right: { end: true, correct: true, text: 'Correct -- this is precisely the point of delta-time-based movement: the 30 FPS machine\'s fewer frames each cover a proportionally LARGER elapsed time, and the 60 FPS machine\'s more frequent frames each cover a proportionally SMALLER elapsed time, but the total real-world movement over one real second ends up the same either way.', next: 'q3' },
      q2_wrong_stillfaster: { end: true, correct: false, text: 'This is exactly the naive, frame-rate-DEPENDENT bug delta time is specifically designed to fix -- with delta time correctly applied, the real-world speed is consistent regardless of frame rate.', retry: 'q2' },
      q2_wrong_onlyvisual: { end: true, correct: false, text: 'Delta time affects the ACTUAL game logic\'s movement calculations directly (position += speed * deltaSeconds), not merely visual smoothness -- it is the mechanism that makes the underlying simulation speed itself consistent.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'A "pause" feature sets isPaused = true and skips the update() call entirely while paused, but still calls render() every frame. What is the benefit of this design over calling AnimationTimer.stop()?',
        choices: [
          { text: 'The game keeps rendering (and could show an animated "PAUSED" overlay or similar) and keeps processing input (like the unpause key) even while paused, since only the simulation-advancing update step is skipped, not the entire per-frame cycle', to: 'q3_right' },
          { text: 'There is no real benefit -- both approaches are functionally identical in every way', to: 'q3_wrong_identical' },
          { text: 'timer.stop() would cause the application to crash immediately, making the isPaused flag the only valid approach', to: 'q3_wrong_crash' }
        ]
      },
      q3_right: { end: true, correct: true, text: 'Correct -- skipping just the update step (not the whole handle() call) keeps rendering and input handling fully alive during a pause, supporting a live "PAUSED" overlay or similar, which stopping the entire timer would make impossible.', next: null },
      q3_wrong_identical: { end: true, correct: false, text: 'They are not identical -- stopping the timer entirely halts BOTH update and render, and would also halt anything else meant to run every frame (like an animated pause overlay), while the isPaused-flag approach only halts the simulation-advancing logic.', retry: 'q3' },
      q3_wrong_crash: { end: true, correct: false, text: 'Calling timer.stop() does not crash an application -- it simply stops handle() from being called again until timer.start() is called. The real difference is in what capabilities each approach preserves during the pause, not stability.', retry: 'q3' }
    }
  },
  pitfalls: [
    'Moving game objects by a fixed amount per frame instead of scaling by delta time -- makes the game\'s actual speed depend on frame rate, which varies across hardware and system load.',
    'Forgetting to redraw an unchanged object because "it didn\'t move" -- Canvas is immediate-mode and forgets every drawing call instantly; an object not redrawn this frame simply disappears, regardless of whether its position actually changed.',
    'Moving the player directly inside a keyboard event handler instead of setting a flag read by the update step -- couples movement to the asynchronous timing of key events rather than the game loop\'s own consistent, delta-time-scaled cadence.',
    'Using JavaFX properties for fast-changing game object state (position, velocity) -- adds real per-write overhead for data the render step already redraws unconditionally every frame regardless of any change notification.',
    'Computing an actual square root for a collision check that only needs a true/false comparison -- comparing squared distances produces the identical result without the more expensive Math.sqrt call, especially costly when checked against many objects every single frame.',
    'Calling timer.stop() for a "pause" feature instead of a simulation-only isPaused flag -- halts rendering and input processing entirely, making it impossible to keep the UI visually alive (an animated pause overlay, responsive unpause input) during the pause.'
  ],
  interview: [
    {
      q: 'A junior developer implements a game loop using `while (true) { update(); render(); }` in a plain loop with no AnimationTimer or frame-rate awareness at all, running as fast as the CPU physically allows. Evaluate this approach and its concrete problems.',
      a: 'This runs into several genuine, concrete problems this lesson\'s material directly explains. First, and most seriously: without any delta-time calculation at all, this suffers the EXACT naive frame-rate-dependent movement bug this lesson builds its whole delta-time argument around — running as fast as the CPU allows, with no frame-rate cap, means the loop could execute update() literally thousands of times per second on a fast machine (however many iterations the CPU can physically complete), and only a few hundred times per second on a slower one, making the game\'s actual behavior wildly, unpredictably different across hardware unless delta time is computed and applied correctly regardless — the RAW loop structure alone doesn\'t fix this; delta time still needs to be measured and used, exactly as this lesson\'s AnimationTimer-based version does. Second, running with NO frame-rate cap at all wastes real CPU/GPU resources for no benefit — rendering the SAME visual frame 3000 times per second provides zero additional value to a human eye that can\'t perceive updates faster than roughly 60-144 times per second depending on the display, while burning battery on a laptop and generating unnecessary heat for genuinely no improvement in the actual experience; AnimationTimer, by contrast, is synchronized with the DISPLAY\'s own actual refresh rate specifically to avoid this waste, only calling handle() as often as the display can actually show something new. Third, calling render() directly inside a synchronous while loop like this, on WHATEVER thread runs that loop, risks the exact JavaFX Application Thread violation the previous lesson (javafx-desktop) built real depth around — if this loop runs on a thread other than the Application Thread, every single render() call is a thread-safety violation touching the Scene Graph/Canvas from the wrong thread; AnimationTimer\'s handle() is specifically guaranteed to be called ON the correct thread automatically, a guarantee a raw while-loop provides no equivalent of at all unless the developer manually, carefully ensures it runs on the right thread themselves.'
    },
    {
      q: 'Design (in words) how you would add a second, independently-moving obstacle type to Berry Catcher — a cannonball that moves diagonally (both x and y changing over time) rather than straight down — using this lesson\'s existing update/render structure, and explain what would need to change versus staying the same.',
      a: 'The FallingItem class would need an additional field to represent horizontal movement — say, `double horizontalSpeed;` (pixels per second, following the same "physical rate, not per-frame amount" convention every other speed value in this lesson already uses) — set to 0 for the existing straight-down items (treasure and plain cannonballs) and to some nonzero value (positive or negative, for rightward or leftward diagonal drift) for the new diagonal-cannonball type; a boolean or enum field distinguishing the item TYPE (rather than just the existing isTreasure boolean, which would need to become a more general type indicator — an enum ItemType { TREASURE, CANNONBALL, DIAGONAL_CANNONBALL } is the cleaner fix here, directly connecting back to records-sealed-pattern-matching\'s argument for using a proper enum/sealed type over a growing pile of loosely-related boolean flags once more than two categories exist). In update(), the movement logic changes from `item.y += item.fallSpeed * deltaSeconds;` alone to ALSO include `item.x += item.horizontalSpeed * deltaSeconds;` for every item — this is a natural, minimal extension of the EXISTING delta-time-scaling pattern, not a new concept at all, since horizontal movement scales by delta time using the exact same reasoning vertical movement already does. The COLLISION detection logic requires NO changes whatsoever — it already computes distance based on the item\'s CURRENT x AND y position against the player\'s center, regardless of HOW that item arrived at its current position, so a diagonally-moving item colliding correctly with the player "just works" using the existing squared-distance check with zero modification. The RENDER step similarly requires no structural change — it already draws every item at its current x,y position, whatever that position happens to be, using whatever color/shape corresponds to its type. The key insight worth stating explicitly: this lesson\'s update/render separation, with all game objects driven by delta-time-scaled movement of their own tracked position fields, is genuinely EXTENSIBLE to much more complex, varied movement patterns (diagonal, circular, following a curve, homing toward the player) with changes ISOLATED almost entirely to the update step\'s movement calculation for that specific object type — the render and collision logic, built around "wherever this object\'s CURRENT position happens to be," remain correct and unchanged regardless of how elaborate that position\'s own movement rule becomes.'
    },
    {
      q: 'A game shows visibly "jerky," inconsistent movement — objects appear to speed up and slow down unpredictably — even though the delta-time formula (position += speed * deltaSeconds) is implemented correctly. Diagnose several DIFFERENT possible root causes, distinguishing genuine delta-time bugs from other categories of problem entirely.',
      a: 'Several genuinely distinct root causes can produce this symptom, and distinguishing them matters for finding the right fix. First, and worth ruling OUT explicitly given the premise states delta time IS implemented correctly: a jerky feel is NOT necessarily a delta-time bug at all — if the actual FRAME RATE ITSELF is genuinely fluctuating a lot (say, oscillating between 30 and 90 FPS due to inconsistent system load), delta-time-scaled movement will correctly keep the AVERAGE real-world speed consistent over time, but INDIVIDUAL frames will still cover very different amounts of both time AND therefore movement distance from each other — a large, sudden fluctuation in frame timing can still LOOK visually jerky even with mathematically correct delta-time scaling, since the human eye is sensitive to frame-to-frame CONSISTENCY, not just long-run average speed; the underlying fix here is investigating WHY the frame rate itself is unstable (an expensive operation happening inside update() or render() some frames but not others, garbage collection pauses from excessive allocation inside the game loop, background threads contending for CPU) rather than anything about the delta-time formula itself. Second: a genuine BUG in the delta-time calculation itself — computing `now - lastFrameTime` but forgetting to actually UPDATE `lastFrameTime = now` at the end of each frame (using a STALE, unchanging reference point) produces an ever-GROWING deltaSeconds value each frame, causing objects to accelerate more and more over time rather than moving at a consistent rate — a specific, checkable bug distinct from general frame-rate instability. Third: MIXING delta-time-scaled and NON-delta-time-scaled movement within the SAME object inconsistently — say, correctly scaling vertical fall speed by deltaSeconds but accidentally leaving a horizontal "drift" calculation as a fixed per-frame amount somewhere else in the same update() method — produces movement that\'s correctly consistent in one axis but frame-rate-DEPENDENT (and therefore inconsistent-feeling) in the other, a subtle, easy-to-miss category of partial delta-time bug worth specifically checking for by auditing EVERY movement-affecting line in update(), not just the most obvious ones.'
    },
    {
      q: 'Compare this lesson\'s hand-built JavaFX Canvas game loop with what cross-platform-games-libgdx (next lesson) will show using a dedicated game framework. What does a framework like libGDX actually automate on top of the update/render pattern this lesson builds by hand, and what stays conceptually the same?',
      a: 'What stays conceptually IDENTICAL, and is worth stating precisely, is the CORE PATTERN itself: an UPDATE phase advancing game state by some amount of elapsed (delta) time, and a RENDER phase drawing the current state, repeating continuously — this is not something libGDX reinvents or does differently in kind, it is the exact same foundational structure this lesson builds by hand against raw JavaFX Canvas/AnimationTimer, just expressed through a more full-featured framework\'s own APIs instead. What a dedicated framework typically automates ON TOP of this shared core: sprite/texture management (loading and efficiently drawing images rather than this lesson\'s simple filled shapes, including texture atlasing for performance — batching many small images into fewer actual GPU draw calls, a real optimization concern at any nontrivial scale this lesson\'s simple demo doesn\'t need to address); a scene/stage abstraction with built-in UI widgets, layout, and input handling more elaborate than this lesson\'s raw keyboard-flag pattern; audio playback management; and, MOST relevant to that lesson\'s own title ("one codebase for desktop, web, and mobile") — an abstraction layer over PLATFORM-SPECIFIC rendering and input APIs, so the SAME game code runs correctly whether the underlying platform is a desktop JVM (much like this lesson\'s own JavaFX target), a browser (via a different underlying rendering technology entirely), or a mobile device\'s touch-based input and different screen-size constraints — none of which this lesson\'s JavaFX-specific Canvas code could do at all, since JavaFX itself only targets desktop (and, with real caveats, mobile via Gluon, covered in Part 12). The precise, correct framing for a student moving from this lesson to the next: everything genuinely FOUNDATIONAL about how a real-time game actually works — the loop, delta time, plain mutable game state, collision detection — transfers directly and unchanged; what changes is the SPECIFIC API surface and the ADDED cross-platform abstraction a dedicated framework provides on top of that same foundation, not the foundation itself.'
    }
  ]
};
