window.LESSONS = window.LESSONS || {};
window.LESSONS['lexing-and-parsing'] = {
  id: 'lexing-and-parsing',
  title: "Lexing & Parsing: Grammars, Recursive Descent, Precedence & Parser Generators",
  category: "Part 0 — The Compiler Pipeline",
  timeMin: 45,
  summary: "Lexing turns characters into tokens with regular expressions; parsing turns tokens into a tree with a context-free grammar. This lesson covers the parts interviewers actually probe: maximal munch, how to write a grammar without ambiguity, why recursive descent cannot handle left recursion and how to rewrite it, how precedence and associativity are encoded (grammar layering, Pratt binding powers, yacc <code>%left</code>), and how ANTLR, Bison, PEG parsers and tree-sitter differ. You will write a recursive-descent parser and read a complete Pratt parser.",
  goals: [
    "Write a regex-based lexer that applies maximal munch and keyword priority, and attaches positions to tokens",
    "Write an unambiguous expression grammar with correct precedence and associativity, and remove left recursion for top-down parsing",
    "Implement a recursive-descent parser and a Pratt (precedence-climbing) parser from scratch",
    "Explain LL vs LR vs PEG vs GLR and pick a parser generator (ANTLR, Bison, pegen, tree-sitter) for a given job",
    "Describe basic error recovery strategies and why IDE parsers must recover"
  ],
  concept: [
    {
      h: "Lexing: regular languages, maximal munch, priority",
      p: [
        "Tokens are described by regular expressions, and a lexer is (conceptually) one big DFA built from their union. Two rules resolve ambiguity. <b>Maximal munch</b>: take the longest match, so <code>&gt;=</code> is one token, not <code>&gt;</code> then <code>=</code>, and <code>iffy</code> is an identifier, not <code>if</code> + <code>fy</code>. <b>Priority</b>: when two rules match the same length, the earlier rule wins, which is how <code>if</code> becomes a keyword rather than an identifier (or, equivalently, lex an identifier and then look it up in a keyword table).",
        "A token is <code>(kind, lexeme, position)</code>. Whitespace and comments are skipped, except in tools that must reproduce the source (formatters, refactoring engines, srcML), which keep them as trivia attached to neighboring tokens.",
        "Lexing is not always context free of the parser: Python emits <code>INDENT</code>/<code>DEDENT</code> from an indentation stack, C needs the typedef table to tell <code>T * x</code> apart, JavaScript must decide whether <code>/</code> starts a regex literal or is division, and Java splits <code>&gt;&gt;</code> when closing nested generics."
      ],
      code: String.raw`import re
TOKEN = re.compile(r"""
  (?P<ws>\s+) | (?P<num>\d+(\.\d+)?) | (?P<op>>=|<=|==|!=|[-+*/<>=()])
| (?P<id>[A-Za-z_]\w*)
""", re.X)
KEYWORDS = {"if", "else", "while", "return"}

def lex(src):
    pos, line_start, line = 0, 0, 1
    while pos < len(src):
        m = TOKEN.match(src, pos)            # alternatives ordered so longer ops come first
        if not m: raise SyntaxError(f"{line}:{pos-line_start+1}: bad char {src[pos]!r}")
        kind, text = m.lastgroup, m.group()
        if kind == "id" and text in KEYWORDS: kind = text
        if kind != "ws": yield (kind, text, line, m.start() - line_start + 1)
        line += text.count("\n")
        if "\n" in text: line_start = m.start() + text.rindex("\n") + 1
        pos = m.end()`
    },
    {
      h: "Grammars, derivations and ambiguity",
      p: [
        "A context-free grammar has terminals (tokens), nonterminals, productions and a start symbol. A grammar is <b>ambiguous</b> if some input has two different parse trees. The textbook example <code>E → E + E | E * E | num</code> gives <code>1 + 2 * 3</code> two trees. The fix is to <b>stratify</b> by precedence level, one nonterminal per level, with recursion on the side that gives the desired associativity:",
        "<pre><code>expr   → expr + term   | expr - term   | term        (left-assoc, lowest)\nterm   → term * factor | term / factor | factor\nfactor → base ^ factor | base                        (right-assoc: recursion on the right)\nbase   → NUMBER | ( expr ) | - base</code></pre>",
        "The other classic ambiguity is the <b>dangling else</b>: in <code>if a then if b then s1 else s2</code>, which <code>if</code> owns the <code>else</code>? Every mainstream language picks the nearest one. LR parser generators report it as a shift/reduce conflict and resolve it by shifting (which attaches to the nearest), and recursive-descent parsers naturally do the same by greedily consuming <code>else</code>."
      ]
    },
    {
      h: "Recursive descent and left recursion",
      p: [
        "Recursive descent is the parser you write by hand: one function per nonterminal, choosing a production by looking at the next token(s). It is what javac, Clang, GCC (since 4.x for C/C++), Go, Rust (rustc), TypeScript and Roslyn use, because it gives the best error messages and full control.",
        "Top-down parsing cannot handle <b>left recursion</b>: <code>expr → expr + term</code> becomes <code>def expr(): expr(); ...</code>, an infinite recursion that consumes nothing. Rewrite it into iteration: <code>expr → term (('+' | '-') term)*</code>, and build the tree left-associatively inside the loop (<code>node = (op, node, term())</code>). Right-associative operators recurse on the right instead.",
        "An <b>LL(1)</b> grammar is one where the next token always determines the production; FIRST and FOLLOW sets formalize this. Real hand-written parsers cheat with more lookahead or backtracking where needed (for example, Java's cast vs parenthesized expression <code>(a) - b</code> vs <code>(int) - b</code>)."
      ]
    },
    {
      h: "Pratt parsing: precedence as numbers",
      p: [
        "Adding a precedence level to a layered grammar means adding a nonterminal and a function. A <b>Pratt parser</b> (top-down operator precedence, Vaughan Pratt 1973, essentially the same as precedence climbing) replaces the layers with a table of <b>binding powers</b>. <code>expr(min_bp)</code> parses a prefix item, then loops: while the next operator's left binding power is at least <code>min_bp</code>, consume it and parse the right operand with the operator's right binding power.",
        "Associativity falls out of the two numbers: left-associative <code>+</code> uses <code>(10, 11)</code> so a second <code>+</code> (left bp 10 &lt; 11) stops the inner call and is applied at the outer level; right-associative <code>**</code> uses <code>(31, 30)</code> so the inner call keeps going. Unary minus gets a prefix binding power, which is how <code>-2 ** 2</code> parses as <code>-(2 ** 2)</code> in Python. Pratt parsers are used in many production compilers and interpreters for expressions, often embedded inside a recursive-descent statement parser."
      ]
    },
    {
      h: "Parser generators: LL, LR, PEG, GLR",
      p: [
        "<table><tr><th>Family</th><th>Tools</th><th>How it works</th><th>Notes</th></tr><tr><td>LL(k) / ALL(*)</td><td>ANTLR 4</td><td>Top-down with adaptive (arbitrary) lookahead</td><td>Supports direct left recursion by rewriting it; generates Java, Python, C#, Go, JS, C++ and more; huge grammar zoo (grammars-v4)</td></tr><tr><td>LR(1) / LALR(1)</td><td>yacc, Bison, Menhir</td><td>Bottom-up shift/reduce automaton</td><td>Handles left recursion natively; conflicts reported at generation time; precedence via <code>%left</code>/<code>%right</code></td></tr><tr><td>PEG / packrat</td><td>CPython pegen, pest, many JS libs</td><td>Ordered choice <code>/</code>: first alternative that matches wins, memoization for linear time</td><td>Never ambiguous by construction, but ordered choice can silently hide alternatives</td></tr><tr><td>GLR</td><td>tree-sitter, Bison <code>%glr-parser</code>, Elkhound</td><td>LR that forks on conflicts and merges</td><td>tree-sitter adds incremental reparsing and error recovery for editors</td></tr></table>",
        "Rule of thumb: hand-written recursive descent for a production compiler you control; ANTLR to get a working parser for an existing language quickly (there are grammars for Java, Python, SQL and more); tree-sitter for editor-grade, error-tolerant, incremental parsing across many languages; Bison when you need a proven LALR toolchain in C."
      ],
      code: String.raw`// Expr.g4 (ANTLR 4): alternatives listed from highest to lowest precedence
grammar Expr;
prog : expr EOF ;
expr : <assoc=right> expr '^' expr
     | expr ('*' | '/') expr
     | expr ('+' | '-') expr
     | '(' expr ')'
     | INT
     ;
INT  : [0-9]+ ;
WS   : [ \t\r\n]+ -> skip ;

# pip install antlr4-tools antlr4-python3-runtime
# antlr4 -Dlanguage=Python3 -visitor Expr.g4    -> ExprLexer.py, ExprParser.py, ExprVisitor.py`
    },
    {
      h: "Error recovery",
      p: [
        "A parser that stops at the first error is fine for a batch compiler and useless for an IDE. Classic strategies: <b>panic mode</b> (skip tokens until a synchronizing token such as <code>;</code> or <code>}</code>, then resume the enclosing rule), <b>phrase-level</b> repair (insert or delete one token, for example a missing <code>)</code>), and <b>error productions</b> in the grammar for common mistakes. ANTLR uses single-token insertion/deletion plus resynchronization; tree-sitter produces <code>ERROR</code> and <code>MISSING</code> nodes and still returns a full tree.",
        "Good error messages come from the parser knowing what it expected: \"expected ')' to close '(' at line 3\" is a recursive-descent parser reporting its call stack."
      ]
    }
  ],
  deepDive: {
    timeMin: 15,
    intro: "The questions behind the questions: why LR is more powerful than LL, what a shift/reduce conflict actually is, and where PEG's ordered choice bites.",
    sections: [
      {
        h: "LL vs LR in one picture",
        p: [
          "An LL parser must decide which production to use when it has seen only the first k tokens of it (it predicts top-down). An LR parser decides after it has seen the entire right-hand side plus k tokens of lookahead (it recognizes bottom-up, building the rightmost derivation in reverse). That extra information is why every LL(k) grammar is LR(k) but not vice versa, and why LR handles left recursion with no rewriting.",
          "An LR parser keeps a stack of states. <b>Shift</b> pushes the next token; <b>reduce</b> pops a handle (a right-hand side) and pushes its left-hand nonterminal. A <b>shift/reduce conflict</b> means the table has both actions for one (state, lookahead) pair, as in dangling else after <code>if a then if b then s1</code> with <code>else</code> as lookahead. A <b>reduce/reduce</b> conflict usually signals a real grammar bug. Bison resolves shift/reduce by shifting and warns; precedence declarations resolve operator conflicts by comparing the precedence of the rule with that of the lookahead token."
        ],
        code: String.raw`/* calc.y (Bison) */
%token NUM
%left '+' '-'          /* lowest precedence, left-assoc */
%left '*' '/'
%right '^'             /* highest, right-assoc */
%precedence NEG        /* unary minus */
%%
exp : NUM
    | exp '+' exp      { $$ = $1 + $3; }
    | exp '-' exp      { $$ = $1 - $3; }
    | exp '*' exp      { $$ = $1 * $3; }
    | exp '/' exp      { $$ = $1 / $3; }
    | exp '^' exp      { $$ = pow($1, $3); }
    | '-' exp %prec NEG { $$ = -$2; }
    | '(' exp ')'      { $$ = $2; }
    ;`
      },
      {
        h: "PEG ordered choice and its trap",
        p: [
          "In a PEG, <code>A ← B / C</code> means try B; only if B fails, try C. There is never ambiguity, but there can be silently unreachable alternatives: <code>op ← '&lt;' / '&lt;='</code> will match <code>&lt;</code> on input <code>&lt;=</code> and leave <code>=</code> behind, so the longer alternative must come first. Packrat memoization gives linear time at the cost of memory proportional to input × rules.",
          "CPython switched to a PEG parser in 3.9 (PEP 617), generated by <code>pegen</code> from <code>Grammar/python.gram</code>. PEG let it express constructs that were awkward for the old LL(1) parser (parenthesized context managers, the <code>match</code> statement's soft keywords) and build the AST directly. pegen also supports left-recursive rules through a memoized seed-growing technique."
        ]
      },
      {
        h: "GLR, Earley and tree-sitter",
        p: [
          "GLR runs an LR automaton but forks the stack on a conflict, keeping all live parses in a graph-structured stack and merging when they converge. Earley parsing handles any CFG in cubic time worst case (linear for most practical grammars). Both can parse ambiguous grammars and return a parse forest.",
          "tree-sitter generates a GLR-style parser from a JavaScript grammar description (<code>grammar.js</code>), with conflicts declared explicitly where the grammar needs forking. Its two killer features for tooling are <b>incremental reparsing</b> (after an edit, only the changed region is reparsed and unchanged subtrees are reused) and <b>error recovery</b> that always yields a tree. That is why editors such as Neovim, Helix and Zed, and GitHub's code navigation, use it."
        ]
      },
      {
        h: "Parsing is not the hard part of a real front end",
        p: [
          "For C++ the grammar is not even context free in practice (the most vexing parse, templates with <code>&gt;</code>), and parsing needs semantic information. For Java and Python the grammar is manageable; the hard parts are name resolution, type inference and generics. That is worth saying in interviews: production front ends spend most of their complexity after the parser."
        ]
      }
    ]
  },
  story: {
    onePiece: {
      title: "Usopp's Battle-Plan Notation",
      text: [
        "Usopp invents a shorthand for battle orders shouted across the deck: \"Luffy+Zoro*Sanji\". The crew argues about what it means. Does Luffy act alone while Zoro and Sanji pair up, or do Luffy and Zoro go first and then multiply with Sanji? Nami settles it with a precedence rule: pairing (*) binds tighter than sending (+), so it is Luffy plus the Zoro-Sanji pair. Then \"Luffy+Zoro+Sanji\" is read left to right, one wave after another (left associative), while \"Gear^Fourth^Snakeman\" stacks from the right, each form transforming the next (right associative).",
        "Robin is the lexer: she splits the shout into names and symbols and refuses to read \"Zoro\" as \"Zo\" plus \"ro\" because she always takes the longest name she knows. Chopper is a recursive-descent parser: one small procedure per rule, calling the next rule down. When someone shouts \"Luffy+*Zoro\", Chopper stops at the second symbol and says exactly what he expected (a name), then skips to the next full order so the battle can continue (panic-mode recovery)."
      ]
    },
    sitcom: {
      show: "Friends",
      title: "Joey Reads the Menu Left to Right",
      text: [
        "Monica writes a catering order on the whiteboard: \"2 + 3 x trays\". Joey orders 15 trays (he added first), Ross orders 11 (multiplication first) and they fight for an episode. Chandler points out that the whiteboard notation is ambiguous unless everyone agrees on precedence. Monica rewrites the rule in layers (totals are sums of products), which is exactly how you stratify a grammar.",
        "Later Phoebe leaves a note: \"if Rachel calls if Ross is home tell him else hang up\". Nobody knows which \"if\" the \"else\" belongs to until Chandler declares the house rule: an else always belongs to the nearest if. That is the dangling-else resolution every real language uses."
      ]
    },
    why: "Both stories are about the same two facts: a flat sequence of symbols does not determine a tree until you fix precedence and associativity, and an ambiguous construct (the dangling else) needs an explicit convention. The lexer (Robin taking the longest name) and the recursive-descent parser (Chopper with one routine per rule and a clear error message) are the two halves of a front end."
  },
  storyAnim: {
    h: 240,
    props: [
      { id: "shout", emoji: "📣", label: "\"Luffy+Zoro*Sanji\"", x: 10, y: 20 },
      { id: "tokens", emoji: "🔤", label: "Luffy + Zoro * Sanji", x: 36, y: 20, cls: "off" },
      { id: "plus", emoji: "➕", label: "send (+)", x: 62, y: 20, cls: "off" },
      { id: "times", emoji: "✖️", label: "pair (*)", x: 76, y: 50, cls: "off" },
      { id: "luffy", emoji: "👒", label: "Luffy", x: 50, y: 50, cls: "off" },
      { id: "pair", emoji: "⚔️", label: "Zoro, Sanji", x: 84, y: 80, cls: "off" },
      { id: "err", emoji: "❗", label: "expected a name", x: 30, y: 80, cls: "off" }
    ],
    actors: [
      { id: "robin", emoji: "📚", label: "Robin (lexer)", x: 12, y: 60 },
      { id: "chopper", emoji: "🦌", label: "Chopper (parser)", x: 30, y: 55 }
    ],
    steps: [
      { c: "Usopp shouts a flat string of characters. No structure yet.", p: { shout: "lit" } },
      { c: "Robin lexes with maximal munch: the longest known name wins, so \"Zoro\" is one token. Five tokens come out.", a: { robin: [34, 45] }, p: { tokens: "lit" } },
      { c: "Chopper calls expr(): it parses a term (Luffy) and sees '+', the lowest-precedence operator.", a: { chopper: [52, 32] }, p: { luffy: "lit", plus: "lit" } },
      { c: "For the right side of '+' he calls term(), which grabs Zoro and then sees '*'. Multiplication binds tighter, so term keeps going.", a: { chopper: [70, 62] }, p: { times: "lit" } },
      { c: "The tree is +(Luffy, *(Zoro, Sanji)). Precedence decided the shape; no parentheses were needed.", p: { pair: "good", plus: "good", times: "good" } },
      { c: "Next order: \"Luffy+*Zoro\". After '+', term() expects a name but sees '*'. Chopper reports exactly what he expected.", a: { chopper: [30, 62] }, p: { err: "bad" } },
      { c: "Panic-mode recovery: skip to the next order separator and resume, so one bad order does not stop the battle.", p: { err: "dim" }, l: { err: "recovered at ';'" } }
    ]
  },
  conceptFlow: {
    title: "How a Pratt parser builds 1 + 2 * 3 - 4",
    intro: "Binding powers: + and - are (10, 11), * is (20, 21). Click a node to jump to the step that creates it.",
    stages: [
      { label: "Tokens", nodes: [ { id: "t1", text: "1" }, { id: "tplus", text: "+  (10,11)" }, { id: "t2", text: "2" }, { id: "tmul", text: "*  (20,21)" }, { id: "t3", text: "3" }, { id: "tminus", text: "-  (10,11)" }, { id: "t4", text: "4" } ] },
      { label: "Calls", nodes: [ { id: "c0", text: "expr(0)" }, { id: "c11", text: "expr(11)" }, { id: "c21", text: "expr(21)" } ] },
      { label: "Subtrees", nodes: [ { id: "mul", text: "2 * 3" }, { id: "add", text: "1 + (2*3)" }, { id: "sub", text: "(1+(2*3)) - 4" } ] }
    ],
    steps: [
      { active: ["c0", "t1"], note: "expr(0) parses the prefix item 1 as the current left-hand side." },
      { active: ["tplus"], note: "Next is '+', left bp 10 >= 0, so consume it and parse the right operand with expr(11)." },
      { active: ["c11", "t2"], note: "expr(11) takes 2 as its left-hand side." },
      { active: ["tmul"], note: "Next is '*', left bp 20 >= 11: multiplication binds tighter, so expr(11) consumes it and calls expr(21)." },
      { active: ["c21", "t3", "mul"], note: "expr(21) returns 3. Back in expr(11) we build 2 * 3." },
      { active: ["tminus"], note: "Next is '-', left bp 10 < 11, so expr(11) stops and returns 2*3 to expr(0)." },
      { active: ["add"], note: "expr(0) builds 1 + (2*3). The '-' with left bp 10 >= 0 is still allowed at this level." },
      { active: ["t4", "sub"], note: "expr(0) consumes '-', parses 4 with expr(11), and builds (1+(2*3)) - 4: left associative, correct precedence." }
    ]
  },
  tech: [
    {
      q: "Why does Python's tokenizer produce INDENT and DEDENT tokens instead of the parser counting spaces?",
      a: [
        "Indentation is not context free in a convenient way, but it is easy with a stack. At the start of each logical line the tokenizer compares the indentation with the top of an indentation stack: deeper pushes and emits <code>INDENT</code>, shallower pops (possibly several levels) emitting one <code>DEDENT</code> per level, and an amount that matches no stack entry is an <code>IndentationError</code>. Inside brackets, newlines and indentation are ignored (implicit line joining). After this the grammar can treat blocks exactly like <code>{ }</code>. You can see it with <code>python3 -m tokenize file.py</code>."
      ]
    },
    {
      q: "What do FIRST and FOLLOW sets actually buy you?",
      a: [
        "FIRST(α) is the set of tokens that can begin a string derived from α; FOLLOW(A) is the set of tokens that can appear right after nonterminal A. An LL(1) table puts production A → α in cell [A, t] for each t in FIRST(α), and for each t in FOLLOW(A) if α can derive the empty string. A grammar is LL(1) exactly when no cell gets two productions. In practice they explain why a hand-written parser can decide with one token, and FOLLOW sets are the natural synchronizing tokens for panic-mode recovery."
      ]
    },
    {
      q: "How does ANTLR 4 accept left-recursive rules if it is a top-down parser?",
      a: [
        "ANTLR 4 rewrites directly left-recursive rules (like <code>expr : expr '*' expr | expr '+' expr | INT</code>) into a precedence-climbing loop internally, assigning precedence by the order of alternatives (earlier means tighter) and supporting <code>&lt;assoc=right&gt;</code>. Indirect left recursion (A → B ..., B → A ...) is still rejected. Its ALL(*) prediction then handles the remaining lookahead decisions dynamically at parse time."
      ]
    },
    {
      q: "Why are regexes not enough to parse code, or HTML?",
      a: [
        "Regular languages cannot count unbounded nesting: there is no finite automaton for balanced parentheses (pumping lemma). Code is full of nesting (blocks, calls, generics), so you need at least a pushdown automaton, which is what a context-free parser is. Regexes remain perfect for the token level, which is exactly how lexer and parser divide the work."
      ]
    }
  ],
  code: {
    title: "A complete Pratt parser with unary minus and right-associative **",
    intro: "Run with <code>python3 pratt.py</code>. The output shows how binding powers produce the right tree for each tricky case.",
    code: String.raw`"""Pratt (top-down operator precedence) parser with unary minus and right-assoc **."""
import re

TOKEN = re.compile(r"\s*(?:(\d+\.?\d*)|(\*\*|[-+*/()])|([A-Za-z_]\w*))")

def tokenize(src):
    toks, pos = [], 0
    while pos < len(src.rstrip()):
        m = TOKEN.match(src, pos)
        if not m:
            raise SyntaxError(f"unexpected {src[pos]!r} at column {pos}")
        num, op, name = m.groups()
        toks.append(("num", float(num)) if num else ("op", op) if op else ("name", name))
        pos = m.end()
    return toks + [("eof", None)]

# binding powers: (left bp, right bp). right < left => right-associative
INFIX = {"+": (10, 11), "-": (10, 11), "*": (20, 21), "/": (20, 21), "**": (31, 30)}
PREFIX_BP = 25          # unary minus binds tighter than * but looser than **

class Parser:
    def __init__(self, src):
        self.toks, self.i = tokenize(src), 0
    def next(self):
        tok = self.toks[self.i]; self.i += 1; return tok
    def peek(self):
        return self.toks[self.i]

    def parse(self):
        tree = self.expr(0)
        if self.peek()[0] != "eof":
            raise SyntaxError(f"trailing input at token {self.peek()}")
        return tree

    def expr(self, min_bp):
        kind, val = self.next()
        # --- prefix position ("nud") ---
        if kind in ("num", "name"):
            left = val
        elif val == "(":
            left = self.expr(0)
            if self.next() != ("op", ")"):
                raise SyntaxError("expected ')'")
        elif val == "-":
            left = ("neg", self.expr(PREFIX_BP))
        else:
            raise SyntaxError(f"unexpected token {val!r}")
        # --- infix loop ("led") ---
        while True:
            kind, op = self.peek()
            if kind != "op" or op not in INFIX:
                break
            lbp, rbp = INFIX[op]
            if lbp < min_bp:
                break
            self.next()
            left = (op, left, self.expr(rbp))
        return left

def evaluate(t, env=None):
    env = env or {}
    if isinstance(t, float): return t
    if isinstance(t, str): return env[t]
    if t[0] == "neg": return -evaluate(t[1], env)
    op, a, b = t
    a, b = evaluate(a, env), evaluate(b, env)
    return {"+": a + b, "-": a - b, "*": a * b, "/": a / b, "**": a ** b}[op]

if __name__ == "__main__":
    for src in ["1 + 2 * 3", "(1 + 2) * 3", "2 ** 3 ** 2", "-2 ** 2", "10 - 4 - 3", "x * -y"]:
        tree = Parser(src).parse()
        print(f"{src:12} => {tree}  = {evaluate(tree, {'x': 3, 'y': 4})}")
    try:
        Parser("1 + * 2").parse()
    except SyntaxError as e:
        print("error:", e)

# Output:
# 1 + 2 * 3    => ('+', 1.0, ('*', 2.0, 3.0))  = 7.0
# (1 + 2) * 3  => ('*', ('+', 1.0, 2.0), 3.0)  = 9.0
# 2 ** 3 ** 2  => ('**', 2.0, ('**', 3.0, 2.0))  = 512.0
# -2 ** 2      => ('neg', ('**', 2.0, 2.0))  = -4.0
# 10 - 4 - 3   => ('-', ('-', 10.0, 4.0), 3.0)  = 3.0
# x * -y       => ('*', 'x', ('neg', 'y'))  = -12
# error: unexpected token '*'`,
    notes: [
      "The whole precedence table is the <code>INFIX</code> dict. Adding a comparison level (<code>&lt;</code> with bp (5, 6)) is one line, versus a new nonterminal and function in a layered grammar.",
      "<code>-2 ** 2 = -4</code> matches Python's own rule: <code>**</code> binds tighter than unary minus on its left.",
      "<code>10 - 4 - 3 = 3</code> confirms left associativity; a naive right-recursive grammar would compute <code>10 - (4 - 3) = 9</code>, a classic bug."
    ]
  },
  lab: {
    title: "Write a recursive-descent parser without left recursion",
    prompt: "Implement a parser for the grammar below as a class with one method per nonterminal: <code>expr</code>, <code>term</code>, <code>unary</code>, <code>factor</code>. Use <code>while</code> loops for the repetition so that <code>-</code> and <code>/</code> are left associative, and make <code>eat(expected)</code> raise <code>SyntaxError</code> on a mismatch. The three asserts at the bottom must pass.<pre><code>expr   := term   ((\"+\" | \"-\") term)*\nterm   := unary  ((\"*\" | \"/\") unary)*\nunary  := \"-\" unary | factor\nfactor := NUMBER | \"(\" expr \")\"</code></pre>",
    starter: String.raw`import re

def tokenize(src):
    return re.findall(r"\d+|[-+*/()]", src) + ["<eof>"]

class Parser:
    def __init__(self, src):
        self.toks = tokenize(src)
        self.pos = 0

    def peek(self):
        return self.toks[self.pos]

    # TODO: eat(expected=None), expr, term, unary, factor

def parse(src):
    p = Parser(src)
    tree = p.expr()
    p.eat("<eof>")
    return tree

assert parse("8 - 3 - 2") == ("-", ("-", 8, 3), 2)
assert parse("1 + 2 * 3") == ("+", 1, ("*", 2, 3))
assert parse("-(4 + 1) * 2") == ("*", ("neg", ("+", 4, 1)), 2)
print("all parser tests passed")
`,
    checks: [
      { re: 'def\\s+expr\\s*\\(\\s*self', flags: '', must: true, hint: "Define expr(self).", pass: "expr() defined ✓" },
      { re: 'def\\s+term\\s*\\(\\s*self', flags: '', must: true, hint: "Define term(self).", pass: "term() defined ✓" },
      { re: 'def\\s+unary\\s*\\(\\s*self', flags: '', must: true, hint: "Define unary(self) for prefix minus.", pass: "unary() defined ✓" },
      { re: 'def\\s+factor\\s*\\(\\s*self', flags: '', must: true, hint: "Define factor(self) for numbers and parentheses.", pass: "factor() defined ✓" },
      { re: 'while\\s+self\\.peek\\(\\)\\s+in', flags: '', must: true, hint: "Use a while loop over self.peek() in (...) to handle repetition iteratively (this is how left recursion is removed).", pass: "Iterative repetition ✓" },
      { re: 'def\\s+expr\\s*\\(self\\)\\s*:\\s*\\n\\s*(node\\s*=\\s*)?self\\.expr\\(', flags: '', must: false, hint: "expr() must not call self.expr() first: that is left recursion and recurses forever.", pass: "No left recursion ✓" },
      { re: 'raise\\s+SyntaxError', flags: '', must: true, hint: "eat() should raise SyntaxError when the token does not match.", pass: "Syntax errors raised ✓" },
      { re: 'def\\s+eat\\s*\\(\\s*self\\s*,\\s*expected\\s*=\\s*None', flags: '', must: true, hint: "Define eat(self, expected=None).", pass: "eat() defined ✓" }
    ],
    run: "Save as <code>rd_parser.py</code> and run <code>python3 rd_parser.py</code>; it should print <code>all parser tests passed</code>. Then try <code>parse(\"1 + * 2\")</code> in a REPL and check the error message names what was expected. Stretch: add <code>^</code> as a right-associative power operator between <code>unary</code> and <code>factor</code> (hint: recurse on the right instead of looping).",
    solution: String.raw`import re

# Grammar (EBNF, no left recursion):
#   expr   := term   (("+" | "-") term)*
#   term   := unary  (("*" | "/") unary)*
#   unary  := "-" unary | factor
#   factor := NUMBER | "(" expr ")"

def tokenize(src):
    return re.findall(r"\d+|[-+*/()]", src) + ["<eof>"]

class Parser:
    def __init__(self, src):
        self.toks = tokenize(src)
        self.pos = 0

    def peek(self):
        return self.toks[self.pos]

    def eat(self, expected=None):
        tok = self.toks[self.pos]
        if expected is not None and tok != expected:
            raise SyntaxError("expected " + expected + " but got " + tok)
        self.pos += 1
        return tok

    def expr(self):
        node = self.term()
        while self.peek() in ("+", "-"):
            op = self.eat()
            node = (op, node, self.term())
        return node

    def term(self):
        node = self.unary()
        while self.peek() in ("*", "/"):
            op = self.eat()
            node = (op, node, self.unary())
        return node

    def unary(self):
        if self.peek() == "-":
            self.eat("-")
            return ("neg", self.unary())
        return self.factor()

    def factor(self):
        tok = self.peek()
        if tok.isdigit():
            self.eat()
            return int(tok)
        self.eat("(")
        node = self.expr()
        self.eat(")")
        return node

def parse(src):
    p = Parser(src)
    tree = p.expr()
    p.eat("<eof>")
    return tree

assert parse("8 - 3 - 2") == ("-", ("-", 8, 3), 2)
assert parse("1 + 2 * 3") == ("+", 1, ("*", 2, 3))
assert parse("-(4 + 1) * 2") == ("*", ("neg", ("+", 4, 1)), 2)
print("all parser tests passed")
`,
    notes: [
      "<code>node = (op, node, self.term())</code> inside the loop is what makes the result left associative: each new operator takes the tree built so far as its left child.",
      "<code>unary</code> recursing on itself is fine because it consumes a token (<code>-</code>) before recursing; only recursion without consuming input is a problem.",
      "Notice the parser is almost a transcription of the grammar. That is the main selling point of recursive descent, along with the precise error messages."
    ]
  },
  quiz: [
    {
      q: "Why does a lexer turn <code>&gt;=</code> into one token instead of <code>&gt;</code> followed by <code>=</code>?",
      options: ["Keyword priority", "Maximal munch: the longest matching token wins", "The parser asks for it", "Because of LL(1) lookahead"],
      correct: 1,
      explain: "Maximal munch (longest match) is the standard lexer rule; priority only breaks ties between rules matching the same length."
    },
    {
      q: "What happens if you implement <code>expr → expr '+' term | term</code> literally as a recursive-descent function?",
      options: ["It parses right-associatively", "Infinite recursion: expr() calls expr() without consuming input", "It works but is slow", "It becomes an LR parser"],
      correct: 1,
      explain: "Left recursion makes a top-down parser recurse forever. Rewrite as <code>term ('+' term)*</code> with a loop."
    },
    {
      q: "In a Pratt parser, which binding-power pair makes an operator right associative?",
      options: ["(10, 11)", "(10, 10)", "(31, 30): right bp lower than left bp", "Binding powers cannot express associativity"],
      correct: 2,
      explain: "With a lower right bp, the recursive call for the right operand accepts another occurrence of the same operator, so <code>a ** b ** c</code> nests to the right."
    },
    {
      q: "A Bison grammar reports one shift/reduce conflict on <code>if-then-else</code>. What does Bison do by default, and what does it mean?",
      options: ["Reduces, attaching else to the outer if", "Shifts, attaching else to the nearest if, which is the usual language rule", "Refuses to generate a parser", "Picks randomly"],
      correct: 1,
      explain: "Bison resolves shift/reduce conflicts by shifting (with a warning). For dangling else that is the desired behavior; <code>%expect 1</code> documents it."
    },
    {
      q: "Which parser technology would you pick for syntax highlighting and code navigation across 40 languages in an editor, including files that are mid-edit and broken?",
      options: ["Bison", "A hand-written recursive-descent parser per language", "tree-sitter", "Regular expressions"],
      correct: 2,
      explain: "tree-sitter provides grammars for many languages, incremental reparsing and error recovery that always returns a tree."
    }
  ],
  testFlow: {
    title: "Grammar debugging",
    start: "q1",
    nodes: {
      q1: { q: "Your parser computes <code>10 - 4 - 3</code> as 9. What is wrong?", choices: [ { text: "The grammar is right recursive for '-': expr → term '-' expr", to: "q1ok" }, { text: "The lexer used maximal munch", to: "q1bad" } ] },
      q1ok: { end: true, correct: true, text: "Right. Right recursion gives right associativity: 10 - (4 - 3). Use a loop that folds left.", next: "q2" },
      q1bad: { end: true, correct: false, text: "Tokenization is fine here (three numbers, two operators). The tree shape is the problem, which comes from the grammar.", retry: "q1" },
      q2: { q: "A PEG rule <code>cmp ← '&lt;' / '&lt;='</code> fails to parse <code>a &lt;= b</code>. Why?", choices: [ { text: "Ordered choice matches '<' first and never tries '<='", to: "q2ok" }, { text: "PEGs cannot express comparison operators", to: "q2bad" } ] },
      q2ok: { end: true, correct: true, text: "Correct. In a PEG the first successful alternative wins; put longer alternatives first.", next: "q3" },
      q2bad: { end: true, correct: false, text: "They can. The issue is the order of alternatives in an ordered choice.", retry: "q2" },
      q3: { q: "You need to add five new operators with distinct precedences to a hand-written expression parser. Least painful approach?", choices: [ { text: "Add five new nonterminals and functions", to: "q3bad" }, { text: "Switch expressions to a Pratt parser with a binding-power table", to: "q3ok" } ] },
      q3ok: { end: true, correct: true, text: "Yes. Each operator becomes one table entry with a left and right binding power." },
      q3bad: { end: true, correct: false, text: "That works but scales poorly; each level is another function and call depth. A table-driven Pratt parser is the standard fix.", retry: "q3" }
    }
  },
  pitfalls: [
    "Writing <code>expr → expr + term</code> into a recursive-descent parser: infinite recursion. Convert left recursion to loops.",
    "Getting associativity wrong by using right recursion for left-associative operators (<code>-</code>, <code>/</code>): tests with only <code>+</code> and <code>*</code> will not catch it because those are associative.",
    "Ordering lexer alternatives badly in a single regex: <code>(?P&lt;op&gt;[&lt;&gt;=]|&lt;=)</code> never produces <code>&lt;=</code>. Python's <code>re</code> alternation is ordered, not longest match, so list longer operators first.",
    "Forgetting the end-of-input check: a parser that returns after <code>1 + 2</code> on input <code>1 + 2 )</code> silently accepts garbage. Always <code>eat(EOF)</code>.",
    "Assuming a parser generator grammar from the internet (grammars-v4) matches the latest language version; Java and Python add syntax every release."
  ],
  interview: [
    {
      q: "How would you parse arithmetic expressions with correct precedence and associativity? Write it.",
      a: "Either layer the grammar (expr → term (('+'|'-') term)*, term → factor (('*'|'/') factor)*, factor → NUMBER | '(' expr ')') with one function per level, folding left inside each while loop; or use a Pratt parser with a binding-power table, where left-associative operators get (bp, bp+1) and right-associative ones (bp+1, bp). I would mention testing <code>10 - 4 - 3</code> and <code>2 ** 3 ** 2</code> specifically because they catch associativity bugs that <code>+</code>/<code>*</code> tests miss."
    },
    {
      q: "What is left recursion and how do you eliminate it?",
      a: "A rule whose first symbol derives the rule itself, like A → A α | β. Top-down parsers loop forever on it. Rewrite as A → β A', A' → α A' | ε, which in code is <code>node = beta(); while next starts alpha: node = combine(node, alpha())</code>. Indirect left recursion (A → B x, B → A y) needs substitution first. LR parsers do not have this problem, and ANTLR 4 handles direct left recursion automatically."
    },
    {
      q: "Explain LL vs LR parsing and when you would choose each.",
      a: "LL predicts the production top-down from the next k tokens; LR shifts tokens onto a stack and reduces when it has seen a whole right-hand side plus lookahead, so LR(k) recognizes strictly more grammars and handles left recursion natively. LL parsers (especially hand-written recursive descent) are easier to debug, give better error messages and are what most production compilers use. LR generators (Bison) are great when you have a grammar spec and want conflicts reported mechanically. For quick tooling on existing languages I reach for ANTLR (adaptive LL) or tree-sitter (GLR)."
    },
    {
      q: "What is a shift/reduce conflict? Give an example.",
      a: "In an LR automaton, a state where for the same lookahead token the parser could either shift it or reduce a completed rule. Dangling else: after <code>if a then if b then s1</code> with lookahead <code>else</code>, the parser could reduce the inner if (else goes to the outer one) or shift (else goes to the inner one). Bison defaults to shift, matching the usual rule. Operator conflicts in <code>E → E + E | E * E</code> are resolved by precedence and associativity declarations."
    },
    {
      q: "Whiteboard: design the parser architecture for a new DSL used in config files that must also work in an IDE.",
      a: "Hand-written lexer producing tokens with full positions and trivia (comments, whitespace attached to tokens) so a formatter can round-trip. Recursive-descent parser for statements, Pratt for expressions. Produce a lossless CST (every token kept) and derive an AST view from it, as Roslyn and rust-analyzer do. Error recovery: on an unexpected token, record an error node, skip to a synchronizing token (newline, <code>}</code>), continue. Make parsing incremental at the top-level-item granularity. Separately publish a tree-sitter grammar for highlighting in editors I do not control. Test with a corpus of valid files, a fuzzer for crashes, and golden files for error messages."
    },
    {
      q: "Explain a tradeoff: PEG parsers versus CFG-based generators.",
      a: "PEG's ordered choice makes grammars unambiguous by construction and composes nicely with lexing (scannerless), and packrat memoization gives linear time; CPython uses it since 3.9. The cost is that ambiguity does not disappear, it is silently resolved by order: a misordered alternative quietly makes another unreachable, and nothing warns you. CFG tools like Bison tell you about conflicts at generation time, which is a useful design check, but are harder to extend and require a separate lexer. Memory use of packrat parsing is also proportional to input length times rule count."
    },
    {
      q: "How does an IDE keep parsing while you type broken code?",
      a: "Error-recovering, incremental parsers. On an error the parser inserts a missing token or skips to a synchronizing token, producing ERROR/MISSING nodes rather than aborting. After an edit, it reuses unchanged subtrees and reparses only the damaged region (tree-sitter does this generically; Roslyn and the JDT parser do it with language-specific heuristics). The semantic layer then works on the partial tree, which is why completion still works inside a half-written method."
    }
  ]
};
