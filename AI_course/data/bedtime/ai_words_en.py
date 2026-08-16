"""How the English narrator says this voyage's notation.

ai_words.py is the Nepali side: it respells the whole AI vocabulary into
Devanagari, because a Nepali voice guesses at Latin script. An English voice
needs almost none of that — it already says "gradient" and "attention" — so all
that is left is the handful of acronyms it gets audibly wrong.

The rule for what belongs here is narrow: only the acronyms the voice mangles.
An English voice spells "API" out on its own, but it makes a word-shaped noise
out of "PCA" and "RLHF". And some of these *are* words and must stay words —
"RAG" is said "rag" by everyone in the field, "BERT" is "bert", "GPU" is
"gee-pee-you" already. Adding those would make the narrator sound like it was
reading an eye chart.
"""
import re

SPELL_OUT = {
    "PCA": "P C A", "SVD": "S V D", "NLP": "N L P", "LLM": "L L M",
    "IDF": "I D F", "RLHF": "R L H F", "DPO": "D P O", "AUC": "A U C",
    "ROC": "R O C", "MCP": "M C P", "BPE": "B P E", "LSTM": "L S T M",
    "KL": "K L", "KV": "K V", "NN": "N N", "TF": "T F",
    "XOR": "ex or",
}

_ACRO = re.compile(r"\b(" + "|".join(sorted(SPELL_OUT, key=len, reverse=True))
                   + r")\b")


def to_spoken(text):
    return _ACRO.sub(lambda m: SPELL_OUT[m.group(1)], text)


def all_keys():
    return set(SPELL_OUT)
