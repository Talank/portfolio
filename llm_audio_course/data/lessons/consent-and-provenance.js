window.LESSONS = window.LESSONS || {};
window.LESSONS['consent-and-provenance'] = {
  id: 'consent-and-provenance',
  title: 'A Voice Is an Identity: Consent, Provenance & Misuse',
  category: 'Part 4 — Privacy, Cloning & Ethics',
  timeMin: 35,
  summary: 'The last lesson gave you the power to clone a real person\'s voice locally and privately; this one is about using it without doing harm. A voice is part of someone\'s identity, and synthesizing speech in it means putting words in their mouth — so consent is not optional, it\'s the whole ballgame. This lesson makes the ethics concrete and buildable: get and record consent BEFORE cloning (scoped to specific uses), track provenance so you can always answer "whose voice is this and were we allowed to use it," label synthetic audio honestly, and design against the misuse the technology enables (fraud, impersonation, non-consensual content). The point isn\'t a lecture — it\'s that responsible practice is a set of concrete engineering habits you build into the pipeline, exactly like caching or normalization.',
  goals: [
    'State the core principle: a voice is an identity, so cloning a real person requires informed, scoped consent — before you clone',
    'Record consent and provenance as first-class data: whose voice, sample source, permitted uses, date',
    'Disclose synthetic audio honestly — label it, especially when others will hear it as "real"',
    'Design against misuse: recognize the fraud/impersonation/non-consensual risks the tech enables and refuse them',
    'Treat ethics as buildable engineering habits (consent gates, provenance records, disclosure) — not an afterthought'
  ],
  concept: [
    {
      h: 'A voice is an identity — so consent comes first',
      p: [
        'Everything in this lesson follows from one premise: <b>a person\'s voice is part of who they are.</b> It\'s tied to their identity as directly as their face or their name — people recognize each other by voice, trust each other by voice, are held accountable for what their voice says. So when you synthesize new speech in someone\'s voice, you are <b>putting words in their mouth</b>: making it sound like they said things they never said. That is an act with real consequences — it can be harmless (a friend voicing a character they agreed to play) or devastating (making someone appear to confess, endorse, threaten, or reveal), and the <i>technology is identical</i> in both cases. What separates them is <b>consent</b>.',
        'Hence the non-negotiable rule: <b>get informed consent before cloning a real person\'s voice, and scope it to specific uses.</b> "Informed" means the person understands what you\'re doing (synthesizing new speech in their voice) and what it could be used for. "Scoped" means the permission is for particular purposes — "you may use my voice for the narrator character in this one project" — not a blank check to make their voice say anything forever. And "before" matters: consent is a precondition, gathered up front, not a forgiveness you seek after. Crucially, the previous lesson\'s privacy win does <i>not</i> substitute for this — keeping the sample local protects the biometric <i>data</i>, but says nothing about whether the person agreed. Local answers "where does the data live"; consent answers "am I allowed to speak as this person at all," and only the second is about the ethics of the act.'
      ]
    },
    {
      h: 'Provenance: always be able to answer "whose voice, and were we allowed?"',
      p: [
        'Consent is worthless if you can\'t later demonstrate you had it, so consent must become <b>durable, first-class data</b>: <b>provenance</b>. For every voice you use — especially every clone — record who the voice belongs to, where the sample came from, what uses were permitted, and when consent was given. This turns "we probably had permission" into "here is the record: this is Alex\'s voice, sampled from a recording Alex made for us on this date, permitted for the narrator role in this project." It\'s the same discipline as the manifest from Part 3 — metadata attached to each artifact so you can always answer questions about it — applied to the ethical dimension: the provenance record lets you answer, at any point, "whose voice is this clip, and were we allowed to make it?"',
        'Provenance does real work beyond record-keeping. It <b>gates</b> usage: a voice with no consent record shouldn\'t be usable in the pipeline at all — make the consent field <i>required</i>, so an un-sourced voice is a hard error, not a silent default (this is exactly the deliberate blank left in the last lesson\'s cast entry). It supports <b>revocation</b>: if someone withdraws consent, provenance tells you exactly which clips and which cast entries derive from their voice, so you can remove them. And it enables <b>accountability</b>: if a question or dispute ever arises about a piece of audio, you can trace it to its source and its permission. Building provenance in is cheap — a few required fields per voice — and it converts good intentions into something verifiable and enforceable, which is what "responsible" actually means in practice: not a feeling, but a record you can produce.'
      ]
    },
    {
      h: 'Disclosure and designing against misuse',
      p: [
        'Two more habits complete responsible practice. First, <b>honest disclosure</b>: synthetic audio that others will hear should be <i>labeled</i> as synthetic, especially when it could be mistaken for a real recording of a real person. The reason is straightforward — people make decisions based on what they believe they heard, and letting them believe a synthesized clip is a genuine recording is a form of deception even if the content is benign. Labeling ("this narration is AI-generated," "synthetic voice") respects the listener\'s right to know what they\'re hearing. For clearly-fictional character voices in an obvious production this is light-touch; for anything that could be taken as a real person\'s real statement, disclosure is essential.',
        'Second, and most important: <b>design against the misuse the technology enables, and refuse it.</b> Local voice cloning is genuinely dual-use — the same capability that voices a consenting friend\'s character can be turned to <b>fraud</b> (a cloned voice authorizing a payment, "your CEO called"), <b>impersonation and misinformation</b> (making a public figure appear to say something), and <b>non-consensual content</b> (putting words in someone\'s mouth to harm or humiliate them). These aren\'t hypothetical edge cases; they\'re the predictable dark uses of exactly this tech, and going local <i>removes</i> the external gatekeeper — there\'s no cloud service\'s terms-of-use to stop you, so the restraint has to be yours. The engineering posture is: build the guardrails in (required consent, provenance, disclosure), and personally refuse the uses that harm — cloning someone who didn\'t agree, generating deceptive content, targeting a real person. The through-line of the whole lesson is that <b>ethics here is buildable</b>: consent gates, provenance records, and disclosure labels are concrete features you implement, right alongside caching and normalization. Responsible use isn\'t a disclaimer you bolt on at the end; it\'s designed into the pipeline, and ultimately it\'s owned by the person holding a tool this powerful — you.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'The Crew Sets Rules for the Mimic\'s Gift',
      text: [
        'The mimic from before offers to lend her voice-copying gift to the crew, and Robin — who trusts almost no power without rules — sits everyone down first. "Before anyone uses this, we agree how. Rule one: you may only copy a voice if that person SAID you could, knowing exactly what you\'ll do with it. Not \'they probably wouldn\'t mind.\' They agreed, out loud, for a specific purpose." Usopp: "That seems like a lot of ceremony for a party trick." Robin doesn\'t smile. "It stops being a party trick the moment you can make Nami appear to say she\'s betraying us, or make a marine confess to a crime he didn\'t commit. The gift can save us or destroy an innocent person. The only thing standing between those is whether we asked first."',
        'She writes it into the ship\'s log. "Rule two: every copied voice gets an ENTRY — whose it is, when they agreed, and what for. So if anyone ever asks \'did you have the right to make Franky say that,\' I can point to the page. And if Franky ever changes his mind, we find every recording made in his voice and destroy them, because the log tells us exactly which they are." Rule three, she adds, is honesty: "When we use a copied voice where others are listening, we SAY it\'s a copy. We don\'t let people believe they\'re hearing the real person unless they are." Sanji frowns. "And what stops someone from just... ignoring all this?" Robin meets his eyes. "Nothing but us. No admiral, no law, no service is watching this ship. The power is ours alone — which means the restraint has to be ours alone too. The rules don\'t enforce themselves. We enforce them, every single time, or they mean nothing." She closes the log. "A voice is a person. We don\'t get to be careless with a person."'
      ]
    },
    sitcom: {
      show: 'The Good Place',
      title: 'Chidi Draws the Line on the Voice Copier',
      text: 'Michael excitedly shows off a gadget that clones anyone\'s voice, and Eleanor immediately suggests using it to prank Tahani. Chidi, predictably, spirals — but lands somewhere useful. "Okay, okay — no. We can\'t just USE someone\'s voice. A voice is part of a person\'s identity; making it say things they didn\'t say is doing something TO them. So: we ask them first, and we\'re specific — \'can I use your voice for THIS.\' We write down who said yes and what for. And if we play it for anyone, we tell them it\'s fake." Eleanor: "That is so much paperwork for a joke." Chidi: "Because the exact same gadget that does a harmless joke can frame someone for a crime, and the only difference is whether we asked and were honest. There\'s no rule stopping us from misusing it — which is precisely why WE have to be the rule." Janet appears: "I can confirm there is no external enforcement here." Chidi: "See? It\'s on us." Michael, deflating slightly: "You have made a voice-changer gadget into an ethics seminar." Chidi: "That is genuinely the nicest thing you\'ve ever said to me."',
    },
    why: 'Robin and Chidi lay out this lesson\'s four habits exactly. Core premise: a voice is part of a person\'s identity, so cloning them does something TO them — which makes CONSENT, obtained first and scoped to a specific purpose, the whole ballgame ("they agreed, out loud, for a specific purpose"). PROVENANCE is the log/written record — whose voice, when they agreed, what for — which also enables REVOCATION (find every clip if they change their mind). DISCLOSURE is telling listeners it\'s a copy, not letting them believe it\'s the real person. And the misuse point is the sharpest: the identical tool does a harmless joke or frames someone, the difference is consent + honesty, and — because going local removes any external enforcer ("no admiral, no service is watching," "no external enforcement here") — the restraint has to be yours, enforced every time or the rules mean nothing.'
  },
  tech: [
    {
      q: 'Why is consent the central issue in voice cloning, and what does "informed, scoped, before" each add?',
      a: 'Consent is central because a voice is part of a person\'s identity — people are recognized, trusted, and held accountable by their voice — so synthesizing new speech in someone\'s voice is putting words in their mouth, making it sound like they said things they never said. That act can be harmless or devastating (making someone appear to confess, endorse, threaten, or reveal private things), and the technology is IDENTICAL in both cases; the only thing separating a legitimate use from a violation is whether the person agreed. So consent isn\'t a formality around the capability — it IS the line between acceptable and harmful use. The three qualifiers each add something essential. "Informed" means the person actually understands what\'s happening: that you\'ll synthesize new, arbitrary speech in their voice, and what it could be used for — consent given without understanding isn\'t meaningful consent, because they haven\'t agreed to the thing that\'s actually being done. "Scoped" means the permission is bounded to specific purposes — "my voice, for the narrator character, in this one project" — rather than a blank check to make their voice say anything, forever, for any purpose; scoping respects that agreeing to one use is not agreeing to all uses, and it\'s what lets the person retain control over their own identity. "Before" means consent is a precondition gathered up front, not forgiveness sought after the fact — because the harm of an unconsented clone is often done the moment it\'s made and used, and "we\'ll ask if anyone complains" means you\'ve already crossed the line by the time you ask. Together they define real consent: the person knowingly agreed, to specific uses, in advance. And critically, none of this is addressed by the privacy work from the last lesson — keeping the sample local protects where the biometric data lives, but says nothing about whether the person agreed to be cloned at all. Local answers "where\'s the data"; consent answers "am I allowed to speak as this person," and only the second is the ethics of the act.'
    },
    {
      q: 'What is provenance in this context, what do you record, and what does it let you do?',
      a: 'Provenance is durable, first-class data recording the origin and permission for every voice you use — it turns consent from a private intention into a verifiable record. For each voice, especially each clone, you record: whose voice it is, where the sample came from, what uses were permitted (the scope), and when consent was given. That converts "we probably had permission" into "here is the record: this is Alex\'s voice, from a sample Alex recorded for us on this date, permitted for the narrator role in this project." It\'s the same discipline as the Part-3 manifest — metadata attached to each artifact so you can always answer questions about it — applied to the ethical dimension. Provenance does three concrete jobs beyond record-keeping. First, it GATES usage: a voice with no consent record should be unusable in the pipeline — you make the consent field required so an un-sourced voice is a hard error, not a silent default (the deliberate blank left in the previous lesson\'s cast entry). This means the system structurally cannot use a voice you can\'t account for. Second, it enables REVOCATION: if someone withdraws consent, the provenance record tells you exactly which clips and cast entries derive from their voice, so you can find and remove all of them — without provenance, a withdrawal would be unenforceable because you wouldn\'t know what to delete. Third, it provides ACCOUNTABILITY: if a dispute or question ever arises about a piece of audio, you can trace it to its source and its permission and answer definitively. The key insight is that provenance is what makes responsibility VERIFIABLE and ENFORCEABLE rather than a feeling — "responsible" in practice means you can produce the record, gate on it, and act on a withdrawal. And it\'s cheap: a few required fields per voice, built in the same way you\'d build any metadata. So provenance is the engineering that operationalizes consent — it\'s how "we got permission" becomes a thing the pipeline knows, requires, and can act on, rather than a claim you hope holds up.'
    },
    {
      q: 'Local cloning removes the cloud provider\'s terms-of-use as a gatekeeper. What does that mean for how you design against misuse?',
      a: 'It means the restraint has to be built in by you and exercised by you, because there is no longer any external party enforcing limits. A cloud cloning service has terms of use, abuse detection, and the ability to refuse or revoke access — an imperfect but real gatekeeper standing between a user and misuse. Going fully local, which is the whole point of this course for privacy reasons, deliberately removes that gatekeeper: there\'s no service to say no, no terms to violate, no account to ban — the full capability is in your hands, undivided. That\'s a genuine trade-off of local processing, and it raises rather than lowers your responsibility. The technology is dual-use in the sharpest way: the exact same capability that voices a consenting friend\'s character enables fraud (a cloned voice authorizing a payment, "your CEO called with new wire instructions"), impersonation and misinformation (making a public figure appear to say something), and non-consensual content (putting words in someone\'s mouth to harm or humiliate them) — and these are the PREDICTABLE dark uses, not exotic edge cases. So designing against misuse becomes an internal engineering-and-ethics posture with two parts. Build the guardrails INTO the pipeline: required consent (no clone without a recorded permission), provenance (always traceable to whose voice and what scope), and disclosure (synthetic audio labeled honestly) — the same guardrails that also make legitimate use accountable. And personally REFUSE the harmful uses: don\'t clone people who didn\'t agree, don\'t generate deceptive content, don\'t target a real person — because when you\'re the only gatekeeper, your refusal IS the control. The through-line is that ethics here is buildable AND owned: buildable because consent gates, provenance records, and disclosure labels are concrete features you implement alongside caching and normalization; owned because with the external enforcer removed, the pipeline\'s guardrails plus your own judgment are the entire safety system. The mature framing isn\'t "local cloning is dangerous so avoid it" — it\'s "local cloning concentrates both the power and the responsibility in you, so you engineer the safeguards in and hold the line yourself."'
    }
  ],
  code: {
    title: 'Consent as a required gate and provenance record',
    intro: 'The ethics made buildable: a provenance record per voice, a required-consent gate that makes an un-sourced voice a hard error, revocation support, and a disclosure label — concrete features, right in the pipeline.',
    code: `from datetime import date

def make_provenance(owner, sample_source, permitted_uses, consent_date):
    # every field required: an incomplete record is NOT valid consent
    if not (owner and sample_source and permitted_uses and consent_date):
        raise ValueError("incomplete provenance -> voice is NOT usable")
    return {"owner": owner, "sample_source": sample_source,
            "permitted_uses": set(permitted_uses), "consent_date": consent_date,
            "revoked": False}

def can_use(prov, intended_use):
    # GATE: usable only if consented, this use is in scope, and not revoked
    if prov is None or prov["revoked"]:
        return False
    return intended_use in prov["permitted_uses"]

def synth_consented(voice, prov, intended_use, text, synth):
    if not can_use(prov, intended_use):        # hard stop, not a warning
        raise PermissionError(
            f"no consent for {intended_use!r} with {prov and prov['owner']!r}")
    audio = synth(text, voice=voice)
    return label_synthetic(audio, prov["owner"])   # DISCLOSURE, always

def revoke(prov):
    prov["revoked"] = True   # provenance tells you WHICH clips to now remove

def label_synthetic(audio, owner):
    # honest disclosure: mark it as a synthetic voice, not a real recording
    return {"audio": audio, "synthetic": True, "voice_of": owner}

# An un-sourced voice can't even be constructed (make_provenance raises),
# and can_use() blocks any out-of-scope or revoked use. Ethics = code.`,
    notes: [
      'The consent field is REQUIRED and gating: an incomplete provenance record raises, and can_use() hard-stops out-of-scope or revoked uses — an un-sourced voice is a hard error, not a silent default.',
      'Revocation flips one flag, and because provenance records whose voice each clip is, you can find and remove exactly the affected audio. Disclosure (label_synthetic) is applied on every synthesized clip, not optionally.'
    ]
  },
  lab: {
    title: 'Build the consent gate',
    prompt: 'Implement <code>can_use(prov, intended_use)</code>, the consent gate. <code>prov</code> is either <code>None</code> (no consent record at all) or a dict with keys <code>permitted_uses</code> (a set/list of allowed use strings) and <code>revoked</code> (a bool). Return <code>True</code> ONLY if: <code>prov</code> is not None, AND <code>prov["revoked"]</code> is False, AND <code>intended_use</code> is in <code>prov["permitted_uses"]</code>. Otherwise return <code>False</code>. This makes an un-sourced voice (None), a revoked voice, or an out-of-scope use all fail closed — the safe default is "not allowed."',
    starter: `def can_use(prov, intended_use):
    # True only if: prov exists, not revoked, and intended_use is permitted
    pass`,
    checks: [
      { re: 'def\\s+can_use\\s*\\(', flags: '', must: true, hint: 'Define can_use(prov, intended_use).', pass: 'can_use defined ✓' },
      { re: 'None', flags: '', must: true, hint: 'A None provenance (no consent) must return False.', pass: 'no-consent case handled ✓' },
      { re: 'revoked', flags: '', must: true, hint: 'A revoked consent must return False.', pass: 'revocation checked ✓' },
      { re: 'permitted_uses', flags: '', must: true, hint: 'Check intended_use against permitted_uses.', pass: 'scope check present ✓' }
    ],
    tests: `p = {"permitted_uses": {"narrator", "trailer"}, "revoked": False}
# in-scope use with valid consent -> allowed
assert can_use(p, "narrator") is True
assert can_use(p, "trailer") is True
# out-of-scope use -> blocked (scoped consent)
assert can_use(p, "deepfake") is False
# no consent record at all -> blocked (fail closed)
assert can_use(None, "narrator") is False
# revoked consent -> blocked even for a previously-permitted use
r = {"permitted_uses": {"narrator"}, "revoked": True}
assert can_use(r, "narrator") is False
print("consent gate correct")`,
    solution: `def can_use(prov, intended_use):
    if prov is None or prov["revoked"]:
        return False
    return intended_use in prov["permitted_uses"]`,
    notes: [
      'The gate fails CLOSED: no record, revoked, or out-of-scope all return False. The safe default is "not allowed," so a voice you can\'t account for simply can\'t be used — consent is enforced by the code path, not by good intentions.',
      'Checking intended_use against permitted_uses is what makes consent SCOPED — permission for "narrator" is not permission for "deepfake." Scoping respects that agreeing to one use isn\'t agreeing to all.'
    ]
  },
  deepDive: {
    timeMin: 10,
    intro: 'Two harder questions: whose consent, and what to do when you can\'t get it — plus the limits of technical safeguards.',
    sections: [
      {
        h: 'The gray zones: public figures, deceased voices, and "voices that sound like" someone',
        p: 'The clean case is cloning a living person who can consent. Real projects hit murkier ones. Public figures: their voice samples are abundant and their speech is newsworthy, which makes them tempting and dangerous — availability is emphatically not permission, and impersonating a public figure to make them "say" something is among the highest-harm misuses (misinformation at scale), so the fact that you CAN get the sample is irrelevant to whether you may use it. Deceased people: consent can\'t be obtained from the person, so the decision falls to their estate/family and to a judgment about dignity and likely wishes — "they\'re not around to object" is not consent, and using a dead person\'s voice without their family\'s agreement treats their identity as an unowned resource, which it isn\'t. Voices that merely "sound like" a specific person (a soundalike synthetic voice not cloned from their sample): this evades the letter of "did you use their sample" while potentially still trading on their identity — if the intent and effect are to make audiences think of that specific person, the ethical (and increasingly legal) issues follow the identity, not the mechanism. The through-line for all the gray zones is to reason from the PRINCIPLE (a voice is an identity; speaking as someone affects them) rather than from technical loopholes (the sample was public, they\'re deceased, I didn\'t technically clone them). The principle asks "am I trading on or affecting a specific real person\'s identity, and did I have the right to?" — and if the honest answer is "I\'m using their identity and I don\'t have their agreement," the loophole doesn\'t rescue it. When genuinely uncertain, the conservative default — don\'t, or get explicit permission from whoever can give it — is the right one, because the downside of wrongly cloning a real identity is severe and often irreversible.'
      },
      {
        h: 'Technical safeguards help, but the human is the real safeguard',
        p: 'It\'s worth being honest about the limits of what code can enforce, so you don\'t mistake features for a guarantee. The consent gates, provenance records, and disclosure labels from this lesson are real and worth building — they make legitimate use accountable, make un-sourced voices fail closed, enable revocation, and respect listeners. But a determined bad actor with local, open tools can bypass all of them: they can fabricate a provenance record, remove a disclosure label, or fork the code to delete the gate entirely, because when everything runs on your own machine there is no external system compelling honesty. Watermarking synthetic audio (embedding an inaudible marker that flags a clip as AI-generated) is an emerging technical mitigation and a genuinely useful one for detection at scale, but it too can be stripped or degraded by someone motivated, and not all local engines emit it. So the safeguards are best understood as guardrails for the WELL-INTENTIONED and as accountability infrastructure — they keep honest work honest and traceable, and they make casual misuse harder and conspicuous — rather than as a barrier that stops a committed abuser. That\'s not a reason to skip them; it\'s a reason to be clear-eyed that the ultimate safeguard, especially in a local/no-external-gatekeeper setting, is the person holding the tool. This is the mature version of the whole Part-4 argument: local processing concentrates both the capability and the responsibility in you, technical safeguards operationalize your good intentions but cannot substitute for them, and the decision to refuse a harmful use — to not clone the non-consenting person, to not make the deceptive clip — is a human one that no feature makes for you. Build the guardrails because they make responsible practice concrete and verifiable; hold the line yourself because, in the end, you are the enforcement.'
      }
    ]
  },
  quiz: [
    {
      q: 'The foundational reason consent matters in voice cloning is:',
      options: ['It\'s legally required everywhere', 'A voice is part of a person\'s identity, so synthesizing in it puts words in their mouth — an act with real consequences that only consent legitimizes', 'Cloning is low quality without it', 'It makes the audio sound better'],
      correct: 1,
      explain: 'The technology is identical for harmless and harmful uses; consent is the line between them. A voice is an identity, so speaking as someone affects them — permission is the whole issue.'
    },
    {
      q: 'Consent for cloning should be:',
      options: ['Assumed unless they object', 'Informed (they understand what you\'ll do), scoped (specific permitted uses), and obtained BEFORE cloning', 'A one-time blank check forever', 'Sought only if someone complains'],
      correct: 1,
      explain: 'Informed = they understand the act; scoped = bounded to specific uses, not a blank check; before = a precondition, not after-the-fact forgiveness. All three define real consent.'
    },
    {
      q: 'Provenance is:',
      options: ['A type of audio codec', 'Durable data recording whose voice it is, the sample source, permitted uses, and consent date — enabling gating, revocation, and accountability', 'The rendering speed', 'A cloud backup'],
      correct: 1,
      explain: 'Like the manifest, applied to ethics. It gates usage (required consent field), supports revocation (find all clips from a withdrawn voice), and makes responsibility verifiable — a record you can produce.'
    },
    {
      q: 'Going fully local for cloning affects misuse risk how?',
      options: ['It eliminates misuse', 'It REMOVES the external gatekeeper (no cloud terms-of-use to stop you), so the restraint must be built in and exercised by you', 'It has no effect', 'It makes misuse impossible'],
      correct: 1,
      explain: 'A cloud service can refuse or revoke; local has no such gatekeeper. The full dual-use power is in your hands, which raises your responsibility — build guardrails in and refuse harmful uses yourself.'
    },
    {
      q: 'The lesson\'s core stance on ethics in this pipeline is:',
      options: ['It\'s a disclaimer you add at the end', 'It\'s buildable engineering — consent gates, provenance records, disclosure labels — implemented alongside caching and normalization, and owned by you', 'It\'s the tool\'s responsibility, not yours', 'It only matters for commercial projects'],
      correct: 1,
      explain: 'Responsible use is concrete features (required consent, provenance, disclosure) designed into the pipeline, plus your own refusal of harmful uses — not an afterthought bolted on.'
    }
  ],
  pitfalls: [
    'Assuming the last lesson\'s privacy (local sample) makes cloning ethical. Local protects the DATA; it says nothing about CONSENT. "The sample never left my machine" ≠ "the person agreed to be cloned."',
    'Treating consent as after-the-fact or a blank check. It must be informed, scoped to specific uses, and obtained BEFORE cloning — agreeing to one use is not agreeing to all uses forever.',
    'No provenance record. Then you can\'t prove you had permission, can\'t honor a revocation (you don\'t know which clips to remove), and can\'t be accountable. Make the consent field required and gating.',
    'Passing synthetic audio off as a real recording. Letting listeners believe a clip is genuine is deception even if benign — label synthetic voices honestly, especially when mistakable for a real person.',
    'Thinking "it\'s local, so no one\'s stopping me" means anything goes. Going local removes the external gatekeeper — that raises your responsibility. Build guardrails in and refuse the harmful uses (fraud, impersonation, non-consensual content) yourself.'
  ],
  interview: [
    {
      q: 'You\'re building a product with local voice cloning. Design the consent and provenance system, and explain how it enforces responsible use.',
      a: 'I\'d make consent and provenance first-class, required, and gating — concrete features, not policy prose — starting from the premise that a voice is part of a person\'s identity, so cloning a real person requires informed, scoped consent obtained before cloning. Informed: the person understands we\'ll synthesize arbitrary new speech in their voice and what it could be used for. Scoped: permission is bound to specific uses (e.g. "the narrator role in this project"), not a blank check. Before: it\'s a precondition, gathered up front. I\'d operationalize that as a provenance record attached to every voice: whose voice it is, the sample source, the permitted uses (the scope), and the consent date — the same metadata discipline as the Part-3 manifest, applied to ethics. Then I\'d enforce it in the code path three ways. First, a required consent field: constructing a usable voice without a complete provenance record is a hard error, so an un-sourced voice literally cannot enter the pipeline — it fails closed. Second, a consent gate on every synthesis: can_use(prov, intended_use) returns true only if consent exists, the use is in scope, and consent isn\'t revoked; a None record, an out-of-scope use, or a revoked voice all block, so the safe default is "not allowed." Third, revocation support: because provenance records whose voice each clip derives from, a withdrawal lets us find and remove exactly the affected clips and cast entries — a right that\'s meaningless without the record. On top I\'d add honest disclosure — every synthesized clip is labeled synthetic, so listeners aren\'t deceived into thinking it\'s a real recording. The reason this matters especially for a LOCAL product is that going local removes the external gatekeeper a cloud service would provide (terms of use, abuse detection, revocation of access), so the guardrails have to be built in and the restraint exercised by us — the pipeline\'s required-consent gate, provenance, and disclosure ARE the safety system, alongside our refusal of harmful uses. I\'d be honest internally that these safeguards protect and account for well-intentioned use and make casual misuse conspicuous, but a determined bad actor with local tools can bypass them, so the ultimate safeguard is human judgment — which is why I\'d also set firm product policy: no cloning without recorded consent, no public figures, no deceptive or non-consensual content, full stop. The design principle throughout is that ethics here is buildable: consent gates, provenance records, and disclosure labels are features implemented right next to caching and normalization, turning "we\'re responsible" into something the system requires, enforces, and can prove.'
    },
    {
      q: 'How do you reason about the gray cases — cloning a public figure, a deceased person, or making a voice that just "sounds like" someone?',
      a: 'I reason from the underlying principle rather than from technical or legal loopholes, because every gray case is an attempt to get around the same core fact: a voice is an identity, and speaking as a specific real person affects them, so the question is always "am I trading on or affecting a specific real person\'s identity, and did I have the right to?" For a public figure: their samples are abundant and their words are newsworthy, which makes them tempting, but availability is not permission — I can trivially GET the sample and that\'s irrelevant to whether I may USE it. Impersonating a public figure to make them appear to say something is among the highest-harm misuses because it\'s misinformation at scale, so a public figure is a harder no, not an easier yes, despite the easy sample access. For a deceased person: consent can\'t come from them, so it\'s not that consent is waived — it\'s that the decision passes to their estate/family plus a judgment about dignity and likely wishes; "they\'re not around to object" is the opposite of consent, and using a dead person\'s voice without their family\'s agreement treats their identity as an unowned resource, which it isn\'t. For a soundalike that wasn\'t cloned from their sample: this dodges the letter of "did you use their biometric" while potentially still trading on their identity, and if the intent and effect are to make audiences think of that specific person, the ethical issues follow the identity, not the mechanism — the loophole ("I didn\'t technically clone them") doesn\'t rescue it. So my consistent method is to ignore whether there\'s a technical or legal gap to exploit and ask the principle\'s question directly; if the honest answer is "I\'m using a specific real person\'s identity and I don\'t have the right person\'s agreement," I don\'t do it. And when genuinely uncertain — an ambiguous estate situation, unclear whether a resemblance is specific enough — I default conservative: don\'t proceed, or get explicit permission from whoever can actually give it, because the downside of wrongly appropriating a real identity is severe and frequently irreversible, while the cost of declining or asking is small. The maturity here is refusing to let the availability of a workaround substitute for the ethics — local tools give me the power to do all of these, which is exactly why the judgment has to be mine and has to come from the principle, not the loophole.'
    }
  ]
};
