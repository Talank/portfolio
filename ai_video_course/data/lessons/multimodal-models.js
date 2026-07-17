window.LESSONS = window.LESSONS || {};
window.LESSONS['multimodal-models'] = {
  id: 'multimodal-models',
  title: 'Open Vision-Language Models: Letting the App See the Uploaded Picture',
  category: 'Part 1 — Local LLM Core Skills',
  timeMin: 35,
  summary: 'The creator uploads a picture, and the pipeline immediately has questions: is there a face? A photo or a drawing? Facing forward or in profile? Those answers change which models run and with what settings. Open vision-language models — LLaVA and the Qwen-VL family, served straight through Ollama — let your director SEE the upload and answer in schema. But vision models earn a sharper division-of-labor lesson than text ever did: a VLM understands what a picture MEANS and is unreliable about exactly WHERE things are — so semantics come from the VLM, geometry comes from a dedicated face detector, and a well-built pipeline refuses to confuse the two.',
  goals: [
    'Explain how a VLM works at the block-diagram level: a vision encoder turns the image into tokens that join the text in one sequence',
    'Send an image to a local multimodal model through Ollama (the images field, base64) and get schema-constrained facts back',
    'Design the image-intake questions DenDen Studio actually needs answered: face present, photo vs drawn, orientation, obstructions, suitability',
    'Draw the semantics/geometry line: VLM for what things are, dedicated detectors (OpenCV/MediaPipe-class) for precisely where they are',
    'Resolve conflicts between the two signals deliberately, instead of letting whichever ran last win'
  ],
  concept: [
    {
      h: 'How a language model grows eyes',
      p: [
        'A VLM is not a new kind of brain — it is the LLM you already know with a preprocessing organ bolted on. A <b>vision encoder</b> (typically a Vision Transformer) slices the image into a grid of patches and turns each patch into an embedding; a small <b>projection layer</b> then maps those embeddings into the same vector space the LLM uses for text tokens. The result: your image becomes a few hundred "image tokens" that are simply placed in the sequence alongside the text tokens, and the LLM attends over all of it together. When you ask "is this a frontal face photo?", the question tokens and the picture tokens are processed by one model in one pass.',
        'This architecture explains both the magic and the limits before you ever hit them. Magic: everything you learned in this Part still works — system prompts, conversation history, temperature, and crucially <b>constrained output and tools</b> apply to vision requests unchanged, because after the encoder it is all just tokens. Limits: the image was compressed into a fixed budget of patch embeddings, so fine spatial detail — exact pixel coordinates, small text, counting many similar objects — may simply not survive the compression. The model reasons about a summary of the picture, not the pixels.'
      ]
    },
    {
      h: 'Running open VLMs locally: same Ollama, one new field',
      p: [
        'Ollama serves multimodal models with the exact API you already use — <code>ollama pull llava</code> or a Qwen-VL-family tag, then add an <code>images</code> array (base64-encoded image data) to any message. The reply is ordinary text, which means <code>format</code> with a JSON schema works too: image in, validated structure out. Model menu, small to large: <b>moondream</b>-class tiny VLMs (fast, surprisingly capable at yes/no scene questions, ideal when the question is simple), <b>LLaVA</b> (the classic open recipe: CLIP-family encoder + Llama-family LLM), and the <b>Qwen-VL</b> family (state of the open art for OCR-ish and detailed description work). The triangle from anatomy-of-an-llm-app applies unchanged — a VLM is an LLM plus an encoder, and prices VRAM accordingly.',
        'For DenDen Studio, intake runs once per upload: a small VLM answers a fixed questionnaire about the picture, schema-constrained — <code>subject_type</code> (photo_face / drawn_character / object / no_subject), <code>orientation</code> (frontal / three_quarter / profile), <code>obstructions</code> (glasses, hand, microphone), <code>single_subject</code> (bool). Those few facts steer real decisions: drawn characters route to animation models tuned for illustration; a profile shot gets a "please upload a more frontal picture" nudge BEFORE the creator waits through a doomed render; two faces mean asking which one talks.'
      ]
    },
    {
      h: 'The line that keeps pipelines honest: semantics vs geometry',
      p: [
        'Ask a VLM "is there a face and roughly where?" and you get a fluent answer with a plausible-sounding bounding box — and that box can be off by a lot, differently each time, worse near edges. It is not a bug to file; it is the architecture being itself: coordinates are fine spatial detail, exactly what patch compression discards. Meanwhile a boring, decade-old face detector (OpenCV Haar/DNN, MediaPipe-class landmark models — tiny, CPU-fast, open) returns pixel-accurate boxes and 400+ facial landmarks, and knows nothing about whether the face is a drawing, is obstructed, or belongs to the intended subject.',
        'So the intake pipeline uses both, each for what it is good at: <b>VLM answers semantic questions</b> (what kind of picture, what style, what problems), <b>the detector answers geometric ones</b> (exact face box for cropping, landmark positions the lip-sync model in Part 3 will anchor to — a talking-head model literally cannot run without precise mouth coordinates, and "the mouth is in the lower middle area" does not drive a renderer). This division — probabilistic model for understanding, deterministic tool for measurement — is the same instinct as the tool-calling lesson: when a precise fact exists, fetch it with a precise instrument; never let the language model guess it.'
      ]
    },
    {
      h: 'When the two signals disagree',
      p: [
        'Run both and disagreements WILL happen: the VLM says photo_face, the detector finds nothing (heavy stylization, extreme angle); the detector finds a face where the VLM said drawn_character (photoreal illustration — both are right); the VLM says one subject, the detector returns two boxes (a face in a background poster). Resolve by jurisdiction, decided in advance: <b>existence and location of usable face geometry belongs to the detector</b> — if it found no landmarks, no talking-head model can run, whatever the VLM felt about the picture; <b>classification and suitability belongs to the VLM</b> — the detector cannot know a face is drawn, or that glasses will degrade lip-sync.',
        'The combined verdict falls into three buckets, and this shape recurs for the rest of the course: <b>proceed</b> (signals agree, pipeline configured accordingly), <b>proceed with adjustments</b> (drawn character → illustration-tuned model; slight profile → warn about quality), <b>stop and ask the creator</b> (no usable geometry, or multiple candidate faces — a question to the human beats a confident wrong render every time). Encoding that policy as code — rather than as vibes about which signal seems trustworthy today — is what makes intake debuggable when a weird upload arrives. And every weird upload arrives eventually.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Robin Reads the Mural, Franky Measures It — and Neither Does the Other\'s Job',
      text: 'The crew finds a sea-worn mural that must be reproduced exactly on a commissioned monument. Robin takes one long look and delivers what no instrument could: it is late Void-Century coastal style, the central figure is a navigator not a warrior (the pose ends in a chart-hand, not a sword-hand), the left panel is a later addition by a different carver, and the paint traces mean it was once colored — so the reproduction should be, too. Then the client asks her for the figure\'s exact height, and Robin declines without embarrassment: "My reading tells you what this IS. If you build from my eyeballed numbers, your monument will be beautifully, confidently wrong." Franky steps in with calipers and a chalk grid — no opinions about eras or carvers, just measurements to the millimeter, including the mouth-line of the figure, which the animating sculptor downstream cannot work without. The trouble starts when the signals disagree: Franky\'s grid finds a second, fainter face Robin had dismissed as weathering. They do not argue about who outranks whom in general — they split by jurisdiction. Whether carved geometry EXISTS there is Franky\'s call, and his grid says yes; what it MEANS — an apprentice\'s abandoned practice face, not part of the composition — is Robin\'s call, and hers says leave it out of the monument. Usopp, taking notes: measure with the measurer, read with the reader, and when they clash, know in advance whose question it was.'
    },
    sitcom: {
      show: 'The Big Bang Theory',
      title: 'Sheldon Grades the Comic at a Glance; the Grading Service Uses Calipers',
      text: 'Howard inherits a box of comics and brings them to the apartment for appraisal. Sheldon is magnificent and instantaneous: this one is a second printing (the ink density of the logo), that one is the issue where the artist changed inkers mid-run, this cover is a famous swipe of an earlier cover, and THAT one — he barely glances — is a counterfeit, because the paper stock is wrong for the year. It is exactly the kind of knowing no instrument provides. Then Howard asks whether the prize copy will grade a 9.4, and Sheldon\'s confidence produces a number that Leonard immediately distrusts: "You cannot EYEBALL a spine-tick count, Sheldon. That is literally a measurement." They send it to the grading service, where a technician who could not tell a swipe from an homage measures corner sharpness in fractions of a millimeter and counts spine ticks under angled light. The verdict comes back and creates the conflict everyone saw coming: the service\'s instruments flag "possible restoration, re-glossed cover" on a book Sheldon certified as untouched. The gang resolves it the only sane way — by jurisdiction, agreed before opening the envelope. Whether measurable gloss variance EXISTS is the instrument\'s call, full stop. What it MEANS is Sheldon\'s: that issue\'s covers left the printer with uneven gloss, a fact he knows from publishing history that no caliper could. Penny\'s summary sticks: "So the robot measures, the nerd interprets, and you never let either one freelance the other\'s job."'
    },
    why: 'Robin and Sheldon are the VLM: a glance yields rich semantics — style, era, authenticity, what routes where — that no deterministic instrument can produce, and both fail exactly where the VLM fails: asked for a NUMBER, they emit confident, plausible, unreliable ones. Franky\'s chalk grid and the grading service are the face detector: pixel-precise geometry (down to the mouth-line the downstream animator needs — the lip-sync anchor of Part 3), zero understanding of meaning. Both stories land the disagreement protocol the fourth concept section teaches: jurisdiction assigned in advance — existence of geometry belongs to the instrument, interpretation belongs to the reader — so a clash routes to the right authority instead of to whoever spoke last. That is choose_intake in the lab, as narrative.'
  },
  tech: [
    {
      q: 'Why are bounding boxes from a VLM unreliable when the same model describes the image so well? Where do the coordinates actually get lost?',
      a: 'In the encoder\'s compression. The image is resized to the encoder\'s working resolution and cut into a coarse grid of patches (often 14-32 px squares); each patch becomes ONE embedding vector, and the LLM only ever sees that sequence of a few hundred vectors. Semantic content survives beautifully — "glasses," "drawn style," "facing left" are exactly the kind of information patch embeddings carry. But a pixel coordinate requires localizing structure WITHIN and ACROSS patches at a precision the representation never stored; when the model emits "x: 214," it is generating a plausible token given roughly where things sit in the patch grid, not reading a measurement. Some newer open VLMs train specifically on grounding tasks and do meaningfully better, but the engineering rule stands: when a downstream stage consumes coordinates (crops, lip-sync anchors), they come from a detector that computes over actual pixels. The VLM\'s spatial talk is for humans and routing decisions, not for renderers.'
    },
    {
      q: 'Intake asks a fixed questionnaire. Why run it as ONE schema-constrained VLM call instead of separate calls per question, or one open-ended "describe this image"?',
      a: 'Against open-ended description: you would then need a second step to parse fluent prose into fields — reintroducing exactly the fragility Part 1 spent a lesson killing, plus descriptions emphasize what the model finds salient, not what your pipeline needs (it will wax about lighting and forget to mention the second face). Against per-question calls: each call re-pays image encoding and prefill — the expensive part of a vision request — so five questions cost roughly five times the latency for zero quality gain; the questions are not independent anyway (orientation only matters if a face exists), and one schema with all fields lets the model answer coherently from a single read of the image. The single constrained call also gives you the operational win: one request, one validated object, one log entry per upload. Split calls only when a question needs a DIFFERENT model — the tiny-VLM-first cascade in the deep dive is exactly that case.'
    },
    {
      q: 'The face detector found a confident box, but the VLM says drawn_character. The talking-head models in Part 3 were mostly trained on photographs. What does intake do, and why is this a product decision rather than a bug?',
      a: 'Both signals are probably RIGHT — modern detectors happily fire on illustrated faces, and the picture really is a drawing. The naive failure is treating detector confidence as permission and routing to the photoreal talking-head model, which will produce uncanny, smeared results on illustration inputs it never trained for. Correct behavior per the jurisdiction rule: geometry exists (detector\'s call — so animation is POSSIBLE), classification says illustration (VLM\'s call — so the photoreal pipeline is the WRONG one). Intake therefore routes to the illustration-suited animation path (Part 3 covers the LivePortrait-style options that tolerate stylization) and, if quality there is known to be weaker, sets expectations in the UI. Why product decision: whether to support drawn characters at all, warn about quality, or restrict to photos is a scope choice with real UX and support-cost consequences — the pipeline\'s job is to DETECT the case reliably and route it somewhere deliberate, and this exact case is why intake runs a VLM at all: no detector could have told you the face was drawn.'
    }
  ],
  code: {
    title: 'Image intake: one constrained VLM call, one detector, one verdict',
    intro: 'The full intake shape: base64 the upload, ask a small VLM the fixed questionnaire (schema-constrained), get precise geometry from a real detector, then combine. The combine step is the lab.',
    code: `import base64, json, urllib.request

OLLAMA = 'http://localhost:11434'
VLM = 'llava:7b'                      # or a qwen-vl-family tag; pull first

INTAKE_SCHEMA = {
    'type': 'object',
    'properties': {
        'subject_type': {'enum': ['photo_face', 'drawn_character',
                                   'object', 'no_subject']},
        'orientation':  {'enum': ['frontal', 'three_quarter',
                                   'profile', 'not_applicable']},
        'single_subject': {'type': 'boolean'},
        'obstructions': {'type': 'array', 'items': {'type': 'string'}},
    },
    'required': ['subject_type', 'orientation',
                 'single_subject', 'obstructions'],
}

def vlm_intake(image_path):
    with open(image_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()
    body = {'model': VLM, 'stream': False,
            'format': INTAKE_SCHEMA,                 # vision + constraints:
            'options': {'temperature': 0, 'seed': 42},  # same machinery
            'messages': [{
                'role': 'user',
                'content': 'Assess this picture as an avatar candidate. '
                           'Answer only the schema fields.',
                'images': [img_b64],                 # <- the one new field
            }]}
    req = urllib.request.Request(OLLAMA + '/api/chat',
                                 data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return json.loads(json.loads(r.read())['message']['content'])

# Geometry comes from a real detector, never from the VLM.
# (MediaPipe-class, CPU-fast, pip install — run locally, not in Pyodide:)
#
#   import mediapipe as mp
#   detector = mp.solutions.face_detection.FaceDetection(0.6)
#   result = detector.process(rgb_image)
#   boxes = [d.location_data.relative_bounding_box
#            for d in (result.detections or [])]
#
# boxes: pixel-accurate, plus landmark models give 400+ face points —
# including the mouth outline Part 3's lip-sync stage anchors to.

report = vlm_intake('upload.png')      # semantics: what the picture IS
# boxes = detect_faces('upload.png')   # geometry: where the face IS
# verdict = choose_intake(report, boxes)   # <- you write this in the lab`,
    notes: [
      'Everything from the previous two lessons transferred unchanged: pinned tag, temperature 0 + seed, schema in format — vision added one field, not a new discipline.',
      'The detector snippet is runnable on your machine (pip install mediapipe), not in the browser — the lab therefore works with detector OUTPUT (boxes as data), which is all the combining logic ever sees anyway.'
    ]
  },
  lab: {
    title: 'The jurisdiction rule as code: combine VLM semantics with detector geometry',
    prompt: 'Write <code>choose_intake(report, face_boxes)</code>. Inputs: <code>report</code> — the VLM questionnaire (<code>subject_type</code>, <code>orientation</code>, <code>single_subject</code>, <code>obstructions</code>); <code>face_boxes</code> — list of detector boxes, each <code>{"confidence": float, "box": [x, y, w, h]}</code>. Return a dict with <code>action</code> (<code>"proceed"</code>, <code>"adjust"</code>, or <code>"ask_user"</code>), <code>pipeline</code> (<code>"photo_head"</code>, <code>"illustration_head"</code>, or <code>None</code>), <code>crop_box</code> (the highest-confidence detector box, or <code>None</code>), and <code>reasons</code> (list of strings). Jurisdiction rules: no detector box ⇒ <code>ask_user</code>, pipeline <code>None</code> (geometry is the detector\'s call — whatever the VLM said); multiple boxes ⇒ <code>ask_user</code> with the boxes\' count in a reason; one box + <code>photo_face</code> ⇒ <code>proceed</code> on <code>photo_head</code>; one box + <code>drawn_character</code> ⇒ <code>adjust</code> onto <code>illustration_head</code> (classification is the VLM\'s call); non-frontal orientation or any obstructions ⇒ downgrade <code>proceed</code> to <code>adjust</code>, naming each cause in <code>reasons</code>. <code>crop_box</code> always comes from the detector, never invented.',
    starter: `def choose_intake(report, face_boxes):
    result = {'action': None, 'pipeline': None,
              'crop_box': None, 'reasons': []}
    # 1. geometry jurisdiction: no boxes -> ask_user; many -> ask_user
    # 2. crop_box = highest-confidence detector box
    # 3. classification jurisdiction: photo vs drawn picks the pipeline
    # 4. orientation / obstructions downgrade proceed -> adjust
    return result`,
    checks: [
      { re: 'def\\s+choose_intake\\s*\\(', flags: '', must: true, hint: 'Define choose_intake(report, face_boxes).', pass: 'choose_intake defined ✓' },
      { re: "'ask_user'|\"ask_user\"", flags: '', must: true, hint: 'Missing or ambiguous geometry must route to the human.', pass: 'ask_user path ✓' },
      { re: 'confidence', flags: '', must: true, hint: 'crop_box is the highest-CONFIDENCE detector box.', pass: 'confidence used for crop ✓' },
      { re: "'illustration_head'|\"illustration_head\"", flags: '', must: true, hint: 'drawn_character routes to the illustration pipeline (VLM jurisdiction).', pass: 'illustration routing ✓' },
      { re: 'obstructions', flags: '', must: true, hint: 'Obstructions downgrade proceed to adjust, with reasons.', pass: 'obstructions handled ✓' }
    ],
    tests: `clean = {'subject_type': 'photo_face', 'orientation': 'frontal',
         'single_subject': True, 'obstructions': []}
one_box = [{'confidence': 0.93, 'box': [120, 80, 200, 200]}]
r = choose_intake(clean, one_box)
assert r['action'] == 'proceed' and r['pipeline'] == 'photo_head'
assert r['crop_box'] == [120, 80, 200, 200], 'crop comes from the detector'

r = choose_intake(clean, [])
assert r['action'] == 'ask_user' and r['pipeline'] is None, \
    'no geometry -> detector wins over VLM optimism'

two = [{'confidence': 0.9, 'box': [0, 0, 50, 50]},
       {'confidence': 0.95, 'box': [200, 40, 180, 180]}]
r = choose_intake(clean, two)
assert r['action'] == 'ask_user' and any('2' in s for s in r['reasons']), \
    'ambiguous geometry -> ask, naming the count'

drawn = dict(clean, subject_type='drawn_character')
r = choose_intake(drawn, one_box)
assert r['action'] == 'adjust' and r['pipeline'] == 'illustration_head', \
    'VLM owns classification: drawing routes to illustration pipeline'

glasses = dict(clean, orientation='three_quarter', obstructions=['glasses'])
r = choose_intake(glasses, one_box)
assert r['action'] == 'adjust' and len(r['reasons']) >= 2, \
    'orientation and obstruction each named'
print('intake jurisdiction logic correct')`,
    solution: `def choose_intake(report, face_boxes):
    result = {'action': None, 'pipeline': None,
              'crop_box': None, 'reasons': []}
    if not face_boxes:
        result['action'] = 'ask_user'
        result['reasons'].append('detector found no usable face geometry')
        return result
    if len(face_boxes) > 1:
        result['action'] = 'ask_user'
        result['reasons'].append(str(len(face_boxes)) +
                                 ' faces detected - which one talks?')
        return result
    best = max(face_boxes, key=lambda b: b['confidence'])
    result['crop_box'] = best['box']
    if report['subject_type'] == 'drawn_character':
        result['pipeline'] = 'illustration_head'
        result['action'] = 'adjust'
        result['reasons'].append('drawn character - illustration pipeline')
    else:
        result['pipeline'] = 'photo_head'
        result['action'] = 'proceed'
    if report['orientation'] != 'frontal':
        result['action'] = 'adjust'
        result['reasons'].append('non-frontal orientation: ' +
                                 report['orientation'])
    for ob in report['obstructions']:
        result['action'] = 'adjust'
        result['reasons'].append('obstruction: ' + ob)
    return result`,
    notes: [
      'Every branch is a jurisdiction call, not a confidence contest: geometry questions never consult the VLM, classification questions never consult the detector — which is exactly what makes a weird upload debuggable from the reasons list alone.',
      'The reasons strings do double duty again: they surface in the creator-facing UI ("we detected glasses — lip-sync may be less accurate") and in logs. Part 6\'s frontend lesson consumes them directly.'
    ]
  },
  deepDive: {
    timeMin: 12,
    intro: 'Two mechanisms worth owning beneath today\'s working knowledge: what an image actually costs in tokens (and the resolution tradeoff hiding in every VLM), and the cheap-model-first cascade that keeps vision intake fast.',
    sections: [
      {
        h: 'Images are tokens, and tokens are budget: the resolution tradeoff',
        p: 'A ViT encoder at 336x336 with 14 px patches produces (336/14)^2 = 576 patch embeddings — so one image enters the LLM as roughly 576 tokens\' worth of sequence, before your question adds a word. That number is why vision requests feel slower (prefill grew by a picture) and why VRAM ticks up (KV cache covers image tokens too). It is also where detail goes to die: a 4000 px upload squeezed to 336 px keeps composition and style but loses small text and far-away faces. Modern open VLMs (Qwen-VL family especially) mitigate with tiled/dynamic resolution — slicing a large image into several encoder-resolution tiles — buying detail with MORE tokens, linearly more latency, more memory. The engineering posture: match resolution strategy to the question. Intake questions ("is this a frontal face?") are composition-level — low-res single-pass is correct and fast; reading a serial number needs tiling or, usually better, a crop of the relevant region — using the detector\'s box to crop before the VLM looks is the two-tool division of labor again, now saving tokens instead of preventing errors.'
      },
      {
        h: 'The cascade pattern: tiny model answers first, big model answers when it matters',
        p: 'Intake runs on every upload, so its latency is product surface. The cascade: a moondream-class tiny VLM (fast, small) answers the cheap gating questions first — is there any face-like subject at all? If no, intake ends in a few hundred milliseconds with "please upload a picture of a face or character," and the big model never loads. Only promising uploads proceed to the larger VLM\'s full questionnaire. This is the same routing logic as running-local-llms\' 8B-vs-70B interview answer, applied to vision: pay the expensive model only where the cheap one\'s answer is insufficient, and let the common case (obviously fine or obviously wrong uploads) stay fast. Two cautions from practice: cascade stages must agree on jurisdiction too (the tiny model gates, it does not classify — do not let its rough subject_type leak downstream as truth), and measure the cascade\'s end-to-end latency distribution rather than each stage\'s average — the worst case (tiny says maybe, big model cold-loads) is what the creator actually feels, and Part 5\'s warmth policy exists precisely for that seam.'
      }
    ]
  },
  quiz: [
    {
      q: 'Architecturally, a VLM sees your image as:',
      options: ['Raw pixels streamed alongside the text', 'A few hundred patch embeddings projected into the LLM\'s token space, attended jointly with the text tokens', 'A URL the model fetches internally', 'A separate model\'s text description pasted into the prompt'],
      correct: 1,
      explain: 'A vision encoder compresses the image into patch embeddings that join the token sequence — which is why prompts, schemas, and sampling controls all work unchanged, and why fine pixel detail may not survive.'
    },
    {
      q: 'Why does DenDen Studio get its crop box from MediaPipe-class detection instead of asking the VLM for coordinates?',
      options: ['Detectors are open source and VLMs are not', 'VLM coordinates are plausible-sounding generations, not measurements — patch compression discards the precision a renderer needs; detectors compute over actual pixels', 'VLMs cannot output numbers', 'Detectors also understand drawing style'],
      correct: 1,
      explain: 'Semantics from the VLM, geometry from the detector. The lip-sync stage anchors to exact mouth coordinates — "lower middle area" does not drive a renderer.'
    },
    {
      q: 'The VLM says photo_face; the detector finds zero boxes. Per the jurisdiction rule, intake:',
      options: ['Trusts the VLM — proceed with a default center crop', 'Averages the two opinions', 'Routes to ask_user with no pipeline: existence of usable geometry is the detector\'s call, full stop', 'Retries the VLM at higher temperature'],
      correct: 2,
      explain: 'No landmarks means no talking-head model can run, however the picture reads semantically. Geometry questions never get answered by the language model.'
    },
    {
      q: 'One schema-constrained VLM call for the whole intake questionnaire beats five separate calls mainly because:',
      options: ['Schemas only work once per image', 'Each call re-pays image encoding and prefill — the expensive part — and the questions are not independent anyway', 'Ollama limits vision calls', 'Five calls would need five different models'],
      correct: 1,
      explain: 'Encoding the image dominates vision-request cost; one call amortizes it across all questions and returns one coherent, validated object.'
    },
    {
      q: 'A detector confidently boxes a face that the VLM classifies as drawn_character. The correct read is:',
      options: ['One of them is malfunctioning', 'Both are right — detectors fire on illustrated faces; intake routes to the illustration-suited pipeline because classification is the VLM\'s jurisdiction', 'Detector confidence overrides the VLM entirely', 'The upload must be rejected'],
      correct: 1,
      explain: 'Geometry exists (animation is possible) AND the subject is a drawing (the photoreal pipeline is wrong for it). Two jurisdictions, two correct answers, one deliberate route.'
    }
  ],
  pitfalls: [
    'Feeding VLM-generated coordinates to anything that renders. The failure is silent and intermittent — crops that are usually roughly fine and occasionally absurd — which makes it far more expensive to discover in production than the one line of MediaPipe it would have taken to do it right.',
    'Running intake with an open-ended "describe this image" prompt and parsing the prose. You rebuilt the fragile-JSON problem with extra steps: descriptions emphasize what the model finds interesting, and the field your pipeline needed most is the one it forgot to mention. Fixed questionnaire, schema-constrained, every time.',
    'Skipping the multi-face branch because test uploads are always solo portraits. Real creators upload group photos, pictures with posters and photos-of-photos in the background — and the detector will dutifully find every face in all of them. "Which one talks?" is a one-question UI; a render lip-syncing the wrong face is a support ticket.'
  ],
  interview: [
    {
      q: 'Your app accepts arbitrary user images and must decide how (or whether) to animate them. Design the intake stage.',
      a: 'Two instruments with disjoint jurisdictions, then a policy layer. A small open VLM (LLaVA/Qwen-VL-class via Ollama) answers a FIXED semantic questionnaire — subject type (photo/drawn/object/none), orientation, single-vs-multiple subjects, obstructions — as one schema-constrained call at temperature 0, because those facts steer model routing and no detector can produce them. A deterministic face detector (MediaPipe-class) supplies geometry: pixel-accurate boxes and landmarks, which downstream stages (crop, lip-sync anchoring) consume directly — never VLM-generated coordinates, which are plausible text, not measurements. A combining function encodes jurisdiction in advance: geometry existence and location belong to the detector (no landmarks ⇒ ask the user, regardless of VLM optimism; multiple faces ⇒ ask which one talks); classification and suitability belong to the VLM (drawn character reroutes to an illustration-tolerant pipeline even though the detector fired confidently). Output is one of proceed / adjust / ask-user plus machine-readable reasons that surface in both UI and logs. Optionally a tiny-VLM gate runs first so obviously unusable uploads fail in milliseconds without loading the big model.'
    },
    {
      q: 'Why do vision-language models describe images brilliantly yet fail at precise localization, and what does that imply for system design?',
      a: 'Because of what the representation stores. The encoder resizes the image and compresses each patch of it into one embedding; the LLM reasons over those few hundred vectors, not pixels. Category, style, relationships, text-at-readable-scale — patch embeddings carry all of that, hence the brilliant descriptions. Sub-patch localization, exact counts of similar objects, and fine coordinates were never stored, so when prompted for them the model does what LLMs do with missing information: generates plausible tokens. Grounding-trained open VLMs improve this but do not change the design rule: treat VLM spatial output as advisory, and source any coordinate a downstream computation consumes from a deterministic CV component that operates on actual pixels. The general principle — which recurs beyond vision — is to classify each fact your pipeline needs as "understanding" or "measurement," route understanding to probabilistic models, measurement to instruments, and define in advance which signal has jurisdiction when they disagree. Systems that skip that last step resolve conflicts by accident, in whichever direction the code happened to be written.'
    },
    {
      q: 'Vision intake runs on every upload and users feel its latency directly. Walk through how you keep it fast without losing accuracy.',
      a: 'First, make the expensive thing countable: a vision request costs image encoding plus prefill over several hundred image tokens, so the levers are how many VLM calls run, at what resolution, on which model, and whether it is warm. Then, in order: (1) one schema-constrained call for the full questionnaire instead of per-question calls — encoding amortizes across all fields; (2) resolution matched to the question — intake questions are composition-level, so single-pass low-res is correct; tiling is reserved for detail questions, which intake does not have; (3) a cascade: a moondream-class tiny model gates ("any face-like subject at all?") in a few hundred milliseconds, and the majority of clearly-good or clearly-hopeless uploads never touch the larger model; (4) warmth policy on the big VLM during active sessions, because the felt worst case is tiny-model-says-maybe plus cold-load; (5) the detector runs in parallel on CPU — it is milliseconds and free. Finally, measure the end-to-end latency DISTRIBUTION, not stage averages: the p95 upload experience is the product, and it is usually dominated by exactly one cold-load seam that a warmth rule fixes.'
    },
    {
      q: 'A PM proposes: "the VLM is smart — let it look at the image and just tell us everything, including where to crop, one prompt, simpler system." Give the engineering response.',
      a: 'Simpler to write, and it moves three different failure classes into one opaque component. Coordinates: the crop box would be generated text, unreliable at the precision a renderer needs — that path produces intermittently absurd crops that are brutal to debug because they are usually almost right. Parsing: "tell us everything" means prose, and prose needs parsing — we would reintroduce the malformed-output class we eliminated with constrained generation, or bolt a schema onto an unbounded task and get salient-but-incomplete fields. Accountability: with one blended answer there is no jurisdiction — when the output is wrong we cannot tell whether understanding or measurement failed, so every bug report starts from zero. The two-instrument design costs one extra component (a CPU face detector, milliseconds, pip install) and buys us: measured geometry, a validated questionnaire, a conflict policy we chose in advance, and per-signal debuggability. I would also flip the simplicity argument: the combining function is 30 lines of pure, unit-tested Python — the "simpler" version hides those 30 lines inside a probabilistic model where no test can pin them down.'
    }
  ]
};
