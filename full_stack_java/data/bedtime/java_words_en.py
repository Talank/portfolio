"""How the English narrator says this voyage's notation.

java_words.py is the Nepali side: it respells the whole Java vocabulary into
Devanagari, because a Nepali voice guesses at Latin script. An English voice
needs almost none of that — it already says "interface" and "garbage
collector" — so all that is left is the handful of initialisms it gets audibly
wrong.

The rule for what belongs here is narrow: only the ones the voice mangles. It
spells "JVM" out on its own, but it makes a word-shaped noise out of "JDBC" and
"PECS". And some of these *are* words to a reader and must stay words — "REST"
is said "rest" by everyone in the field, and "POM" is "pom". Adding those would
make the narrator sound like it was reading an eye chart.
"""
import re

SPELL_OUT = {
    "JDBC": "J D B C", "JPA": "J P A", "JDK": "J D K", "JRE": "J R E",
    "JVM": "J V M", "JIT": "J I T", "JFR": "J F R",
    "SQL": "S Q L", "HTTP": "H T T P", "PECS": "P E C S",
}

_ACRO = re.compile(r"\b(" + "|".join(sorted(SPELL_OUT, key=len, reverse=True))
                   + r")\b")


def to_spoken(text):
    return _ACRO.sub(lambda m: SPELL_OUT[m.group(1)], text)


def all_keys():
    return set(SPELL_OUT)
