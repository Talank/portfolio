window.LESSONS = window.LESSONS || {};
window.LESSONS['pytorch-fundamentals'] = {
  id: 'pytorch-fundamentals',
  title: 'PyTorch: Tensors, Autograd & the Training Loop',
  category: 'Part 3 — Deep Learning',
  timeMin: 55,
  summary: 'You\'ve built neurons, derived backprop, and tuned optimizers by hand — now meet the tool that automates all of it. PyTorch is three ideas: tensors (numpy that runs on GPUs), autograd (the backward sweep, recorded for you at runtime), and nn.Module (composable layers that know their own parameters). Master these and every model in the rest of the course is just arranging the pieces.',
  goals: [
    'Explain what PyTorch automates and what it doesn\'t — you still own the math, the loop, and the debugging',
    'Manipulate tensors confidently: shape, dtype, device, and the broadcasting rules behind most bugs',
    'Trace what requires_grad, backward(), .grad, no_grad(), and detach() each do to the autograd graph',
    'Write an nn.Module from scratch and know how it finds its parameters automatically',
    'Use Dataset/DataLoader for batching and save/load models the right way (state_dict)'
  ],
  concept: [
    {
      h: 'Why a framework exists (what you\'d otherwise write by hand)',
      p: [
        'In the backprop lab you derived gradients for a 2-layer scalar net — six lines of careful algebra, verified numerically. Now imagine doing that for a 50-layer network with convolutions, attention, and normalization, then re-deriving after every architecture tweak, then hand-porting all of it to GPU kernels. That stack of misery is what PyTorch deletes. It gives you: <b>tensors</b> — n-dimensional arrays with numpy\'s API that transparently run on GPUs; <b>autograd</b> — every operation records itself so one .backward() call executes the exact bucket-brigade you built by hand; and <b>nn</b> — layers, losses, and optimizers as tested, composable parts.',
        'What it does NOT do: choose your architecture, your loss, your learning rate, or debug your shapes. The math you learned stays load-bearing — PyTorch just executes it. The right mental model: you learned to compute gradients by hand so that you can now let a machine do it <em>while knowing exactly what the machine is doing</em>. That\'s the difference between an engineer and an API-caller, and interviews probe for it relentlessly.'
      ]
    },
    {
      h: 'Tensors: numpy with two superpowers',
      p: [
        'A torch.Tensor is an n-dimensional array with three attributes you will check a hundred times a day: <b>.shape</b> (the dimensions — e.g. a batch of 32 RGB images is [32, 3, 224, 224]), <b>.dtype</b> (float32 by default; float16/bfloat16 for speed, int64 for class labels), and <b>.device</b> (cpu or cuda:0). The two superpowers over numpy: a tensor can live on a GPU — x.to("cuda") moves it, and subsequent ops run on thousands of cores — and a tensor can carry gradient history (next section).',
        '<b>Broadcasting</b> is the rule-set that lets shapes [32, 10] and [10] add without loops: align shapes from the RIGHT; dimensions match if equal or if one is 1 (which gets stretched). So [32, 10] + [10] works (the vector is added to every row — exactly how a bias applies to a batch), [8, 1, 6] * [7, 1] → [8, 7, 6], but [32, 10] + [32] fails. Broadcasting is behind both the elegance of tensor code and the sneakiest bug class: shapes that broadcast when you didn\'t intend (a [N,1] meeting an [N] silently makes [N,N] — the classic loss-won\'t-decrease mystery).',
        'The daily-driver ops: x.view/x.reshape (reinterpret shape), x.permute/x.transpose (reorder axes), x.unsqueeze(d)/x.squeeze (add/remove size-1 dims), torch.cat/torch.stack (join), and @ / torch.matmul (batched matrix multiply — on [B, n, m] @ [B, m, p] it does B independent multiplies at once, the core of attention in Part 5). Print .shape early and often; shape discipline IS PyTorch fluency.'
      ]
    },
    {
      h: 'Autograd: your backprop lab, automated at runtime',
      p: [
        'Set requires_grad=True on a tensor and every operation touching it appends a node to a graph — <em>as the code runs</em>. This is "define-by-run": the graph is built dynamically by ordinary Python execution, so loops, ifs, and even print statements just work (the older "define-and-run" style — TensorFlow 1.x — made you declare a static graph up front and then feed it). When you call loss.backward(), PyTorch walks that recorded graph in reverse — multiplying local derivatives, summing at merge points, exactly your cannon post-mortem — and deposits ∂loss/∂p into each parameter\'s <b>.grad</b> field, then frees the graph.',
        'Three controls you must know: <b>with torch.no_grad():</b> — a context where nothing is recorded; mandatory for eval loops (saves the memory of stored activations and the time of graph-building). <b>x.detach()</b> — returns the same data severed from history: gradients will not flow back through it (used for logging, for freezing a computation, and inside tricks like "stop-gradient"). <b>.grad accumulates</b> — backward() ADDS into .grad rather than overwriting, hence optimizer.zero_grad() at the top of every step (and hence gradient accumulation works for free).',
        '<div class="math">forward: record ops → backward(): sweep graph, fill p.grad → optimizer.step(): p ← p − η·f(p.grad)<span class="mnote">the three-beat rhythm of every PyTorch training step. You derived beat two by hand last lesson; now it\'s one method call.</span></div>'
      ]
    },
    {
      h: 'nn.Module: layers that know their own parameters',
      p: [
        'An nn.Module is a container with one contract: store your layers in __init__, define the data flow in forward(). The magic is parameter registration: assigning self.fc = nn.Linear(784, 256) makes the module remember fc\'s weight and bias, recursively through nested modules — so model.parameters() hands the optimizer every trainable tensor with zero bookkeeping from you. nn.Linear(in, out) is precisely the W (out×in) and b (out) from the neural-networks lesson; nn.ReLU, nn.Dropout, nn.LayerNorm are the rest of your toolkit as plug-in parts.',
        'You call the model like a function — model(x) — never model.forward(x) directly: the __call__ wrapper runs hooks and the train/eval machinery around your forward. And the train/eval discipline from last lesson lives here: model.train() / model.eval() flip the behavior of Dropout and BatchNorm submodules recursively.',
        'For quick stacks there\'s nn.Sequential (the training-dynamics lesson used it); the moment your data flow branches — skip connections, two inputs, attention — you write a custom Module. Every architecture in Parts 4–7, including GPT, is nothing but Modules containing Modules containing nn.Linear.'
      ]
    },
    {
      h: 'Dataset & DataLoader: the feeding machinery',
      p: [
        'A <b>Dataset</b> answers two questions: __len__ (how many examples?) and __getitem__(i) (give me example i, as tensors). A <b>DataLoader</b> wraps it and does the logistics of the mini-batch story from last lesson: batching (stacks examples into [B, ...] tensors), shuffling each epoch (unbiased gradient noise), and parallel loading (num_workers subprocesses prepare the next batches while the GPU chews the current one — without this, expensive preprocessing starves the GPU).',
        'The loop <code>for xb, yb in loader:</code> is where epochs physically happen. Two practical flags: pin_memory=True speeds CPU→GPU copies, and drop_last=True discards a ragged final batch when exact batch shape matters (e.g. for BatchNorm stability).'
      ]
    },
    {
      h: 'Devices, saving, and the bugs you\'ll actually hit',
      p: [
        '<b>Device discipline</b>: model.to(device) once, then every batch xb.to(device) inside the loop. All tensors in one operation must share a device — mixing gives the beloved "Expected all tensors to be on the same device" error, the #1 beginner crash. (device = "cuda" if torch.cuda.is_available() else "cpu" is the standard incantation; Apple Silicon uses "mps".)',
        '<b>Saving</b>: torch.save(model.state_dict(), path) — the state_dict is just an ordered dict of parameter tensors by name. Load with model.load_state_dict(torch.load(path)) into a freshly constructed model. Saving the whole pickled model object instead is fragile (breaks when your class definition moves) — state_dict is the professional convention, and it\'s exactly the format Hugging Face checkpoints (Part 6) are built on.',
        '<b>The bug parade</b>, so you recognize each on sight: shape mismatch in matmul (print .shape at each stage); accidental broadcast ([N,1] vs [N] → silent [N,N]); forgot zero_grad (loss jitters, gradients stale); forgot model.eval()/no_grad in validation (noisy metrics, memory climb); loss = int labels fed as float or vice versa (CrossEntropyLoss wants raw logits [B, C] and int64 targets [B]); device mismatch (the error names both devices — read it).'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'Franky\'s blueprints: the ship that debugs itself',
      text: 'Before Franky, damage control on the Going Merry was Usopp with a hammer and guesswork: when something broke mid-battle, he\'d patch symptoms because nobody knew how a stress in the rudder propagated to the mast joints. Merry died of accumulated mystery damage — hand-tuned, unmaintained, unrecorded. Franky builds the Thousand Sunny differently. Every beam, joint, and mechanism goes into the BLUEPRINTS as it is built — not planned up front and frozen, but recorded as construction actually happens, revisions and all (define-by-run: the graph is whatever the code actually did). Now when the Sunny takes a hit in battle, Franky doesn\'t guess: the damage report flows BACKWARD through the blueprint — this crack in the hull traces to that strut, which traces to that joint — every component\'s share of the fault computed automatically from the recorded structure (loss.backward() filling .grad). The crew then reinforces each part in proportion to its blame (optimizer.step()). Franky also knows when NOT to record: during a routine sail — no battle, no learning — he doesn\'t log every creak into the blueprints; that discipline saves paper and attention (torch.no_grad() around evaluation). Each named part of the ship is inventoried — "Soldier Dock System, channel 3" — so the whole ship\'s specification can be handed to any shipwright as a parts list (state_dict) rather than by shipping the ship. And the punchline hiding in plain sight: the Sunny is built from Adam Wood, the legendary timber that survives any battle. Of course it is. Every serious model since the transformer is built on AdamW too.'
    },
    sitcom: {
      show: 'TBBT',
      title: 'Sheldon derives, Howard ships',
      text: 'Sheldon insists real physicists work from first principles: for weeks he re-derives, by hand, on the whiteboard, results any grad student would import from a textbook. Howard — "only" an engineer, as Sheldon never tires of noting — grabs standard parts, tested tools, and NASA-grade libraries, and his hardware actually flies to space. The gag is that both are right, in sequence: when the Mars rover team hits an anomaly no tool anticipated, it\'s first-principles understanding that diagnoses it — but nobody hand-machines their own bolts on launch day. That\'s exactly the backprop lab versus this lesson: you derived σ\'(z) = h(1−h) and verified it numerically ONCE, Sheldon-style, so that you understand what the machine does; from now on you call loss.backward(), Howard-style, and ship. Engineers who only know the tools are helpless when NaNs appear; theorists who refuse the tools never train anything bigger than a whiteboard. The course made you Sheldon last lesson precisely so you could be Howard, credibly, in this one.'
    },
    why: 'Franky\'s blueprint is the whole autograd model in one image: recorded-as-built (define-by-run), damage flowing backward through the record (backward filling .grad), don\'t record routine sails (no_grad), ship the parts list not the ship (state_dict) — and it\'s literally made of Adam Wood. When an API name feels arbitrary, translate it back to the shipwright: "what would Franky record, and when would the blame flow?"'
  },
  storyAnim: {
    title: 'One training step aboard the Sunny',
    h: 250,
    props: [
      { id: 'blueprint', emoji: '📐', label: 'blueprint (autograd graph)', x: 50, y: 14 },
      { id: 'hull', emoji: '🛡️', label: 'hull (layer 1)', x: 20, y: 45 },
      { id: 'mast', emoji: '⛵', label: 'mast (layer 2)', x: 50, y: 45 },
      { id: 'cannon', emoji: '💣', label: 'cannon (output)', x: 80, y: 45 },
      { id: 'damage', emoji: '💥', label: 'damage = loss', x: 92, y: 75 },
      { id: 'ledger', emoji: '📋', label: 'state_dict: parts list', x: 12, y: 85 }
    ],
    actors: [
      { id: 'franky', emoji: '🔧', label: 'Franky', x: 8, y: 62 },
      { id: 'report', emoji: '📜', label: 'blame report', x: 92, y: 60 }
    ],
    steps: [
      { c: 'FORWARD: the battle happens — data flows hull → mast → cannon. Because this is a real engagement (requires_grad=True), every action is recorded onto the blueprint as it occurs.', p: { hull: 'lit', mast: 'lit', cannon: 'lit', blueprint: 'lit' } },
      { c: 'The shot lands 12 meters off. Damage assessed: that number is the loss, and it sits at the very end of the recorded chain.', p: { damage: 'bad' } },
      { c: 'loss.backward(): the damage report flows BACKWARD through the blueprint — cannon\'s share, then mast\'s, then hull\'s — local sensitivities multiplied along the recorded structure.', a: { report: [80, 60] }, p: { cannon: 'bad' } },
      { c: 'Each part is left holding its exact share of the blame in its .grad slot. No guesswork, no Usopp-with-a-hammer.', a: { report: [35, 60] }, p: { mast: 'bad', hull: 'bad' }, l: { blueprint: 'every part: .grad filled' } },
      { c: 'optimizer.step(): Franky reinforces each part in proportion to its blame — then zero_grad() wipes the slate so the next battle\'s blame doesn\'t pile onto this one\'s.', a: { franky: [50, 62] }, p: { hull: 'good', mast: 'good', cannon: 'good', damage: '' } },
      { c: 'On routine sails (validation), Franky doesn\'t record: torch.no_grad() — no blueprint updates, less paper, same ship. And the whole Sunny can be handed to another shipwright as a named parts list: the state_dict.', p: { blueprint: 'dim', ledger: 'good' } }
    ]
  },
  tech: [
    {
      q: 'What is the actual difference between no_grad(), detach(), and requires_grad_(False)?',
      a: 'Three tools, three scopes. torch.no_grad() is a CONTEXT: while inside, no operations are recorded at all — the standard wrapper for entire eval loops and for the optimizer\'s own update math; leaves existing tensors untouched. x.detach() acts on ONE TENSOR: returns a view of the same data with the history cut, so gradients cannot flow backward through this particular use — surgical, used to stop gradient along one path while the rest of the graph lives (e.g., logging loss.detach().item(), target networks in RL, stop-gradient tricks). p.requires_grad_(False) changes a PARAMETER permanently: autograd stops tracking it altogether — this is how you freeze layers for fine-tuning (Part 6 does exactly this to freeze a pretrained backbone). Interview phrasing: context vs tensor-edge vs parameter-flag.'
    },
    {
      q: 'How does model.parameters() actually find every weight, including in nested modules?',
      a: 'nn.Module overrides __setattr__: when __init__ executes self.fc = nn.Linear(...), the assignment is intercepted and fc is filed into an internal _modules dict (raw nn.Parameter tensors go into _parameters). parameters() then walks this tree recursively, yielding every registered tensor — which is why arbitrarily nested architectures need zero bookkeeping. The classic gotcha: layers hidden inside a plain Python list are NOT registered (a list isn\'t intercepted) — the optimizer silently never sees them and they never train. The fix is nn.ModuleList (or nn.ModuleDict). If a model mysteriously doesn\'t learn, printing sum(p.numel() for p in model.parameters()) against your hand-count is the 30-second diagnostic.'
    },
    {
      q: 'What does DataLoader\'s num_workers do, and when does it matter?',
      a: 'With num_workers=0 the SAME process that runs the GPU also loads and preprocesses each batch — the GPU idles while Python decodes images or tokenizes text. num_workers=k forks k subprocesses that each run your Dataset.__getitem__ in parallel, prefetching future batches into a queue so the GPU never waits. It matters exactly when per-example work is nontrivial (image decode/augmentation, audio, tokenization); for tensors already sitting in RAM it adds overhead for nothing. Rule of thumb: start at 4, watch GPU utilization (nvidia-smi) — if it\'s far below 100% while training, you\'re data-starved and more workers (or pin_memory=True, or pre-tokenizing) is the fix. This "keep the accelerator fed" instinct scales all the way up: at LLM-pretraining scale, data pipelines are a whole engineering discipline.'
    },
    {
      q: 'Why save state_dict instead of the whole model, and what is strict=False for?',
      a: 'torch.save(model) pickles the class instance — the file then silently depends on your exact source layout (module paths, class names) and PyTorch version; move train.py or rename the class and the checkpoint is unloadable. state_dict decouples: it\'s a plain {name: tensor} dict — "fc1.weight", "fc1.bias" — portable across code refactors; you reconstruct the architecture in code and pour the numbers in. load_state_dict(sd, strict=False) tolerates mismatches — missing keys stay initialized, unexpected keys are ignored — which is precisely how transfer learning loads a pretrained backbone into a model with a new head (Part 6\'s fine-tuning does this constantly). Full training checkpoints save more than the model: {model, optimizer.state_dict(), scheduler, epoch, RNG state} so a preempted run resumes exactly — Adam\'s m and s live in the optimizer state, remember, and losing them costs you a warmup.'
    }
  ],
  code: {
    title: 'The complete PyTorch vocabulary in one script',
    intro: 'A custom Module, a Dataset, the device dance, the three-beat loop, and a state_dict save — every API this lesson introduced, in the arrangement you\'ll reuse forever. Run it locally with: pip install torch.',
    code: `import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

device = "cuda" if torch.cuda.is_available() else "cpu"

class TwoTowers(nn.Module):                      # custom Module: init parts, wire in forward
    def __init__(self, d_in, d_hidden, n_classes):
        super().__init__()                       # NEVER forget this line
        self.body = nn.Sequential(
            nn.Linear(d_in, d_hidden), nn.ReLU(),
            nn.LayerNorm(d_hidden),
            nn.Linear(d_hidden, d_hidden), nn.ReLU(),
        )
        self.head = nn.Linear(d_hidden, n_classes)
    def forward(self, x):
        h = self.body(x)
        return self.head(h)                      # raw logits — CrossEntropyLoss wants these

class ToyData(Dataset):                          # Dataset: __len__ + __getitem__
    def __init__(self, n=1024):
        self.x = torch.randn(n, 20)
        self.y = (self.x[:, 0] * self.x[:, 1] > 0).long()   # int64 labels
    def __len__(self): return len(self.x)
    def __getitem__(self, i): return self.x[i], self.y[i]

loader = DataLoader(ToyData(), batch_size=64, shuffle=True, num_workers=2)
model = TwoTowers(20, 64, 2).to(device)          # model to device, once
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(5):
    model.train()
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)    # batch to device, every step
        opt.zero_grad()                          # beat 0: clear old blame
        loss = loss_fn(model(xb), yb)            # beat 1: forward (recorded)
        loss.backward()                          # beat 2: backward sweep
        opt.step()                               # beat 3: apply updates
    print(f"epoch {epoch}: loss {loss.item():.3f}")   # .item(): tensor -> float, detached

torch.save(model.state_dict(), "model.pt")       # parts list, not the ship
# later: m = TwoTowers(20, 64, 2); m.load_state_dict(torch.load("model.pt")); m.eval()`,
    notes: [
      'super().__init__() before any layer assignment — skipping it breaks parameter registration with a confusing error. It\'s the most-typed line in deep learning.',
      'The labels are .long() (int64) and the model outputs raw logits: CrossEntropyLoss fuses log-softmax + NLL internally (the p − y gradient from backprop). Feeding it softmaxed outputs is the double-softmax bug.',
      'loss.item() converts the scalar tensor to a Python float AND detaches — logging with bare loss would keep the whole graph alive and leak memory across epochs.',
      'Count what YOU wrote versus Part 3\'s theory: the architecture, the loss choice, the loop discipline. What PyTorch wrote: every gradient. That division of labor is the whole point.'
    ]
  },
  lab: {
    title: 'Write the Module and the loop (static-checked)',
    prompt: 'PyTorch isn\'t available in the browser, so this lab is STATIC-CHECKED: write real code, the checkers verify its structure, and the solution tab shows the reference to diff against (then run it locally if you have Python + torch). Task: (1) define class <code>MLP(nn.Module)</code> — __init__ takes (d_in, d_hidden, n_classes), builds Linear→ReLU→Dropout(0.1)→Linear; forward returns raw logits; (2) write <code>train_one_epoch(model, loader, opt, loss_fn, device)</code> — the full three-beat loop with device moves; (3) write <code>evaluate(model, loader, device)</code> — eval mode + no_grad, returning mean accuracy.',
    starter: `import torch
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, d_in, d_hidden, n_classes):
        # super().__init__() first! then: Linear -> ReLU -> Dropout(0.1) -> Linear
        ...

    def forward(self, x):
        ...

def train_one_epoch(model, loader, opt, loss_fn, device):
    # train mode; per batch: to(device), zero_grad, forward, loss, backward, step
    ...

def evaluate(model, loader, device):
    # eval mode; no_grad; accuracy = fraction of argmax(logits) == labels
    ...`,
    checks: [
      { re: 'class\\s+MLP\\s*\\(\\s*nn\\.Module\\s*\\)', must: true, hint: 'MLP must subclass nn.Module.', pass: 'nn.Module subclass ✓' },
      { re: 'super\\(\\)\\s*\\.\\s*__init__\\s*\\(\\)', must: true, hint: 'Call super().__init__() before assigning layers — parameter registration depends on it.', pass: 'super().__init__() ✓' },
      { re: 'def\\s+forward\\s*\\(\\s*self', must: true, hint: 'Define forward(self, x) — the data flow.', pass: 'forward() defined' },
      { re: 'nn\\.Dropout\\s*\\(\\s*0?\\.1\\s*\\)', must: true, hint: 'Include nn.Dropout(0.1) between the layers.', pass: 'Dropout present' },
      { re: '\\.train\\s*\\(\\s*\\)', must: true, hint: 'train_one_epoch must call model.train() — dropout needs to be ON.', pass: 'model.train() ✓' },
      { re: 'zero_grad\\s*\\(', must: true, hint: 'Clear accumulated gradients each step: opt.zero_grad().', pass: 'zero_grad ✓' },
      { re: '\\.backward\\s*\\(\\s*\\)', must: true, hint: 'Run the backward sweep: loss.backward().', pass: 'backward ✓' },
      { re: 'opt\\.step\\s*\\(\\s*\\)|\\.step\\s*\\(\\s*\\)', must: true, hint: 'Apply the update: opt.step().', pass: 'optimizer.step ✓' },
      { re: '\\.to\\s*\\(\\s*device\\s*\\)', must: true, hint: 'Move each batch to the device: xb.to(device), yb.to(device).', pass: 'device moves ✓' },
      { re: '\\.eval\\s*\\(\\s*\\)', must: true, hint: 'evaluate() must call model.eval() — dropout OFF for honest metrics.', pass: 'model.eval() ✓' },
      { re: 'no_grad\\s*\\(', must: true, hint: 'Wrap evaluation in torch.no_grad() — no graph recording during eval.', pass: 'no_grad ✓' },
      { re: 'softmax', must: false, hint: 'No softmax in the model — CrossEntropyLoss takes raw logits (double-softmax is a real bug).', pass: 'No stray softmax' }
    ],
    tests: '',
    runnable: false,
    solution: `import torch
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, d_in, d_hidden, n_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_in, d_hidden),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_hidden, n_classes),
        )

    def forward(self, x):
        return self.net(x)          # raw logits

def train_one_epoch(model, loader, opt, loss_fn, device):
    model.train()
    total = 0.0
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        opt.zero_grad()
        loss = loss_fn(model(xb), yb)
        loss.backward()
        opt.step()
        total += loss.item()
    return total / len(loader)

def evaluate(model, loader, device):
    model.eval()
    correct, seen = 0, 0
    with torch.no_grad():
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            pred = model(xb).argmax(dim=1)
            correct += (pred == yb).sum().item()
            seen += yb.numel()
    return correct / seen`,
    notes: [
      'To run locally: pip install torch, then feed it the ToyData/DataLoader from the worked example above — accuracy should climb past 90% in a few epochs.',
      'Every check the lab enforces is a real production bug when missing: no train() → dropout silently off; no zero_grad → stale blame; no eval()/no_grad → noisy metrics and creeping memory.',
      'argmax(dim=1) picks the highest logit per row — no softmax needed for accuracy, since softmax is monotonic (the ranking lesson from model evaluation paying rent again).'
    ]
  },
  quiz: [
    {
      q: 'Tensor a has shape [32, 10] and b has shape [10]. What does a + b do?',
      options: ['Broadcasts: b is added to each of the 32 rows — exactly how a bias applies across a batch', 'Raises a shape error', 'Adds b to the first row only', 'Concatenates them into [42, 10]'],
      correct: 0,
      explain: 'Align from the right: 10 matches 10; the missing dim is treated as 1 and stretched to 32. Beware the evil twin: [N,1] + [N] silently broadcasts to [N,N].'
    },
    {
      q: 'You call loss.backward() twice per step without zero_grad(). What happens?',
      options: ['Gradients from both calls ADD in .grad — updates use doubled/stale blame and training misbehaves silently', 'The second call overwrites the first', 'PyTorch raises an error immediately', 'Nothing — backward is idempotent'],
      correct: 0,
      explain: '.grad accumulates by design (that\'s what makes gradient accumulation possible). Without zero_grad you optimize with the sum of old and new gradients — a silent, classic bug. (Also, a second backward on the same graph needs retain_graph=True or errors — but the accumulation is the conceptual trap.)'
    },
    {
      q: '"RuntimeError: Expected all tensors to be on the same device, cuda:0 and cpu" — most likely cause?',
      options: ['The model was moved to GPU but the data batches were not (or vice versa) — add xb.to(device) in the loop', 'The GPU is out of memory', 'The learning rate is too high', 'num_workers is set too high'],
      correct: 0,
      explain: 'One operation received a GPU tensor and a CPU tensor. Discipline: model.to(device) once, every batch .to(device) inside the loop. The error message names both devices — it\'s telling you exactly what to look for.'
    },
    {
      q: 'Why is saving model.state_dict() preferred over torch.save(model)?',
      options: ['state_dict is a plain name→tensor dict, portable across code refactors and PyTorch versions; pickling the object breaks when the class moves', 'state_dict files are always smaller', 'torch.save(model) does not store the weights', 'state_dict also saves the optimizer automatically'],
      correct: 0,
      explain: 'Pickled models embed your source structure. state_dict decouples numbers from code — reconstruct the architecture, pour weights in. (Optimizer state must be saved separately for exact resume.)'
    },
    {
      q: 'Layers stored in a plain Python list inside your Module never train. Why?',
      options: ['Plain lists bypass __setattr__ registration, so parameters() never yields them and the optimizer never sees them — use nn.ModuleList', 'Lists are immutable in Python', 'The GPU cannot store lists', 'Dropout removed them'],
      correct: 0,
      explain: 'nn.Module intercepts attribute assignment to register submodules; a list is just a list. nn.ModuleList/ModuleDict are the registering containers. Diagnostic: count model.parameters() against your expectation.'
    }
  ],
  pitfalls: [
    'Calling model.forward(x) instead of model(x). The __call__ wrapper runs hooks and mode machinery; bypassing it works until the day it very much doesn\'t (hooks, compiled models).',
    'Logging with the raw loss tensor (losses.append(loss)) instead of loss.item(). Each stored tensor keeps its entire graph alive — the "memory slowly climbs every epoch" leak.',
    'view() after permute/transpose: non-contiguous memory raises errors or silently reorders data. Use .reshape() (copies if needed) or .contiguous().view() and know WHY: view reinterprets the same memory, permute only changes strides.',
    'Applying softmax before CrossEntropyLoss. The loss applies log-softmax internally; double-softmax flattens gradients and quietly caps accuracy. Logits out, always.',
    'Wrong dtype for labels: CrossEntropyLoss wants int64 class indices [B], not one-hot floats. MSELoss on classification (or float labels into CE) fails with shape/dtype errors — or worse, runs.',
    'Testing GPU code patterns only on CPU. Device bugs, num_workers deadlocks (Windows needs if __name__ == "__main__"), and pin_memory behavior only surface with the real configuration — smoke-test on the target device early.'
  ],
  interview: [
    {
      q: 'What does "dynamic computation graph" (define-by-run) mean, and why did PyTorch\'s approach win?',
      a: 'In define-by-run, the autograd graph is constructed as a side effect of ordinary code execution: each tensor op records itself when it runs, backward() consumes the recording, and the graph is rebuilt fresh every forward pass. The alternative (TensorFlow 1.x-style define-and-run) compiles a static graph up front and executes it later. Dynamic won on developer experience: Python control flow just works (loops over variable-length sequences, data-dependent branches, recursion), debugging is native (set a breakpoint, print a tensor mid-forward — impossible inside a compiled static graph), and research iteration speed follows. The static graph\'s advantage — whole-graph optimization for deployment — got absorbed as an opt-in compile step: TorchScript, and today torch.compile, which traces/compiles hot paths while keeping eager semantics for development. So the modern answer: develop eager, compile for production, and know that torch.compile can give 30-50% speedups for free on training loops.'
    },
    {
      q: 'Walk me through everything that happens in the line loss.backward() — at the systems level.',
      a: 'By the time backward is called, the forward pass has built a graph of Function nodes: each tensor op recorded its type, saved the tensors its derivative needs (inputs or outputs, chosen per-op to minimize memory), and linked to its parents via grad_fn. backward(1) seeds the loss node with gradient 1.0 and walks the graph in reverse topological order; each node runs its hand-written backward kernel — matmul\'s backward is two matmuls with transposes, sigmoid\'s multiplies by h(1−h) using the saved output — multiplying the incoming gradient by local Jacobian-vector products (never materializing full Jacobians). Where a tensor fed multiple consumers, incoming gradients are summed. At leaf tensors with requires_grad=True, results ACCUMULATE into .grad — hence zero_grad() each step. The graph\'s saved tensors are then freed (a second backward errors without retain_graph=True). Cost: same order as forward; memory: the saved activations, which is why training VRAM ≫ inference VRAM and why gradient checkpointing (recompute instead of save) exists.'
    },
    {
      q: 'How would you debug a PyTorch model whose loss doesn\'t decrease at all?',
      a: 'In order of hit-rate. (1) Overfit a single batch first: any healthy model can memorize 32 examples in a few hundred steps; if it can\'t, the bug is structural, not statistical. (2) Check the loss/output contract: CrossEntropyLoss expects raw logits and int64 labels — a stray softmax, sigmoid, or float labels silently cripple gradients. (3) Verify the optimizer actually holds the parameters: layers in plain Python lists never register — print sum(p.numel() for p in model.parameters()) against your architecture. (4) Check the loop discipline: zero_grad present, backward before step, model.train() on. (5) Print gradient norms per layer after backward: all-zero → detached graph somewhere (a .detach(), .item(), or numpy round-trip mid-forward); exploding → learning rate/clipping. (6) Check the data: shuffled labels, a broadcasting accident ([N,1] vs [N] making the loss a matrix mean), or normalization applied to labels. The single-batch overfit test is the professional\'s first move because it cleanly bisects "wiring bug" from "learning problem".'
    },
    {
      q: 'A training script crashes with CUDA out-of-memory. What are your options, in the order you\'d try them?',
      a: 'First understand WHAT fills memory: parameters, gradients (same size), optimizer state (2× parameters for AdamW), and — usually the biggest, batch-dependent — saved activations for backward. Options in order: (1) reduce batch size, the linear knob on activations, and use gradient accumulation to keep the same effective batch (identical math, more steps). (2) Mixed precision (torch.autocast + bf16/fp16): roughly halves activation memory and speeds up tensor cores — standard practice, not a compromise. (3) Gradient checkpointing: drop intermediate activations, recompute them during backward — trades ~30% compute for large activation savings; the default for fine-tuning big transformers. (4) Fused/8-bit optimizers (bitsandbytes) or SGD instead of AdamW to shrink optimizer state. (5) Sharding across devices — ZeRO/FSDP partition optimizer state, gradients, then parameters. (6) Hygiene items throughout: no stored loss tensors (use .item()), del + empty_cache for one-off spikes, no_grad in eval. This ladder — accumulation, mixed precision, checkpointing, sharding — is exactly the LoRA/QLoRA conversation coming in Part 6.'
    }
  ]
};
