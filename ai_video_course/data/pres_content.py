#!/usr/bin/env python3
"""Authored presentation content for the AI Video Course.

Run:  python3 pres_content.py    (from this dir)
It builds data/english/<id>.js, data/nepali/<id>.js and data/pres-titles.js
via the shared builder, then you run the audio pipeline in each audio dir.

Slide bodies (heading/bullets/code/big) are English and shared by both decks;
narration_en / narration_ne are authored per language — the Nepali is idiomatic
teaching prose (Nepal-flavoured analogies), not a translation of the English.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "..", "shared")))
import pres_build  # noqa: E402

MODULES = [
  # ────────────────────────────────────────────────────────────────────
  {
    "id": "what-we-are-building",
    "title": "DenDen Studio: A Voice, a Picture & a Description Walk Into an App",
    "subtitle_en": "One upload becomes a talking video",
    "subtitle_ne": "एउटा फोटो बोल्ने भिडियो बन्ने ठाउँ",
    "intro_en": "the whole product in one picture before we build any piece of it",
    "intro_ne": "कुनै टुक्रा बनाउनु अघि, सिंगो product एकै नजरमा",
    "slides": [
      {
        "heading": "What DenDen Studio actually does",
        "bullets": [
          "Upload a <b>voice sample</b>, a <b>picture</b>, and a <b>description</b> — get back an animated talking video.",
          "Swap the voice; speak live and the picture speaks with you.",
          "Fix the result by <i>describing</i> the change, or by click-dragging on the canvas.",
        ],
        "narration_en": "Welcome to the AI Video Course. Before we touch a single model, let's look at the finished thing we're building — because every lesson after this is one organ of this one body. The app is called DenDen Studio, named after the transponder snails in One Piece that carry a voice across the sea. Here's the whole product in one sentence: you give it a voice sample, a picture, and a description of what you want, and it hands back a video of that picture talking in that voice. Then you can swap the voice for another, or speak into your mic live and watch the picture move its lips with you. And when something looks off, you fix it by describing the change in plain words, or by dragging the motion around on a canvas with your mouse. That's it. That's the product. Everything else is how.",
        "narration_ne": "AI Video Course मा स्वागत छ। कुनै एउटा model छुनुअघि, हामीले बनाउने पूरा चीज एकपटक हेरौं — किनभने यसपछिका हरेक पाठ यही एउटै शरीरका अलग-अलग अंग हुन्। App को नाम हो DenDen Studio, One Piece का ती Den Den Mushi शंखबाट राखिएको — जसले समुद्रपारि आवाज पुर्‍याउँछ। पूरा product एक वाक्यमा भन्नुपर्दा: तपाईंले एउटा आवाजको नमुना, एउटा फोटो, र के चाहिएको हो भन्ने वर्णन दिनुहुन्छ, र app ले त्यही फोटो त्यही आवाजमा बोलेको भिडियो फिर्ता दिन्छ। त्यसपछि आवाज साट्न मिल्छ, वा माइकमा तपाईं बोल्दा फोटोले तपाईंसँगै ओठ चलाउँछ। केही बिग्रेजस्तो लागे, शब्दमै वर्णन गरेर वा canvas मा माउसले तानेर मिलाउन सकिन्छ। बस्, यही हो product। बाँकी सबै पाठ यो कसरी बन्छ भन्ने कुरा हुन्।",
      },
      {
        "heading": "Why open-source models only",
        "bullets": [
          "No paid model APIs anywhere — local LLMs, Whisper, XTTS/Piper, Wav2Lip-style heads.",
          "Runs on <b>your</b> machine: private by default, no per-call bill, works offline.",
          "You learn the <i>pieces</i>, not one vendor's buttons.",
        ],
        "narration_en": "One rule shapes this whole course: we use open-source models only. No paid model APIs, anywhere — not for the language model, not for the voice, not for the animation. Why be so strict? Three reasons. First, privacy: a voice is an identity, and someone's face and voice should not have to travel to a company's server just to make a video. When the model runs on your machine, the data never leaves the ship. Second, cost: a paid API charges per call, and a video is thousands of calls — build it on models you host and the marginal cost is electricity. Third, and most important for learning: when you use someone's hosted API you learn their buttons; when you run the model yourself you learn the actual pieces — and pieces transfer to every future project. Think of it like cooking on board instead of eating at taverns: you stock the pantry once, and after that every meal is free, private, and yours.",
        "narration_ne": "यो पूरा course लाई एउटा नियमले आकार दिन्छ: हामी खुला-स्रोत अर्थात् open-source model मात्रै चलाउँछौं। कहीँ पनि पैसा तिर्ने model API छैन — न भाषाको लागि, न आवाजको, न animation को। यति कडा किन? तीन कारण। पहिलो, गोपनीयता: आवाज भनेको एक किसिमको पहिचान हो, र कसैको अनुहार र आवाज भिडियो बनाउनकै लागि कुनै कम्पनीको server सम्म पुग्नुपर्ने बाध्यता हुनु हुँदैन। Model तपाईंकै मेसिनमा चले, data जहाजबाट बाहिरै जाँदैन। दोस्रो, खर्च: पैसा तिर्ने API ले हरेक call मा शुल्क लिन्छ, र एउटा भिडियो त हजारौं call हो — आफैंले host गरेको model मा बनाए, थप खर्च भनेको बिजुली मात्रै। तेस्रो, र सिकाइका लागि सबैभन्दा महत्त्वपूर्ण: अरूको hosted API चलाउँदा तपाईं तिनका button सिक्नुहुन्छ; आफैं model चलाउँदा साँचो टुक्राहरू सिक्नुहुन्छ — र ती टुक्रा भविष्यका हरेक project मा काम लाग्छन्। यसलाई जहाजमै पकाएर खानुजस्तै सोच्नुहोस्, हरेकपटक भोजनालय नखोजी: भण्डार एकपटक भर्ने, अनि हरेक भोजन सित्तैं, गोप्य, र आफ्नै।",
      },
      {
        "heading": "The four jobs inside the app",
        "bullets": [
          "<b>Understand</b> — an LLM reads your description and plans the work.",
          "<b>Speak</b> — text-to-speech and voice cloning produce the audio.",
          "<b>Move</b> — a talking-head model drives the lips and face from that audio.",
          "<b>Edit</b> — you correct the result by words or by dragging.",
        ],
        "narration_en": "If you squint at the product, four jobs are happening inside it, and the course is organized exactly around them. Job one, understand: a language model reads your plain-English description and turns it into a concrete plan — which voice, what motion, how long. Job two, speak: text-to-speech turns words into a human-sounding voice, and voice cloning makes that voice yours from a short sample. Job three, move: a talking-head model takes the audio and drives the picture's lips and expression so it looks like the face is really saying it. Job four, edit: because the first result is never perfect, you correct it — either by describing the fix in words, which the language model turns back into changes, or by grabbing the motion directly on a canvas. Understand, speak, move, edit. Hold those four verbs in your head and you'll always know which part of the app a given lesson is building.",
        "narration_ne": "Product लाई अलि नियालेर हेर्नुभयो भने, यसभित्र चार वटा काम भइरहेका हुन्छन्, र course ती चारैको वरिपरि व्यवस्थित छ। पहिलो काम, बुझ्नु: भाषाको model ले तपाईंको सादा वर्णन पढ्छ र त्यसलाई ठोस योजनामा बदल्छ — कुन आवाज, कस्तो चाल, कति लामो। दोस्रो काम, बोल्नु: text-to-speech ले शब्दलाई मानवजस्तो आवाजमा बदल्छ, र voice cloning ले छोटो नमुनाबाट त्यो आवाज तपाईंकै बनाइदिन्छ। तेस्रो काम, चलाउनु: talking-head model ले त्यो audio लिन्छ र फोटोको ओठ अनि हाउभाउ यसरी चलाउँछ कि साँच्चै त्यो अनुहारले बोलेजस्तो देखियोस्। चौथो काम, सम्पादन: पहिलो नतिजा कहिल्यै पूर्ण हुँदैन, त्यसैले तपाईं सुधार्नुहुन्छ — या त शब्दमा वर्णन गरेर, जसलाई भाषाको model ले फेरि परिवर्तनमा बदल्छ, या canvas मै सोझै चाल समातेर। बुझ्नु, बोल्नु, चलाउनु, सम्पादन — यी चार क्रिया दिमागमा राख्नुभयो भने, कुनै पनि पाठले app को कुन भाग बनाउँदैछ, सधैं थाहा हुन्छ।",
      },
      {
        "heading": "How the course is built",
        "big": "\"You build the app AS you learn the pieces.\"",
        "bullets": [
          "Each lesson teaches one piece <i>and</i> ships the part of DenDen Studio that uses it.",
          "Essentials first; an optional <b>Full Depth</b> switch unlocks the deep dives.",
          "By the capstone, the pieces snap together into the running app.",
        ],
        "narration_en": "Here's the promise of the course's shape: you don't sit through twenty lessons of theory and then build an app. You build the app as you go. Each lesson teaches one real piece — how local language models work, how voice cloning works, how lip sync works — and then immediately ships the slice of DenDen Studio that uses that piece. Every lesson gives you the essentials first, so you're never buried; and when a topic has real depth to spare, an optional Full Depth switch in the header unlocks the deeper dive for when you want it. By the time you reach the capstone, you're not starting a project — you're clicking together parts you already built and understand. That's the whole strategy: learn a piece, ship a piece, and let the finished app be the proof that the pieces fit.",
        "narration_ne": "Course को बनोटको वाचा यही हो: तपाईं बीस वटा सैद्धान्तिक पाठ सुनेर मात्रै अन्तमा app बनाउनुहुन्न। तपाईं सिक्दै जाँदै app बनाउँदै जानुहुन्छ। हरेक पाठले एउटा साँचो टुक्रा सिकाउँछ — local भाषाका model कसरी चल्छन्, voice cloning कसरी हुन्छ, ओठको lip sync कसरी मिल्छ — अनि तुरुन्तै DenDen Studio को त्यो टुक्रा प्रयोग गर्ने भाग बनाइदिन्छ। हरेक पाठले पहिले अत्यावश्यक कुरा दिन्छ, ताकि तपाईं कहिल्यै अत्तालिनु नपरोस्; र कुनै विषयमा थप गहिराइ भए, header को वैकल्पिक Full Depth switch ले चाहेको बेला त्यो गहिरो अध्ययन खोल्छ। Capstone सम्म पुग्दा तपाईं नयाँ project सुरु गरिरहनुभएको हुँदैन — आफैंले बनाइसकेका, बुझिसकेका भागहरू जोड्दै हुनुहुन्छ। रणनीति यही हो: एउटा टुक्रा सिक, एउटा टुक्रा जोड, अनि तयार app नै टुक्राहरू मिल्छन् भन्ने प्रमाण बनोस्।",
      },
      {
        "heading": "What you need before we start",
        "bullets": [
          "A machine with a modern GPU helps a lot, but CPU-only paths are shown too.",
          "Comfort with Python and a terminal; we build the backend in stages.",
          "Curiosity about <b>how</b>, not just <b>which button</b>.",
        ],
        "narration_en": "Last, a quick honest word about what you need. A machine with a modern graphics card will make everything faster and more fun, but you're not locked out without one — wherever a model needs a GPU, we'll also show the CPU-friendly path and the tradeoff you're making. You should be comfortable reading Python and living in a terminal; we build the backend in small stages, never one giant leap. And the one thing that actually matters: bring curiosity about how things work, not just which button to press. This course keeps opening the hood — why a model loads slowly the first time, why a voice sounds robotic, why lips drift out of sync — because understanding the why is what lets you fix the thing when it breaks at eleven at night. Alright. Next lesson, we zoom into the anatomy of an LLM app and why open source is the backbone. Let's build.",
        "narration_ne": "अन्त्यमा, तपाईंलाई के चाहिन्छ भन्नेबारे एउटा इमानदार कुरा। आधुनिक graphics card भएको मेसिनले सबै कुरा छिटो र रमाइलो बनाउँछ, तर नभए पनि तपाईं बाहिर हुनुहुन्न — जहाँ model लाई GPU चाहिन्छ, त्यहाँ CPU मै चल्ने बाटो र त्यसको मोल पनि देखाइनेछ। तपाईंलाई Python पढ्न र terminal मा काम गर्न सहज हुनुपर्छ; backend हामी साना-साना चरणमा बनाउँछौं, कहिल्यै एकैचोटि ठूलो फड्को होइन। र साँच्चै महत्त्व राख्ने एउटै कुरा: कुन button थिच्ने भन्दा पनि, चीजहरू कसरी चल्छन् भन्ने जिज्ञासा ल्याउनुहोस्। यो course बारम्बार बनेटको ढक्कन खोल्छ — पहिलोपटक model किन ढिलो load हुन्छ, आवाज किन यन्त्रजस्तो सुनिन्छ, ओठ किन बेमेल हुन्छ — किनभने 'किन' बुझ्नुले नै राति एघार बजे केही बिग्रँदा त्यसलाई सुधार्न सक्ने बनाउँछ। हुन्छ। अर्को पाठमा हामी LLM app को बनोट र open source किन मेरुदण्ड हो भन्नेमा पस्छौं। बनाउन थालौं।",
      },
    ],
  },
  # ────────────────────────────────────────────────────────────────────
  {
    "id": "anatomy-of-an-llm-app",
    "title": "Anatomy of an LLM App: Models, Orchestration & Why Open Source",
    "subtitle_en": "The brain, the hands, and the wiring between",
    "subtitle_ne": "दिमाग, हात, र बीचको तार",
    "intro_en": "the parts every model-powered app is made of, and who does what",
    "intro_ne": "हरेक model-सञ्चालित app का भागहरू, र कसले के गर्छ",
    "slides": [
      {
        "heading": "A model is not an app",
        "bullets": [
          "A model is a <b>function</b>: text in, text (or audio, or motion) out.",
          "An app is everything <i>around</i> the model — state, orchestration, UI, storage.",
          "Most of your work lives in the wiring, not the model.",
        ],
        "narration_en": "Here's a distinction that saves months of confusion: a model is not an app. A model is really just a function — you hand it some input, it hands back some output, and then it forgets you ever existed. The language model takes text and returns text. The voice model takes text and returns audio. The talking-head model takes audio and a picture and returns motion. That's all a model is: a stateless function. An app, on the other hand, is everything around that function — it remembers the conversation, decides which model to call and in what order, shows a user interface, stores the uploads, handles the errors when a model chokes. New builders think the model is the hard part. It isn't. The model is one ingredient; the app is the kitchen, the recipe, and the waiter. Most of your actual work in this course lives in the wiring, not in the models themselves.",
        "narration_ne": "महिनौंको अन्योल बचाउने एउटा भेद यहाँ छ: model भनेको app होइन। Model त वास्तवमा एउटा function मात्र हो — तपाईं केही input दिनुहुन्छ, त्यसले केही output फर्काउँछ, अनि तपाईंलाई भुलिहाल्छ। भाषाको model ले text लिन्छ, text फर्काउँछ। आवाजको model ले text लिन्छ, audio फर्काउँछ। Talking-head model ले audio र फोटो लिन्छ, चाल फर्काउँछ। Model भनेको यत्ति नै हो: सम्झना नराख्ने function। तर app चाहिँ त्यो function वरिपरिको सबै कुरा हो — यसले कुराकानी सम्झन्छ, कुन model कुन क्रममा बोलाउने भन्ने निर्णय गर्छ, user लाई interface देखाउँछ, upload भण्डारण गर्छ, कुनै model अल्झँदा त्रुटि सम्हाल्छ। नयाँ बनाउनेहरू model नै गाह्रो भाग हो भन्ठान्छन्। होइन। Model एउटा सामग्री मात्र हो; app चाहिँ भान्सा, परिकार-विधि, र पस्कने मान्छे हो। यो course मा तपाईंको वास्तविक काम model भित्र होइन, बीचको तारमा हुन्छ।",
      },
      {
        "heading": "Orchestration: the conductor",
        "bullets": [
          "One request often needs <b>many</b> model calls in sequence.",
          "The orchestrator decides order, passes outputs as inputs, retries failures.",
          "In DenDen Studio, the LLM plans; the orchestrator runs the plan.",
        ],
        "narration_en": "The word that ties an LLM app together is orchestration. A single user request — make this picture say this line in this voice — is never one model call. It's a chain: understand the description, generate the speech, then drive the lips from that speech, then stitch it into video. Something has to stand over all of that like a conductor over an orchestra, deciding what plays when, taking the output of one model and feeding it as the input of the next, and catching it gracefully when a step fails. That something is the orchestrator, and it's ordinary code — loops, queues, error handling — not magic. In DenDen Studio there's a lovely twist: the language model itself writes the plan, in structured form, and then plain orchestration code executes that plan step by step. The brain decides; the hands carry it out. Keep those two roles separate in your head and the whole architecture stays clean.",
        "narration_ne": "LLM app लाई एकसाथ बाँध्ने शब्द हो orchestration, अर्थात् सञ्चालन। एउटै user अनुरोध — यो फोटोलाई यो वाक्य यो आवाजमा भनाऊ — कहिल्यै एउटै model call हुँदैन। यो त एउटा शृंखला हो: वर्णन बुझ्ने, बोली बनाउने, त्यही बोलीबाट ओठ चलाउने, अनि भिडियोमा जोड्ने। यी सबैमाथि, वादकवृन्दमाथिको सञ्चालकजस्तै, कसैले उभिनुपर्छ — कहिले के बज्ने भन्ने तय गर्ने, एउटा model को output लिएर अर्कोको input बनाउने, र कुनै चरण असफल हुँदा शालीनतापूर्वक सम्हाल्ने। त्यो कोही हो orchestrator, र यो त साधारण code हो — loop, queue, error सम्हाल्ने — कुनै जादु होइन। DenDen Studio मा एउटा मीठो मोड छ: भाषाको model आफैंले योजना लेख्छ, संरचित रूपमा, अनि साधारण orchestration code ले त्यो योजना चरण-चरण चलाउँछ। दिमागले निर्णय गर्छ; हातले पूरा गर्छ। यी दुई भूमिका दिमागमा छुट्याएर राख्नुभयो भने पूरै architecture सफा रहन्छ।",
      },
      {
        "heading": "Open source is the backbone",
        "bullets": [
          "Weights you can download, run, inspect, and fine-tune.",
          "No rate limits, no deprecation emails, no data leaving the box.",
          "Reproducible: pin a version and it behaves the same next year.",
        ],
        "narration_en": "We said it in lesson one, but here's the architectural reason open source is the backbone, not just a preference. When the model is open — the weights downloadable and the license permissive — you can run it, look inside it, and reshape it. Three things follow that a hosted API can never give you. One: control. No rate limit throttles your video, no surprise email announces your model is deprecated next month, and no bytes of a user's face leave your machine. Two: cost that scales with electricity, not with an invoice. Three, the quiet but crucial one: reproducibility. Pin an open model to a specific version and it behaves the same today, next month, and next year — which means your tests mean something and your bugs stay findable. A hosted model can shift under your feet silently. For an app that has to be trustworthy and debuggable, an open backbone isn't ideology — it's engineering.",
        "narration_ne": "पहिलो पाठमै भन्यौं, तर open source किन मेरुदण्ड हो — मन पर्ने कुरा मात्र होइन — भन्ने वास्तुगत कारण यहाँ छ। Model खुला हुँदा — weight download गर्न मिल्ने र license उदार — तपाईं त्यसलाई चलाउन, भित्र हेर्न, र पुनः आकार दिन सक्नुहुन्छ। hosted API ले कहिल्यै दिन नसक्ने तीन कुरा यसबाट आउँछन्। एक: नियन्त्रण। कुनै rate limit ले तपाईंको भिडियो रोक्दैन, अर्को महिना model बन्द हुने कुनै अप्रत्याशित email आउँदैन, र user को अनुहारको एक byte पनि तपाईंको मेसिनबाट बाहिर जाँदैन। दुई: खर्च जुन बिजुलीसँग बढ्छ, बिलसँग होइन। तीन, मौन तर महत्त्वपूर्ण: पुनरुत्पादनीयता। खुला model लाई निश्चित version मा पिन गर्नुहोस्, अनि यो आज, अर्को महिना, र अर्को वर्ष उस्तै व्यवहार गर्छ — जसको अर्थ तपाईंका test को अर्थ रहन्छ र bug पत्ता लगाउन सकिन्छ। hosted model त पैरमुनि मौन रूपमा सर्न सक्छ। भरपर्दो र debug गर्न मिल्ने app का लागि, खुला मेरुदण्ड विचारधारा होइन — इन्जिनियरिङ हो।",
      },
      {
        "heading": "The pieces you'll assemble",
        "code": "description ──▶ [LLM: plan]\n                 │\n     ┌───────────┼─────────────┐\n     ▼           ▼             ▼\n  [TTS]      [talking head]  [motion]\n  voice        lip sync       edits\n     └───────────┴─────────────┘\n                 ▼\n           [ffmpeg: video]",
        "narration_en": "Let's name the pieces you'll assemble, because this diagram is the course's table of contents. It starts with a description flowing into the language model, which produces a plan. From that plan, three families of media models do the heavy lifting: text-to-speech and voice cloning make the voice; a talking-head model makes the picture's lips move; and motion models handle the edits and extra animation. Finally, ffmpeg — the unglamorous, indispensable workhorse — stitches audio and frames into an actual video file. Every box on this diagram is a lesson or two, and every arrow is a piece of orchestration code you'll write. When a later lesson feels like it's floating in isolation, come back to this picture and find the box it's filling in. Nothing in this course is decoration — each piece has a home in this exact pipeline.",
        "narration_ne": "अब तपाईंले जोड्ने टुक्राहरूलाई नाम दिऔं, किनभने यो चित्र नै course को विषयसूची हो। यो सुरु हुन्छ वर्णन भाषाको model मा बग्दै, जसले एउटा योजना बनाउँछ। त्यो योजनाबाट, media model का तीन परिवारले भारी काम गर्छन्: text-to-speech र voice cloning ले आवाज बनाउँछन्; talking-head model ले फोटोको ओठ चलाउँछ; र motion model ले सम्पादन र थप animation सम्हाल्छन्। अन्त्यमा, ffmpeg — त्यो चमक नभएको तर अपरिहार्य कामदार — audio र frame जोडेर साँचो भिडियो file बनाउँछ। यो चित्रको हरेक बाकस एक-दुई पाठ हो, र हरेक तीर तपाईंले लेख्ने orchestration code को टुक्रा। पछिको कुनै पाठ एक्लै तैरिरहेजस्तो लागे, यही चित्रमा फर्केर त्यो भर्दै गरेको बाकस खोज्नुहोस्। यो course मा कुनै पनि कुरा सजावट होइन — हरेक टुक्राको यही pipeline मा घर छ।",
      },
      {
        "heading": "The mental model to keep",
        "big": "\"Stateless models, stateful app, orchestration in between.\"",
        "bullets": [
          "Models forget; your app remembers and coordinates.",
          "Every feature = which models, in what order, with what state.",
          "Design the wiring first; the models slot in.",
        ],
        "narration_en": "So here's the one sentence to carry out of this lesson: stateless models, stateful app, orchestration in between. The models forget everything the instant they answer; your app is what remembers and coordinates. Once that clicks, every new feature becomes a simple question — which models does it need, in what order, carrying what state? Answer that and you've designed the feature before writing a line of it. This is why we design the wiring first and slot the models in second: the wiring is the part that's actually yours, the part that makes DenDen Studio different from any other app calling the same open models. Get comfortable thinking this way now, because from the next lesson on we stop talking about the shape of apps and start building the pieces — beginning with the brain itself: running a real language model on your own machine.",
        "narration_ne": "त यो पाठबाट बोकेर जाने एउटै वाक्य यही हो: model हरू सम्झना नराख्ने, app सम्झना राख्ने, र बीचमा orchestration। Model हरूले जवाफ दिनासाथ सबै भुल्छन्; तपाईंको app नै सम्झने र समन्वय गर्ने कुरा हो। यो कुरा बुझेपछि, हरेक नयाँ feature एउटा सरल प्रश्न बन्छ — यसलाई कुन model चाहिन्छ, कुन क्रममा, कस्तो अवस्था बोकेर? यसको जवाफ दिनुभयो भने एक हरफ लेख्नुअघि नै feature डिजाइन भइसक्यो। यसैले हामी पहिले तार डिजाइन गर्छौं र model पछि जोड्छौं: तार नै साँच्चै तपाईंको हो, त्यही भागले DenDen Studio लाई उही खुला model बोलाउने अरू app भन्दा फरक बनाउँछ। अहिल्यै यसरी सोच्ने बानी बसाल्नुहोस्, किनभने अर्को पाठदेखि हामी app को आकारबारे कुरा गर्न छाडेर टुक्रा बनाउन थाल्छौं — दिमाग आफैंबाट सुरु गर्दै: आफ्नै मेसिनमा साँचो भाषाको model चलाउने।",
      },
    ],
  },
  # ────────────────────────────────────────────────────────────────────
  {
    "id": "running-local-llms",
    "title": "Ollama & Hugging Face: Running a Real LLM on Your Own Machine",
    "subtitle_en": "Stock the pantry once, keep one stove lit",
    "subtitle_ne": "भण्डार एकपटक भर, एउटा चुलो बालिराख",
    "intro_en": "pull a model, keep it warm, and carry the conversation yourself",
    "intro_ne": "model तान, न्यानो राख, र कुराकानी आफैं बोक",
    "slides": [
      {
        "heading": "Ollama: a package manager that grew a server",
        "bullets": [
          "<code>ollama pull llama3.1:8b</code> downloads; <code>ollama run</code> chats; <code>ollama ps</code> shows what's loaded.",
          "Disk model = cheap and passive; <b>memory</b> model = expensive and active.",
          "First request pays a load penalty; warm requests start instantly.",
        ],
        "narration_en": "Time to run the brain. The friendliest way onto a local language model is Ollama, which feels like a package manager that quietly grew a server. One install gives you a background service and a command line that reads like apt or brew: pull a model to download it, run to chat in the terminal, list to see what's on disk, ps to see what's loaded in memory right now. Hold onto that last distinction, because it's the first performance fact of local models. A model sitting on disk is cheap and passive — a few gigabytes doing nothing. A model in memory is the expensive, active thing, loaded on the first request and kept warm for a while. So the very first request after a cold start pays several seconds of loading; every request while it's warm starts generating almost instantly. When a call feels mysteriously slow, run ollama ps before you blame the model — chances are it just went cold.",
        "narration_ne": "अब दिमाग चलाउने बेला भयो। Local भाषाको model मा पुग्ने सबैभन्दा सहज बाटो हो Ollama, जुन चुपचाप server उमारेको package manager जस्तो लाग्छ। एक install ले background service र apt वा brew जस्तै पढिने command line दिन्छ: pull ले model download गर्छ, run ले terminal मै कुराकानी गराउँछ, list ले disk मा के छ देखाउँछ, ps ले अहिले memory मा के load छ देखाउँछ। यो अन्तिम भेद समातिराख्नुहोस्, किनभने यो local model को पहिलो प्रदर्शन-तथ्य हो। Disk मा बसेको model सस्तो र निष्क्रिय हुन्छ — केही gigabyte केही नगरी बसेको। Memory मा भएको model चाहिँ महँगो, सक्रिय कुरा हो, पहिलो अनुरोधमा load हुन्छ र केही बेर न्यानो रहन्छ। त्यसैले चिसो अवस्थापछिको पहिलो अनुरोधले केही सेकेन्ड load को मोल तिर्छ; न्यानो हुँदाको हरेक अनुरोध झन्डै तुरुन्तै सुरु हुन्छ। कुनै call अकारण ढिलो लागे, model लाई दोष दिनुअघि ollama ps चलाउनुहोस् — सम्भवतः यो भर्खरै चिसो भएको हो।",
      },
      {
        "heading": "Read a model tag like an engineer",
        "code": "llama3.1 : 8b - instruct - q4_K_M\n  │        │      │         │\nfamily   size   tuned    quantization\n              for chat   (4-bit)",
        "bullets": [
          "<b>instruct</b> follows instructions; <b>base</b> just continues text — pick instruct for apps.",
          "<b>q4</b> = 4-bit weights: smaller, faster, slightly less precise. Usually the right default.",
          "Pin the <i>full</i> tag like a dependency version — aliases move under you.",
        ],
        "narration_en": "A model tag like llama-three-point-one, colon, eight-b, instruct, q4-K-M looks like line noise, but it's four deliberate decisions, and reading it fluently is a real skill. The family tells you the lineage — llama here, with Qwen, Mistral, and Gemma as peers worth trying. The size, eight-b, is the quality-versus-speed-versus-memory triangle in a single number. Instruct versus base is the one beginners miss: instruct models are trained to follow instructions and chat, while base models just continue text — hand a base model your JSON schema and it'll cheerfully write more schema instead of filling it in. For app work you want instruct, essentially always. And q4-K-M is the quantization — four-bit weights, smaller and faster for a small precision cost, and usually exactly the right default. One habit to build now: pin the full tag the way you pin a dependency version, because short aliases quietly move to new models, and you want upgrades to happen when you choose them, not by surprise.",
        "narration_ne": "llama-three-point-one, कोलन, eight-b, instruct, q4-K-M जस्तो model tag हेर्दा बेसुरो जस्तो लाग्छ, तर यो चार वटा सोचिएका निर्णय हुन्, र यसलाई धाराप्रवाह पढ्न सक्नु साँचो सीप हो। Family ले वंश भन्छ — यहाँ llama, र Qwen, Mistral, Gemma पनि आजमाउन लायक साथी। Size, अर्थात् eight-b, गुणस्तर-बनाम-गति-बनाम-memory को त्रिकोण एउटै संख्यामा। Instruct बनाम base त्यो हो जुन नयाँले छुटाउँछन्: instruct model निर्देशन पालना गर्न र कुराकानी गर्न तालिम पाएका हुन्छन्, base model त text मात्र अगाडि बढाउँछन् — base model लाई JSON schema दिनुहोस्, यसले भर्ने होइन थप schema नै लेखिदिन्छ। App को कामका लागि झन्डै सधैं instruct नै चाहिन्छ। अनि q4-K-M भनेको quantization — चार-bit weight, सानो र छिटो, थोरै शुद्धताको मोलमा, र प्रायः ठ्याक्कै सही default। अहिल्यै बसाल्ने एउटा बानी: पूरा tag लाई dependency version झैं पिन गर्नुहोस्, किनभने छोटा alias चुपचाप नयाँ model तिर सर्छन्, र upgrade तपाईंले रोजेको बेला होस्, अचानक होइन।",
      },
      {
        "heading": "The API is stateless: you are the memory",
        "bullets": [
          "The chat endpoint has <b>no session</b> — every call resends the whole history.",
          "Append user turn → call → append assistant reply → repeat.",
          "Eventually trim or summarize old turns before the context window fills.",
        ],
        "narration_en": "Now the single most common beginner bug, and it's worth burning into memory: the chat API is stateless. It has no session, no memory of the last call. If you send only the newest message, the model has genuinely never heard the rest of the conversation. So every request must carry the entire history — the system message, every prior user and assistant turn, then the new message — and the model re-reads all of it each time. This is exactly the Sanji-in-the-galley idea from the story: the counter doesn't remember, the cook remembers. So every real app grows a small conversation-state layer: append the user's turn, call the model, append the assistant's reply, and repeat. Eventually the history gets long enough to threaten the context window, and you trim or summarize the oldest turns. For DenDen Studio's director this state stays small, but the discipline matters from day one — the editing loop later only works because prior plan versions ride along in the history.",
        "narration_ne": "अब सबैभन्दा सामान्य नयाँ-गल्ती, र यो दिमागमा कुँदेर राख्न लायक छ: chat API सम्झना नराख्ने हो। यसको कुनै session छैन, अघिल्लो call को कुनै सम्झना छैन। तपाईंले नयाँ सन्देश मात्र पठाउनुभयो भने, model ले साँच्चै बाँकी कुराकानी कहिल्यै सुनेकै हुँदैन। त्यसैले हरेक अनुरोधले पूरै इतिहास बोक्नुपर्छ — system सन्देश, हरेक अघिल्लो user र assistant पालो, अनि नयाँ सन्देश — र model ले हरेकपटक त्यो सबै फेरि पढ्छ। यो ठ्याक्कै कथाको भान्सामा Sanji को विचार हो: counter ले सम्झँदैन, भान्से ले सम्झन्छ। त्यसैले हरेक साँचो app मा एउटा सानो कुराकानी-अवस्था तह बन्छ: user को पालो थप, model बोलाऊ, assistant को जवाफ थप, अनि दोहोर्‍याऊ। पछि इतिहास यति लामो हुन्छ कि context window लाई खतरा हुन्छ, अनि तपाईं सबैभन्दा पुराना पालो काट्नुहुन्छ वा सारांश बनाउनुहुन्छ। DenDen Studio को director का लागि यो अवस्था सानै रहन्छ, तर अनुशासन पहिलो दिनदेखि नै महत्त्वपूर्ण छ — पछिको editing loop चल्नुको कारण नै अघिल्ला योजना-संस्करण इतिहासमा सँगै आउनु हो।",
      },
      {
        "heading": "Sampling: dial in determinism",
        "code": "# the director role: reproducible\nresponse = chat(\n    model='llama3.1:8b',\n    messages=history,\n    options={'temperature': 0, 'seed': 42},\n)",
        "bullets": [
          "<b>temperature 0</b> + a fixed <b>seed</b> → same input, same output. Debuggable.",
          "Higher temperature (0.7–1.0) only where variety is the feature.",
          "<code>num_predict</code> caps output length.",
        ],
        "narration_en": "Generation is sampling from a probability distribution, and you hold the dials. Temperature controls how adventurous each choice is: zero collapses to always picking the likeliest token, giving you near-deterministic output; somewhere around zero-point-seven to one gives natural variety. Seed fixes the random draw so a run reproduces exactly. And num-predict caps how many tokens come back. Here's the rule that matters for our app: the director role — the language model that plans the video — wants temperature zero and a fixed seed. Same request, same plan, every time. That's what makes diffs meaningful, bugs reproducible, and golden-set tests possible. Save the higher temperatures for genuinely creative surfaces, like brainstorming script ideas or alternative phrasings, where variety is a feature and not a bug. Determinism where you need trust, creativity where you want surprise — and you choose which, per call.",
        "narration_ne": "Generation भनेको सम्भाव्यता वितरणबाट नमुना टिप्नु हो, र डायलहरू तपाईंकै हातमा छन्। Temperature ले हरेक छनोट कति साहसिक हुने भन्ने नियन्त्रण गर्छ: शून्यले सधैं सबैभन्दा सम्भावित token टिप्ने बनाउँछ, झन्डै निश्चित output दिन्छ; झन्डै शून्य दशमलव सात देखि एक सम्मले स्वाभाविक विविधता दिन्छ। Seed ले अनियमित छनोट स्थिर बनाउँछ, ताकि run ठ्याक्कै दोहोरियोस्। अनि num-predict ले कति token फर्कने भन्ने सीमा राख्छ। हाम्रो app का लागि महत्त्वपूर्ण नियम यही हो: director भूमिका — भिडियो योजना बनाउने भाषाको model — लाई temperature शून्य र स्थिर seed चाहिन्छ। उही अनुरोध, उही योजना, हरेकपटक। यसैले diff को अर्थ रहन्छ, bug दोहोर्‍याउन सकिन्छ, र golden-set test सम्भव हुन्छ। बढी temperature चाहिँ साँच्चै सिर्जनात्मक ठाउँमा राख्नुहोस्, जस्तै script का विचार वा फरक वाक्यांश सोच्दा, जहाँ विविधता गुण हो, दोष होइन। भरोसा चाहिने ठाउँमा निश्चितता, अचम्म चाहिने ठाउँमा सिर्जना — र कुन चाहिने, तपाईं हरेक call मा रोज्नुहुन्छ।",
      },
      {
        "heading": "When to reach for Hugging Face instead",
        "bullets": [
          "Ollama serves the app's text brain over HTTP — simple, warm, reliable.",
          "Hugging Face <code>transformers</code> loads a model <i>inside</i> Python — logits, embeddings, internals.",
          "You'll use both: Ollama for the LLM, transformers for the media models in Parts 2–3.",
        ],
        "narration_en": "Finally, the other hand. Ollama is perfect when you want a text brain served over HTTP — warm, simple, reliable, out of your way. But sometimes you need to reach inside the model, and that's where Hugging Face transformers comes in: it loads a model directly inside your Python process. You pay for that with environment setup and manual memory management, and you gain what a server can't offer — access to internals like logits, embeddings, and attention, plus custom processing and the entire media-model ecosystem. And that ecosystem is exactly where Parts two and three of this course live: Whisper, XTTS, the talking-head models — most of them are transformers or PyTorch code you drive from Python, not a tidy Ollama server. So the working split is clear and it holds for the whole course: Ollama serves the app's language brain; transformers is how Python touches models directly. You'll be fluent in both before we're halfway done. Next lesson, we make this brain do something structured — drive your code with tool calls.",
        "narration_ne": "अन्त्यमा, अर्को हात। Ollama उत्तम हुन्छ जब तपाईंलाई HTTP मार्फत पस्किएको text दिमाग चाहिन्छ — न्यानो, सरल, भरपर्दो, बाटो नछेक्ने। तर कहिलेकाहीं model भित्रै पुग्नुपर्छ, अनि त्यहीँ Hugging Face transformers आउँछ: यसले model लाई सोझै तपाईंको Python process भित्र load गर्छ। यसको मोल तपाईं environment मिलाउने र आफैं memory सम्हाल्नेमा तिर्नुहुन्छ, र बदलामा server ले दिन नसक्ने कुरा पाउनुहुन्छ — logits, embedding, र attention जस्ता भित्री भागमा पहुँच, अनि custom प्रशोधन र सिंगो media-model पारिस्थितिकी। र त्यही पारिस्थितिकीमा यो course का दोस्रो र तेस्रो भाग बस्छन्: Whisper, XTTS, talking-head model — तीमध्ये प्रायः transformers वा PyTorch code हुन्, जसलाई तपाईं Python बाट चलाउनुहुन्छ, सफा Ollama server होइन। त बाँडफाँड स्पष्ट छ र पूरै course भरि टिक्छ: Ollama ले app को भाषाको दिमाग पस्कन्छ; transformers चाहिँ Python ले model लाई सोझै छुने तरिका हो। आधा नपुग्दै तपाईं दुवैमा दक्ष हुनुहुनेछ। अर्को पाठमा, हामी यो दिमागलाई केही संरचित काम गराउँछौं — tool call ले तपाईंको code चलाउने।",
      },
    ],
  },
]

if __name__ == "__main__":
    course_dir = os.path.abspath(os.path.join(HERE, ".."))
    pres_build.build(course_dir, MODULES)
