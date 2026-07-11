window.LESSONS = window.LESSONS || {};
window.LESSONS['multi-framework-agents'] = {
  id: 'multi-framework-agents',
  title: 'Agent Frameworks: Google ADK, OpenClaw, CrewAI & MCP',
  category: 'Part 7 — RAG & Agents',
  timeMin: 60,
  summary: 'LangGraph gave one agent an explicit, graph-shaped control flow. This lesson zooms out two levels: first to MULTIPLE agents collaborating as a specialized team (the pattern CrewAI is built around, and the Straw Hats have been running the whole series), then to the protocol layer underneath all of it — MCP, which does for TOOLS what the using-models-apis lesson\'s interface did for MODELS: turn "every framework needs custom code for every tool" into "build the connector once, use it everywhere." Frameworks in this space multiply and change fast; the goal here is the durable judgment to evaluate any of them, not to memorize one.',
  goals: [
    'Explain the multi-agent orchestration pattern: why splitting work across specialized agents can outperform one generalist agent, and what new failure mode it introduces',
    'Compare framework design philosophies conceptually: graph-first control, role/crew-first orchestration, minimal code-first, and platform-integrated',
    'Explain MCP (Model Context Protocol) precisely: the M×N integration problem it solves and its client-server architecture',
    'Evaluate the real tradeoffs of a platform-integrated agent framework versus a platform-agnostic one',
    'Judge a new, unfamiliar agent framework by what it actually does underneath, rather than by name recognition or hype'
  ],
  concept: [
    {
      h: 'From one agent to a specialized team',
      p: [
        'Every agent built so far in this course has been ONE model handling an entire task, with access to whatever tools it needs. <b>Multi-agent orchestration</b> asks a different question: instead of one generalist agent with a large toolkit and a prompt trying to be good at everything, what if the work is split across SEVERAL smaller agents, each with a narrow role, a focused toolset, and a correspondingly focused system prompt — a "researcher" agent that only gathers information, a "writer" agent that only drafts content, an "editor" agent that only reviews and refines — coordinated by an orchestration layer that passes work between them?',
        'The case for this mirrors why human teams specialize at all: a narrow, focused prompt is measurably easier to get reliably good behavior from than one prompt trying to cover many different jobs at once (the same "narrow specialization beats one overloaded generalist" theme from the fine-tuning-lora lesson\'s LoRA discussion, and the using-models-apis lesson\'s model-routing idea — extended here from routing by TASK DIFFICULTY to routing by TASK ROLE). It also makes debugging more tractable: when something goes wrong, you can inspect which specialist\'s output was actually at fault, closer to LangGraph\'s per-node inspectability than diagnosing one long, tangled generalist transcript.',
        'The genuinely new cost, worth stating precisely rather than glossing over: multi-agent systems introduce a failure mode a single agent CANNOT have — miscommunication BETWEEN agents. If the researcher agent hands off an ambiguous or incomplete summary, the writer agent inherits that ambiguity and can confidently build an entire draft on a misunderstanding neither agent individually would have caught, since each only sees its own slice of the task. More agents also means more LLM calls (real cost and latency) and real coordination overhead. Multi-agent orchestration is a genuine engineering trade-off, not a strictly-better upgrade over a well-designed single agent — many tasks are better served by ONE well-scoped agent (agents-from-scratch\'s approach) than by the added complexity of a crew, and resisting "multi-agent by default" is itself a real skill.'
      ]
    },
    {
      h: 'Framework philosophies, compared conceptually',
      p: [
        '<b>Graph-first</b> (LangGraph, last lesson): you define nodes, edges, and state explicitly — maximal control over exact execution order, cycles, and branching, at the cost of more upfront structure to design. Best when a workflow\'s control flow is genuinely complex or needs checkpointing/pause-resume.',
        '<b>Role/crew-first</b> (CrewAI and similar): you primarily define AGENTS (a role, a goal, a persona/backstory shaping how that agent behaves) and TASKS, and the framework handles orchestrating how work flows between them — a higher-level abstraction purpose-built for exactly the specialized-team pattern above. Faster to stand up a working multi-agent system for a common "team of specialists" shape, at the cost of less fine-grained control over the EXACT sequence of internal steps than a graph-first framework gives you — you\'re trusting more of the control flow to the framework\'s own orchestration logic.',
        '<b>Minimal, code-first frameworks</b> (a category including lighter-weight tools like OpenClaw): prioritize writing plain functions as tools with as little registration ceremony and boilerplate as possible — a thinner abstraction layer, closer in spirit to the agents-from-scratch lesson\'s hand-rolled loop, but with just enough scaffolding (standardized tool-calling plumbing, provider abstraction) to avoid re-deriving the basics from zero. Appealing to teams who want close-to-the-metal control and minimal dependency weight, at the cost of less built-in structure for complex multi-agent or long-running workflows than a more opinionated framework provides out of the box.',
        '<b>Platform-integrated</b> (Google\'s Agent Development Kit, ADK, among others): built for close, first-class integration with a specific vendor\'s broader cloud and model ecosystem — the practical draw is reduced integration friction if you\'re already committed to that platform (deployment tooling, native access to that vendor\'s specific model lineup and infrastructure services), at a real cost in portability outside it. This is a scoped version of the using-models-apis lesson\'s hosted-vs-self-hosted-vs-local tradeoff, now one layer up: not "which model," but "which agent-building platform," with an analogous convenience-versus-lock-in trade to weigh deliberately.'
      ]
    },
    {
      h: 'The M×N problem: why every framework needing its own tool integrations doesn\'t scale',
      p: [
        'Step back and look at the ecosystem as a whole: there are many agent frameworks (LangChain/LangGraph, CrewAI, ADK, and others), and many tools/data sources an agent might need to connect to (Slack, a company database, GitHub, a file system, a search API, and so on). Without a shared standard, EVERY framework needs its OWN custom integration code for EVERY tool — LangChain needs a Slack integration, CrewAI needs a separate Slack integration, a third framework needs a third — an <b>M×N problem</b>: M frameworks times N tools means M×N distinct pieces of integration code, growing multiplicatively as either number grows, with most of that code duplicating the same underlying logic ("authenticate, send a message, handle the response") for slightly different frameworks.',
        '<b>MCP (Model Context Protocol)</b>, an open standard, turns this multiplicative problem into an additive one. An <b>MCP server</b> exposes a set of tools, resources (readable data), and prompts through one standardized protocol — built ONCE, per tool/data source, independent of which agent framework will eventually use it. An <b>MCP client</b> — built into an agent framework, or a product like Claude Desktop or Claude Code itself — can connect to ANY MCP server and discover and invoke whatever it exposes, using that same standard protocol, with zero custom code specific to that particular server. Build one MCP server per tool (N), one MCP client capability per framework (M), and every combination works — M+N pieces of work instead of M×N, and critically, a NEW tool added to the ecosystem is immediately usable by every EXISTING MCP-compatible framework with no changes to any of them.',
        'Mechanically, MCP uses a client-server architecture over a standard protocol (JSON-RPC-based messages) — a server can run locally (a process on the same machine, communicating over standard input/output) or remotely (over a network connection), and declares its available tools\' names, descriptions, and parameter schemas in a standard format the client can discover programmatically at connection time, rather than needing that information hard-coded per-integration ahead of time. This is a direct extension of the LLM-agnostic design principle running through this whole Part — using-models-apis and agents-from-scratch standardized the connection between AGENT CODE and MODELS; MCP standardizes the connection between AGENT CODE and TOOLS/DATA, the other half of what an agent actually needs to be useful.'
      ]
    },
    {
      h: 'Choosing, practically — and staying current without chasing every new framework',
      p: [
        'There is no universally correct framework choice; the right decision depends on concrete project factors. Does the task genuinely need MULTIPLE specialized agents, or would one well-scoped agent (this course\'s agents-from-scratch approach, possibly with LangGraph\'s structure if the control flow is complex) serve just as well with less coordination overhead — resist defaulting to multi-agent because it\'s the more sophisticated-sounding option. How much control over EXACT execution order and state do you need versus how much can be trusted to a higher-level orchestration abstraction. Is the team already committed to a specific cloud/model platform where an integrated framework genuinely reduces friction, or does platform-agnosticism (this course\'s recurring emphasis) matter more for this project\'s constraints. Does the tool/integration ecosystem you need already exist as MCP servers, meaningfully reducing custom integration work regardless of which agent framework you ultimately choose.',
        'The field of specific frameworks will keep changing — new ones will appear, existing ones will add and deprecate features, and specific API syntax from this very lesson may look dated within a year or two. What doesn\'t change nearly as fast: the underlying concepts this entire Part 7 has built, in order — retrieval and grounding (embeddings-rag), the tool-use loop and ReAct pattern (agents-from-scratch), LLM-agnostic provider interfaces (using-models-apis), graph-based control flow and checkpointing (langchain-langgraph), specialized multi-agent orchestration, and now standardized tool connectivity (this lesson). Evaluating a brand-new framework a year from now is a matter of asking "what does this actually do underneath — is it graph-first, crew-first, minimal, or platform-integrated; does it speak MCP; what\'s its actual control-flow and state model" — questions this course has now equipped you to answer for yourself, rather than needing to be told the answer by whichever framework currently has the most attention.'
      ]
    }
  ],
  story: {
    onePiece: {
      title: 'A crew of specialists, and a world that speaks one protocol',
      text: 'It never occurs to anyone that Luffy should try to navigate, cook, heal, negotiate, AND fight single-handedly — the crew works precisely because it doesn\'t operate that way. Nami navigates. Sanji cooks. Chopper heals. Robin researches. Usopp and Franky build. Each has a narrow role, the specific tools and skills that role needs, and nobody expects Zoro to suddenly plot a course or Chopper to suddenly negotiate a trade deal. Luffy\'s actual job, most of the time, isn\'t doing every task himself — it\'s recognizing WHICH crewmate a given problem belongs to and pointing them at it, exactly a coordinator delegating to specialists rather than a generalist attempting everything. This works beautifully — until it doesn\'t: the day Nami hands Usopp an urgent, hastily-worded instruction about which sail configuration she needs for an approaching storm, and Usopp, working from her ambiguous phrasing rather than her actual intent, rigs completely the wrong configuration — a mistake a single person doing both jobs themselves would never have made, because the miscommunication happens specifically IN THE HANDOFF between two separate people, not inside either person\'s own reasoning. Meanwhile, across every sea, one invisible piece of infrastructure makes coordination BETWEEN different crews and different islands possible at all: the Transponder Snail network. Before it existed (in this telling), every crew that wanted to reach a specific harbor\'s supply office, a specific black-market contact, or a specific ally needed its OWN custom private arrangement with each — a crew\'s access to the Baratie\'s kitchen supply line was a completely separate relationship from its access to a shipwright\'s yard, multiplied across every crew and every service that existed, an arrangement that scaled worse the bigger the world got. The Den Den Mushi changes this: any properly registered harbor, shop, or contact posts a STANDARD snail number, and ANY crew\'s OWN snail — regardless of which shipwright built their den den mushi, regardless of which crew they belong to — can dial straight through, using the exact same universal protocol every other snail in the world speaks. A brand-new shop opening on a brand-new island doesn\'t need a custom arrangement with every crew that might ever want to reach it; it posts one snail number, and every crew everywhere can already reach it, immediately, with zero setup on either side beyond that one connection.'
    },
    sitcom: {
      show: 'Friends',
      title: 'Renovating the apartment as a crew, and one phone number for everyone',
      text: 'When the gang tackles renovating Monica\'s apartment for a big event, nobody expects Ross to handle the electrical work, negotiate the contractor\'s price, AND do the physical labor all by himself. They split it by specialty, exactly like the Straw Hats: Monica handles logistics and scheduling. Chandler negotiates the budget. Joey handles the physical heavy lifting. Ross researches the actual permits and requirements. Someone — usually Monica — acts as coordinator, pointing each problem at whichever friend actually owns that kind of problem, rather than any one of them trying to do all four jobs personally. It works great — until the day Ross researches an updated permit requirement, mentions it to Monica in a rushed, incomplete way while she\'s juggling something else, and Chandler ends up negotiating the contractor\'s price based on the OLD requirement nobody properly relayed to him — a mistake none of them would have made working alone, because it lives specifically in the GAP between what Ross knew and what actually reached Chandler, not in either of their individual reasoning. Meanwhile, something duller but more foundational makes all their individual outside coordination possible at all: the plain phone system. Before it, reaching the pizza place meant one relationship, reaching the dry cleaner meant a completely separate one, reaching every single business in the city meant its own private arrangement, multiplied across every friend and every business that existed — genuinely unscalable the more people and businesses there are. The standard phone network fixes this structurally: any business posts one listed number, and literally ANYONE\'S phone — regardless of who manufactures it, regardless of which friend owns it — can dial straight through using the exact same protocol every phone understands. A brand-new restaurant opening down the street doesn\'t need a custom relationship with every person who might ever want to order from it; it gets one listed number, and it\'s reachable by everyone, immediately, no special setup required on either end.'
    },
    why: 'A specialized crew (or a specialized team of any kind) beats one person trying to do everything — narrow roles, focused tools, a coordinator delegating rather than personally executing every task — but it introduces a genuinely new failure mode neither a solo operator has: information getting garbled in the HANDOFF between specialists. And underneath all of it, a single UNIVERSAL PROTOCOL (Den Den Mushi, or the plain phone network) is what turns "everyone needs a custom private arrangement with everyone else" into "build one connection, reach everyone" — exactly what MCP does for agents and tools.'
  },
  storyAnim: {
    title: 'A specialized crew, and one universal snail line',
    h: 260,
    props: [
      { id: 'nami', emoji: '🍊', label: 'Nami: navigation', x: 10, y: 12 },
      { id: 'sanji', emoji: '🍳', label: 'Sanji: cooking', x: 30, y: 12 },
      { id: 'chopper', emoji: '🦌', label: 'Chopper: medicine', x: 50, y: 12 },
      { id: 'robin', emoji: '🌸', label: 'Robin: research', x: 70, y: 12 },
      { id: 'handoff', emoji: '⚠️', label: 'ambiguous handoff → wrong sail rigged', x: 30, y: 38 },
      { id: 'snail_net', emoji: '🐌', label: 'standard Den Den Mushi protocol', x: 78, y: 60 },
      { id: 'crewA', emoji: '⛵', label: 'any crew\'s snail', x: 60, y: 82 },
      { id: 'harborB', emoji: '🏝️', label: 'any registered harbor', x: 96, y: 82 }
    ],
    actors: [
      { id: 'luffy', emoji: '🏴‍☠️', label: 'Luffy: coordinator', x: 40, y: 30 }
    ],
    steps: [
      { c: 'The crew is specialized, not generalist: each member owns a narrow role and its own tools.', p: { nami: 'lit', sanji: 'lit', chopper: 'lit', robin: 'lit' } },
      { c: 'Luffy\'s real job most of the time: recognize which specialist a problem belongs to, and delegate.', p: {}, a: { luffy: [40, 20] } },
      { c: 'A rushed, ambiguous handoff between two specialists causes a mistake neither would have made alone — a failure mode unique to teams, not solo operators.', p: { handoff: 'bad' } },
      { c: 'Meanwhile, a standard protocol lets every crew reach every properly registered harbor or service.', p: { snail_net: 'lit' } },
      { c: 'ANY crew\'s snail can dial straight through to ANY registered harbor, using the exact same protocol — zero custom per-relationship setup.', p: { crewA: 'good', harborB: 'good' } },
      { c: 'A brand-new harbor posts one snail number and is immediately reachable by every crew everywhere — M+N, not M×N.', p: { harborB: 'good', crewA: 'good' } }
    ]
  },
  conceptFlow: {
    title: 'The mechanism, step by step: a specialized crew, one universal protocol',
    intro: 'Click any box to jump straight there, or press Play and just listen.',
    stages: [
      {
        label: 'Specialized crew',
        nodes: [
          { id: 'crew', text: 'Nami/Sanji/Chopper/Robin\nnarrow role, focused tools, focused prompt each' },
        ],
      },
      {
        label: 'Coordinator delegates',
        nodes: [
          { id: 'delegate', text: "Luffy's real job\nrecognize which specialist a problem belongs to" },
        ],
      },
      {
        label: 'New failure mode',
        nodes: [
          { id: 'handoff', text: 'Ambiguous handoff\nwrong sail rigged — a bug neither agent alone would make' },
        ],
      },
      {
        label: 'Universal protocol',
        nodes: [
          { id: 'snail', text: 'Standard Den Den Mushi protocol\nbuilt once, per harbor — not once per crew' },
        ],
      },
      {
        label: 'M+N, not M×N',
        nodes: [
          { id: 'reach', text: 'Any crew reaches any harbor\none connection each, every combination works' },
        ],
      },
    ],
    steps: [
      { active: ['crew'], note: 'The crew is specialized, not generalist — each member owns a narrow role and its own tools, exactly like a "researcher" agent versus a "writer" agent versus an "editor" agent.' },
      { active: ['delegate'], note: 'Luffy\'s real job most of the time isn\'t doing every task himself — it\'s recognizing which specialist a problem belongs to and delegating, exactly a coordinator orchestrating a multi-agent crew.' },
      { active: ['handoff'], note: 'A rushed, ambiguous handoff between two specialists causes a mistake neither would have made alone — a failure mode that ONLY exists at the boundary between agents, never inside a single well-scoped agent.' },
      { active: ['snail'], note: 'Meanwhile, a standard protocol lets every crew reach every registered harbor — built once, per harbor, independent of which crew will eventually use it. This is what MCP does for tools instead of harbors.' },
      { active: ['reach'], note: 'Any crew\'s snail dials straight through to any registered harbor using the exact same protocol — zero custom per-relationship setup. M crews + N harbors, not M×N custom arrangements.' },
    ],
  },
  tech: [
    {
      q: 'Precisely, what does multi-agent orchestration solve, and what NEW failure mode does it introduce that a single well-scoped agent cannot have?',
      a: 'It solves the prompt-and-toolset dilution problem of one generalist agent trying to be simultaneously good at many different, loosely related jobs — a narrow, focused prompt and toolset (a "researcher" agent, say) is measurably easier to get reliably correct behavior from than one prompt covering research, writing, and editing all at once, directly analogous to why the fine-tuning-lora lesson found narrow LoRA specialization effective and why the using-models-apis lesson recommended routing by task rather than one model for everything. The NEW failure mode: information passed BETWEEN agents (a handoff — one agent\'s output becomes another agent\'s input) can be ambiguous, incomplete, or simply misread by the receiving agent, in a way that neither agent\'s own individual reasoning was actually wrong about — the researcher agent may have gathered perfectly correct information and summarized it clearly by its own judgment, while the writer agent still misinterprets that summary and builds an entire draft on the misreading. A single agent handling both research and writing internally never has this specific failure mode, because there is no INTER-AGENT boundary for information to get lost crossing — the trade-off is a real one: multi-agent systems exchange "avoid overloading one agent\'s prompt" for "now debug a whole new class of handoff/coordination bugs," and this trade is only worth making when the specialization benefit clearly outweighs the coordination cost for the specific task at hand.'
    },
    {
      q: 'Explain the M×N integration problem precisely, and how MCP\'s client-server model reduces it to M+N.',
      a: 'Without a shared protocol, connecting M different agent frameworks to N different tools/data sources requires M×N distinct pieces of custom integration code — each framework needs its own bespoke code to talk to Slack, its own bespoke code to talk to a specific database, and so on, and this grows MULTIPLICATIVELY: adding one new tool means writing M new integrations (one per existing framework), and adding one new framework means writing N new integrations (one per existing tool) — a genuinely unscalable combinatorial burden as the ecosystem grows in either dimension. MCP factors this into two independent, additive pieces: a tool/data-source builds exactly ONE MCP SERVER, exposing its capabilities (tools, readable resources, prompts) through the standard MCP protocol, entirely independent of which agent framework will eventually connect to it; an agent framework builds exactly ONE MCP CLIENT capability, able to discover and invoke whatever any connected MCP server exposes, entirely independent of which specific tool/server it happens to be talking to at runtime. Total integration work becomes M (client implementations, one per framework) + N (server implementations, one per tool) instead of M×N, and — the more consequential practical effect — a NEW tool added to the ecosystem as an MCP server is immediately usable by every EXISTING MCP-compatible framework with zero changes to any of them, and a NEW framework that implements an MCP client immediately gains access to every EXISTING MCP server with zero per-server integration work on its part.'
    },
    {
      q: 'Compare the control/flexibility trade-off between a graph-first framework (LangGraph) and a role/crew-first framework — what do you gain and lose choosing the higher-level abstraction?',
      a: 'A graph-first framework requires you to explicitly define every node, every edge (including conditional routing logic), and the shape of the shared state — genuine, fine-grained control over exactly which step runs when, under exactly what condition, with the control flow itself fully inspectable as an explicit structure (last lesson\'s core argument). The cost is more upfront design work: you are responsible for correctly modeling the workflow\'s entire control flow yourself. A role/crew-first framework instead asks you to describe WHAT each agent\'s role and goal is and WHAT tasks need doing, and delegates the actual moment-to-moment orchestration (which agent runs when, how outputs get handed to the next agent) to the framework\'s own internal orchestration logic — you gain speed in standing up a working multi-agent system for the common "team of specialists working through a sequence of tasks" shape, since you don\'t have to hand-design the control-flow graph yourself. The cost is precisely the control you gave up: if the actual coordination logic you need diverges from the framework\'s built-in orchestration pattern — a genuinely unusual conditional handoff, a need for fine-grained checkpointing at a specific internal step — a crew-first framework may not expose the hooks to customize it as cleanly as a graph-first framework\'s explicit, fully-specified structure would. The practical rule: reach for crew-first abstractions when your multi-agent workflow fits the "specialized team working through roughly sequential or lightly-branching tasks" shape well; reach for graph-first control when the actual coordination logic is genuinely complex, unusual, or needs the checkpointing/pause-resume guarantees LangGraph provides as a first-class feature.'
    },
    {
      q: 'What are the real tradeoffs of adopting a platform-integrated agent framework (like Google ADK) versus a platform-agnostic one, and how does this parallel the using-models-apis lesson\'s hosted-vs-self-hosted discussion?',
      a: 'A platform-integrated framework offers reduced integration friction specifically WITHIN its own ecosystem — tighter, more seamless access to that platform\'s specific model lineup, deployment infrastructure, and supporting cloud services, often with less custom glue code needed than assembling an equivalent system from platform-agnostic pieces. The cost is the same one the using-models-apis lesson identified for hosted APIs versus self-hosting: dependency on a specific vendor\'s roadmap, pricing, and continued support for the exact features you\'re relying on, and reduced portability if a project later needs to run outside that platform (a different cloud provider, an on-premises deployment, a different underlying model family) — migrating a deeply platform-integrated agent system elsewhere is a genuinely larger undertaking than migrating a system built against portable abstractions from the start. The parallel to using-models-apis is precise, one layer up the stack: that lesson was about choosing a MODEL consumption path (hosted API vs self-hosted open-weight vs local); this is about choosing an AGENT-FRAMEWORK consumption path, and the same underlying question applies — how much does this specific project\'s constraints (team\'s existing platform commitments, deployment target, tolerance for vendor dependency, likelihood of needing to migrate later) favor convenience-within-one-ecosystem versus portability-across-many. Neither answer is universally correct; the mistake is picking either without deliberately weighing which side of that trade actually matters for the specific project at hand.'
    }
  ],
  code: {
    title: 'Two layers: role-based orchestration, and an MCP-style tool registry',
    intro: 'Pseudocode illustrating each layer\'s actual shape — a crew-style multi-agent setup, and a minimal MCP client/server interaction — structurally accurate, not tied to one specific framework\'s exact current syntax.',
    code: `# --- Role-based multi-agent orchestration (CrewAI-style shape) ---

researcher = Agent(role="Researcher", goal="Gather accurate, cited facts on the given topic",
                    tools=[search_tool, mcp_client.tools_from("wikipedia-server")])
writer = Agent(role="Writer", goal="Draft clear, well-structured content from provided research")
editor = Agent(role="Editor", goal="Check factual claims against the research and tighten the prose")

research_task = Task(agent=researcher, description="Research: {topic}")
writing_task = Task(agent=writer, description="Draft an article using: {research_output}")
editing_task = Task(agent=editor, description="Review and finalize: {draft}")

crew = Crew(agents=[researcher, writer, editor], tasks=[research_task, writing_task, editing_task])
result = crew.kickoff(inputs={"topic": "the history of the printing press"})
# the framework handles passing each task's output into the next -- and each HANDOFF is where
# miscommunication between agents (this lesson's new failure mode) actually happens


# --- An MCP-style client connecting to tool servers, framework-agnostic ---

# Server side (built ONCE, independent of which agent framework connects):
#   an MCP server for a company's ticket system exposes tools like
#   "get_ticket(id)", "list_open_tickets()", "add_comment(id, text)"
#   via the standard MCP protocol -- no knowledge of LangGraph, CrewAI, or ADK baked in.

# Client side (any MCP-compatible agent framework):
mcp_client.connect("ticket-system-server")           # one standard connection, any server
available_tools = mcp_client.list_tools("ticket-system-server")   # discovered, not hard-coded
result = mcp_client.call_tool("ticket-system-server", "get_ticket", {"id": 4821})

# Adding a SECOND, totally unrelated server costs nothing extra in calling-code complexity:
mcp_client.connect("github-server")
prs = mcp_client.call_tool("github-server", "list_open_prs", {"repo": "acme/webapp"})
# same call_tool() function, same client, zero per-server special-casing -- the M+N property`,
    notes: [
      'Notice crew.kickoff() hides the exact orchestration mechanics — this IS the control trade-off from the tech corner: fast to write, less visibility into precisely how work moves between agents than a hand-built LangGraph graph would give you.',
      'mcp_client.list_tools() DISCOVERING available tools at connection time (rather than requiring them hard-coded ahead of time) is a genuinely important MCP detail — a server can add a new tool, and any connected client can discover and use it without being updated.',
      'The second mcp_client.connect() call for a completely unrelated server (GitHub, not tickets) requiring zero changes to call_tool()\'s usage pattern is the M+N property made concrete: one client capability, any number of servers, no combinatorial growth in integration code.',
      'tools=[search_tool, mcp_client.tools_from("wikipedia-server")] shows the two tool-sourcing patterns from this Part combining naturally — hand-defined tools (agents-from-scratch) and MCP-discovered tools living side by side on the same agent.'
    ]
  },
  lab: {
    title: 'A role-based task router and an MCP-style tool registry',
    prompt: 'Pure Python, fully runnable. Implement (1) <code>route_task(task_type, specialists)</code> — specialists is a dict {task_type: handler_function}; look up and call the correct handler for the given task_type, raising a clear ValueError if no specialist handles that type (mirroring how a coordinator delegates to the right crew member, or raises an issue if nobody owns that job); (2) an <code>MCPRegistry</code> class with <code>register(server_name, tools)</code> (tools is a dict of {tool_name: function}) and <code>call(server_name, tool_name, *args, **kwargs)</code> — raising a clear error for an unknown server or unknown tool, and otherwise calling the tool and returning its result, demonstrating that calling code never needs to special-case which server it\'s talking to.',
    starter: `def route_task(task_type, specialists):
    # specialists: dict of {task_type: handler_function}
    # call and return the result of the matching handler, or raise ValueError if none matches
    ...

class MCPRegistry:
    def __init__(self):
        # storage for registered servers -> their tools
        ...

    def register(self, server_name, tools):
        # tools: dict of {tool_name: function}
        ...

    def call(self, server_name, tool_name, *args, **kwargs):
        # look up the server, then the tool, and call it -- raise clear errors if either is missing
        ...`,
    checks: [
      { re: 'def\\s+route_task\\s*\\(', must: true, hint: 'Define route_task(task_type, specialists).', pass: 'route_task() defined' },
      { re: 'raise\\s+ValueError', must: true, hint: 'route_task must raise ValueError for an unknown task_type — no silent failure.', pass: 'ValueError raised for unknown task type' },
      { re: 'class\\s+MCPRegistry', must: true, hint: 'Define class MCPRegistry.', pass: 'MCPRegistry defined' },
      { re: 'def\\s+register\\s*\\(', must: true, hint: 'MCPRegistry needs a register(self, server_name, tools) method.', pass: 'register() defined' },
      { re: 'def\\s+call\\s*\\(', must: true, hint: 'MCPRegistry needs a call(self, server_name, tool_name, *args, **kwargs) method.', pass: 'call() defined' }
    ],
    tests: `# route_task: delegates to the correct specialist, raises on an unhandled type
def research_handler(task):
    return f"researched: {task}"

def write_handler(task):
    return f"drafted: {task}"

specialists = {"research": research_handler, "write": write_handler}
assert route_task("research", specialists) == "researched: research"
assert route_task("write", specialists) == "drafted: write"

try:
    route_task("translate", specialists)
    assert False, "should have raised ValueError for an unhandled task type"
except ValueError:
    pass

# MCPRegistry: register two INDEPENDENT servers, call tools on both via the SAME call() method
registry = MCPRegistry()
registry.register("ticket-system", {
    "get_ticket": lambda ticket_id: f"ticket #{ticket_id}: open",
})
registry.register("github", {
    "list_open_prs": lambda repo: f"3 open PRs in {repo}",
})

assert registry.call("ticket-system", "get_ticket", 4821) == "ticket #4821: open"
assert registry.call("github", "list_open_prs", "acme/webapp") == "3 open PRs in acme/webapp"
# same call() function, zero special-casing per server -- the M+N property, demonstrated

# Clear errors for unknown server / unknown tool
try:
    registry.call("nonexistent-server", "some_tool")
    assert False, "should raise for an unknown server"
except (KeyError, ValueError):
    pass

try:
    registry.call("ticket-system", "nonexistent_tool")
    assert False, "should raise for an unknown tool on a known server"
except (KeyError, ValueError):
    pass

print("Role-based delegation + an MCP-style registry. One router, one client, any number of servers.")`,
    runnable: true,
    solution: `def route_task(task_type, specialists):
    if task_type not in specialists:
        raise ValueError(f"No specialist registered for task type: {task_type}")
    return specialists[task_type](task_type)

class MCPRegistry:
    def __init__(self):
        self.servers = {}

    def register(self, server_name, tools):
        self.servers[server_name] = tools

    def call(self, server_name, tool_name, *args, **kwargs):
        if server_name not in self.servers:
            raise ValueError(f"Unknown server: {server_name}")
        tools = self.servers[server_name]
        if tool_name not in tools:
            raise ValueError(f"Unknown tool '{tool_name}' on server '{server_name}'")
        return tools[tool_name](*args, **kwargs)`,
    notes: [
      'route_task is deliberately the simplest possible version of a "coordinator" — real orchestration frameworks add richer routing logic (an LLM itself deciding which specialist a task belongs to, rather than a fixed lookup dict), but the STRUCTURE — dispatch to the right narrow handler, fail clearly on an unhandled case — is identical.',
      'The test registering "ticket-system" and "github" as two completely unrelated servers, then calling both through the exact same registry.call(...) method, is the M+N property made concrete: call() never branches on which server it\'s talking to, exactly like a real MCP client never needs server-specific code to talk to a new, previously-unknown MCP server.',
      'Raising clear, specific errors for an unknown server or unknown tool (rather than a bare AttributeError or silent None) matters in a real system for the same reason agents-from-scratch\'s tool-call validation mattered — a malformed or hallucinated request should fail loudly and informatively, not silently misbehave.'
    ]
  },
  quiz: [
    {
      q: 'What is the core case for splitting an agent system into multiple specialized agents rather than one generalist agent?',
      options: ['A narrow, focused prompt and toolset is measurably easier to get reliably good behavior from than one prompt trying to cover many different jobs at once, and makes debugging more tractable by isolating which specialist\'s output was at fault', 'Multiple agents always run faster than a single agent', 'Multiple agents eliminate the need for any tool integrations', 'A single agent cannot call more than one tool total'],
      correct: 0,
      explain: 'The same "narrow specialization beats one overloaded generalist" theme from LoRA fine-tuning and model routing, applied to agent design — with debugging benefits from isolating each specialist\'s contribution.'
    },
    {
      q: 'What NEW failure mode does multi-agent orchestration introduce that a single well-scoped agent cannot have?',
      options: ['Miscommunication in the handoff between agents — one agent\'s ambiguous or incomplete output can mislead another agent, even when neither agent\'s own individual reasoning was wrong', 'Multi-agent systems cannot use any external tools', 'Multi-agent systems are incapable of producing a final answer', 'Multi-agent systems always cost less than single-agent systems'],
      correct: 0,
      explain: 'A single agent has no inter-agent boundary for information to get lost crossing; splitting work across agents introduces exactly this new class of coordination bug.'
    },
    {
      q: 'What problem does MCP (Model Context Protocol) solve?',
      options: ['The M×N integration problem — without a shared standard, every agent framework needs custom integration code for every tool/data source, which MCP reduces to M+N by standardizing the client-server connection', 'MCP replaces the need for any agent framework entirely', 'MCP is a technique for compressing model weights', 'MCP eliminates the need for tool schemas or descriptions'],
      correct: 0,
      explain: 'One MCP server per tool, one MCP client per framework — any client can connect to any server via the same standard protocol, turning a multiplicative integration burden into an additive one.'
    },
    {
      q: 'What do you gain and lose choosing a role/crew-first framework over a graph-first framework like LangGraph?',
      options: ['You gain faster setup for the common "specialized team" pattern by delegating orchestration to the framework, at the cost of less fine-grained control over the exact sequence and conditions of execution', 'Crew-first frameworks provide strictly more control than graph-first frameworks', 'Graph-first frameworks cannot support multiple agents', 'There is no meaningful difference between the two approaches'],
      correct: 0,
      explain: 'A crew-first abstraction handles orchestration for you for a common shape, trading away the explicit, fully-specified control flow a graph-first framework requires you to define yourself.'
    },
    {
      q: 'Why is the specific syntax of any one agent framework covered in this lesson less important than the underlying concepts from this Part?',
      options: ['The framework landscape changes quickly, but the underlying concepts (tool-use loops, LLM-agnostic interfaces, graph-based control flow, standardized tool protocols) remain stable and let you evaluate any new framework on its actual merits', 'Framework syntax never changes once a framework is released', 'Underlying concepts are only useful for academic purposes, not practical framework selection', 'All agent frameworks use identical syntax already'],
      correct: 0,
      explain: 'Knowing what a framework does underneath — its control-flow model, whether it speaks MCP, its orchestration philosophy — lets you judge a brand-new framework on its own merits rather than needing to be told which one to use.'
    }
  ],
  testFlow: {
    title: 'Test yourself: multi-agent frameworks & MCP',
    start: 'q1',
    nodes: {
      q1: {
        qid: 'q1',
        q: 'What is the core case for splitting an agent system into multiple specialized agents rather than one generalist agent?',
        choices: [
          { text: 'A narrow, focused prompt and toolset is measurably easier to get reliably good behavior from than one prompt covering many jobs, and makes debugging more tractable', to: 'q1_right' },
          { text: 'Multiple agents always execute faster in wall-clock time than a single agent', to: 'q1_wrong_speed' },
          { text: 'Multiple agents eliminate the need for any tool integrations entirely', to: 'q1_wrong_notools' },
        ],
      },
      q1_right: { end: true, correct: true, text: 'Right — the same "narrow specialization beats one overloaded generalist" theme from LoRA fine-tuning and model routing, applied to agent design, with the added benefit of isolating which specialist\'s output was at fault when debugging.', next: 'q2' },
      q1_wrong_speed: { end: true, correct: false, text: 'The opposite is typically true — more agents means more LLM calls and real coordination overhead, usually making the system SLOWER, not faster, than a single well-scoped agent.', retry: 'q1' },
      q1_wrong_notools: { end: true, correct: false, text: 'Multi-agent systems still need tool integrations just as much as single-agent systems — splitting into specialists doesn\'t remove the need for tools, it just distributes which agent holds which tools.', retry: 'q1' },
      q2: {
        qid: 'q2',
        q: 'What NEW failure mode does multi-agent orchestration introduce that a single well-scoped agent cannot have?',
        choices: [
          { text: 'Miscommunication in the handoff between agents — one agent\'s ambiguous or incomplete output can mislead another, even when neither agent\'s own reasoning was individually wrong', to: 'q2_right' },
          { text: 'Multi-agent systems become structurally incapable of using any external tools', to: 'q2_wrong_notools' },
          { text: 'Multi-agent systems can never produce a final answer to the user', to: 'q2_wrong_nofinal' },
        ],
      },
      q2_right: { end: true, correct: true, text: 'Exactly — a single agent has no inter-agent boundary for information to get lost crossing. Splitting work across agents introduces exactly this new class of coordination bug, like Nami\'s ambiguous instruction leading Usopp to rig the wrong sail.', next: 'q3' },
      q2_wrong_notools: { end: true, correct: false, text: 'Multi-agent systems use tools just as much as single agents — often MORE tools in total, spread across specialists. Tool access isn\'t the issue here.', retry: 'q2' },
      q2_wrong_nofinal: { end: true, correct: false, text: 'Multi-agent crews absolutely produce final answers (that\'s the whole point of the orchestration) — the new risk is specifically about information getting garbled BETWEEN agents along the way, not an inability to conclude.', retry: 'q2' },
      q3: {
        qid: 'q3',
        q: 'What problem does MCP (Model Context Protocol) solve?',
        choices: [
          { text: 'The M×N integration problem — every framework needing custom code for every tool — reduced to M+N by standardizing the client-server connection', to: 'q3_right' },
          { text: 'MCP replaces the need for any agent framework to exist at all', to: 'q3_wrong_replace' },
          { text: 'MCP is a technique for compressing a model\'s weights for cheaper serving', to: 'q3_wrong_compress' },
        ],
      },
      q3_right: { end: true, correct: true, text: 'Right — one MCP server per tool, one MCP client per framework, and any client can connect to any server via the same standard protocol. A new tool becomes immediately usable by every existing MCP-compatible framework with zero changes to any of them.', next: null },
      q3_wrong_replace: { end: true, correct: false, text: 'MCP works alongside agent frameworks (LangGraph, CrewAI, etc.) — it standardizes how they connect to TOOLS, it doesn\'t replace the frameworks\' own orchestration logic.', retry: 'q3' },
      q3_wrong_compress: { end: true, correct: false, text: 'MCP has nothing to do with model weights or quantization — it\'s a protocol standardizing how agent code discovers and calls external tools and data sources.', retry: 'q3' },
    },
  },
  pitfalls: [
    'Defaulting to a multi-agent architecture because it sounds more sophisticated, when a single well-scoped agent (agents-from-scratch\'s pattern) would handle the task with less coordination overhead and fewer failure modes.',
    'Building custom, framework-specific integration code for a tool that already has (or could reasonably have) an MCP server — reinventing integration work a standard protocol already exists to eliminate.',
    'Assuming a crew-first framework\'s built-in orchestration will correctly handle a genuinely unusual coordination pattern without checking — some workflows need graph-first control specifically because the crew abstraction\'s assumptions don\'t fit.',
    'Committing deeply to a platform-integrated framework without deliberately weighing the portability cost, the same way an unexamined commitment to a single hosted API (using-models-apis lesson) can create unwanted long-term lock-in.',
    'Treating inter-agent handoffs as inherently reliable — without explicit validation or clarity requirements on what one agent hands to the next, miscommunication between agents is a real, common, and easy-to-overlook production bug.',
    'Chasing whichever agent framework is newest or most hyped without evaluating what it actually does underneath — the durable skill this course built is judging a framework by its actual control-flow model and standards support, not by name recognition.'
  ],
  interview: [
    {
      q: 'When would you recommend a multi-agent architecture over a single, well-designed agent, and what would you want to verify before committing to it?',
      a: 'I\'d recommend multi-agent specifically when a task has genuinely distinct sub-jobs that benefit from separately-focused prompts and toolsets — e.g., a research phase needing broad tool access and open-ended exploration, followed by a writing phase needing a completely different, narrower prompt oriented around clarity and structure — where combining both into one agent\'s prompt would measurably dilute its focus on either job (concretely testable: compare a single-agent baseline against a multi-agent version on the same evaluation set, the model-evaluation lesson\'s discipline applied to architecture choice, not just model choice). I would NOT default to multi-agent for a task a single well-scoped agent handles adequately, since coordination overhead (more LLM calls, more cost and latency) and the new inter-agent-handoff failure mode are real costs that need to be justified by an actual measured benefit, not assumed. Before committing, I\'d want to verify: does the task actually decompose cleanly into roles with limited interdependency (a task requiring constant back-and-forth between "specialists" may not benefit from artificial separation), is there a clear way to validate what one agent hands off to the next (mitigating the handoff-miscommunication risk), and have I actually measured the multi-agent version against a single-agent baseline rather than assuming it\'s better because it\'s more architecturally sophisticated.'
    },
    {
      q: 'Explain MCP\'s architecture and value proposition to someone who has never heard of it, using a concrete example.',
      a: 'Concrete example: imagine a company wants its internal AI agents (built across several different teams, using several different agent frameworks) to be able to look up customer records in an internal database. Without a shared standard, each team\'s framework needs its OWN custom code to authenticate with, query, and parse responses from that database — three teams, three separate integrations, each maintained separately, each breaking separately if the database\'s API changes. MCP restructures this: the database team builds ONE MCP server exposing a "lookup_customer(id)" tool (among others) through the standard MCP protocol, entirely independent of which agent framework will eventually use it. Each of the three teams\' agent frameworks needs only ONE MCP client capability — the ability to speak the standard MCP protocol at all — after which EVERY team can connect to and use the SAME database server with zero framework-specific integration code, and if a fourth team spins up a new framework tomorrow, it too can immediately use the existing database server the moment it implements an MCP client, with no new work required from the database team at all. This is the M×N-to-M+N transformation: instead of (number of frameworks) × (number of tools) custom integrations, you get (number of frameworks) + (number of tools) — and every new tool or new framework added to the ecosystem benefits every EXISTING framework or tool immediately, rather than requiring a new custom integration for each existing counterpart.'
    },
    {
      q: 'A team building a customer-support agent is deciding between a single agent with many tools versus a multi-agent "crew" (intake specialist, resolution specialist, escalation specialist). Walk through your recommendation process.',
      a: 'Start by mapping the actual task structure rather than assuming either architecture: does a typical support interaction genuinely pass through distinct phases with different required skills/tools (understanding the issue, searching for a resolution, deciding whether to escalate), or is it usually a single, relatively uniform interaction where the "phases" are more a conceptual convenience than a real behavioral split? If interactions genuinely have distinct phases with meaningfully different tool needs (intake might need a classification tool and conversational skill; resolution might need RAG-style document search — the embeddings-rag lesson\'s pipeline — and possibly account-modification tools; escalation might need different, more consequential tools requiring the human-approval pattern from langchain-langgraph), a crew-style split has real structural justification: each specialist\'s prompt and toolset can be meaningfully narrower and easier to get right than one agent\'s prompt trying to cover intake, resolution, and escalation logic simultaneously. If the interactions are mostly uniform with only occasional edge cases needing something like escalation, a single agent with a well-organized toolset (following agents-from-scratch\'s scoped-tools discipline) plus possibly ONE conditional branch for the escalation case (a graph-first pattern from langchain-langgraph, not necessarily a whole separate crew) may achieve the same outcome with less coordination overhead and without introducing the inter-agent handoff risk. I\'d push for building a SMALL evaluation set of realistic support transcripts and measuring both architectures\' actual performance (resolution accuracy, appropriate escalation rate, cost per interaction) before committing — the "should this be multi-agent" question is empirically testable, not something to settle by architectural preference alone, and the coordination overhead of a crew that turns out to be unnecessary is a real, ongoing cost worth avoiding if a simpler design performs comparably.'
    },
    {
      q: 'How would you evaluate a brand-new agent framework you\'ve never used, released after this course was written, to decide whether it\'s worth adopting for a project?',
      a: 'I\'d apply the same set of questions this Part 7 has built up, regardless of the framework\'s specific marketing or popularity. Control-flow model: is it graph-first (explicit nodes/edges/state, like LangGraph), crew/role-first (higher-level orchestration over defined agent roles, like CrewAI), or minimal/code-first (thin scaffolding over hand-written tool functions) — and does that model actually fit the complexity and shape of the workflow I need to build, or am I fighting the framework\'s assumptions? Model interoperability: does it provide a genuine LLM-agnostic interface supporting local/open models (Ollama, Hugging Face) as first-class options, or is it effectively tied to one specific provider\'s API — a direct test of whether the using-models-apis lesson\'s portability principle was actually followed by the framework\'s own design. Tool/integration standard: does it speak MCP (or an equivalent open standard), meaning I inherit access to a growing ecosystem of tool integrations for free, or does it require framework-specific custom integration code for every tool I need — a direct M×N-versus-M+N question. State and checkpointing: if my use case needs pause/resume or human-in-the-loop approval, does the framework support this as a first-class feature, or would I need to build it myself on top of the framework\'s primitives? Platform dependency: is it genuinely open and portable, or does adopting it create meaningful lock-in to a specific vendor\'s broader ecosystem, and is that an acceptable trade for this specific project\'s constraints? None of these questions require having personally used the new framework before — they\'re architectural questions answerable by reading its documentation with this course\'s vocabulary in hand, which is precisely the durable, transferable skill this lesson (and this whole Part) was built to leave you with.'
    }
  ]
};
