#!/usr/bin/env python3
"""How the ACLS bedtime voyage is pronounced.

The other voyages on this site are Nepali prose with English terms dropped into
it, and shared/ne_pronounce.py exists to respell those terms in Devanagari so a
Nepali voice can say them. This course runs the other way round: the prose is
English, read by an English voice, and the Nepali is the guest.

That inversion is the whole point of the course. An ECG is read in a vocabulary
that has no Nepali — there is no other word for a QRS complex, and a listener
who learns "तल्लो लहर" instead of "S wave" has learned something they cannot use
in a resuscitation room, on a certification exam, or in a handover. So the terms
stay in English, and the voice that says them is a voice that knows how.

What is left for this file is small and specific:

  * **Acronyms.** An English engine reads "QRS" as a word ("qurs"), "aVR" as
    "avr", and "PEA" as "pea", the vegetable. Spacing the letters out is the
    only lever available — edge-tts escapes SSML, so <say-as> is not an option
    (see build_bedtime.to_speakable).

  * **The handful of terms that are not read the way they are spelled.**
    STEMI is "stemmy", ROSC is "rosk", Mobitz is not "mo-bits", and torsades de
    pointes is French.

  * **Numbers with units.** Nothing here: the scripts write "one hundred and
    twenty milliseconds", not "120 ms", because a unit abbreviation is a
    pronunciation problem the prose can simply decline to have.

Everything in the table is checked by check_bedtime.py against what the scripts
actually contain, so an entry that stops being used shows up rather than sitting
here forever.
"""
import re

# Spelled out letter by letter. The spaces are what make an English engine read
# them as letters rather than as a word; the leading and trailing spaces keep
# the replacement from fusing with whatever it lands next to.
#
# Some of these look unnecessary — an engine says "E C G" for "ECG" often
# enough. It is not reliable, it varies with the words around it, and the one
# night it decides "ECG" is a word is a night the listener is asleep and cannot
# rewind.
ACRONYMS = {
    # the tracing itself
    "ECG": "E C G",
    "EKG": "E K G",
    "QRS": "Q R S",
    "RS": "R S",
    "QS": "Q S",
    "PR": "P R",
    "QT": "Q T",
    "QTc": "Q T c",
    "ST": "S T",
    "TP": "T P",
    "RR": "R R",
    "PP": "P P",
    # anatomy and conduction
    "SA": "S A",
    "AV": "A V",
    "LAD": "L A D",
    "RCA": "R C A",
    "LBBB": "L B B B",
    "RBBB": "R B B B",
    "BBB": "B B B",
    # rhythms
    "VT": "V T",
    "pVT": "pulseless V T",
    "VF": "V F",
    "SVT": "S V T",
    "AF": "A F",
    "PEA": "P E A",
    "PVC": "P V C",
    "PAC": "P A C",
    "WPW": "W P W",
    # care
    "ACLS": "A C L S",
    "BLS": "B L S",
    "CPR": "C P R",
    "IV": "I V",
    "IO": "I O",
    "ETT": "E T T",
    "ICU": "I C U",
    "ED": "E D",
    "AED": "A E D",
    "ACS": "A C S",
    "MI": "M I",
    "JVP": "J V P",
    "TCP": "T C P",
    # leads
    "aVR": "a V R",
    "aVL": "a V L",
    "aVF": "a V F",
    "V1": "V one",
    "V2": "V two",
    "V3": "V three",
    "V4": "V four",
    "V5": "V five",
    "V6": "V six",
    "II": "two",
    "III": "three",
}

# Words an English engine says wrongly, respelled as the sound. Kept apart from
# the acronyms because these are not letters — they are ordinary words with
# unordinary spellings, and the two lists get argued with for different reasons.
RESPELL = {
    "STEMI": "stemmy",
    "NSTEMI": "non stemmy",
    "ROSC": "rosk",
    "Mobitz": "Moebits",
    "Wenckebach": "Vencke-bock",
    "torsades de pointes": "tor-sahd de pwant",
    "torsades": "tor-sahd",
    "Purkinje": "pur-kin-jee",
    "His": "hiss",          # the bundle of His, not the possessive
    "amiodarone": "ammy-oh-da-rone",
    "adenosine": "a-den-oh-seen",
    "atropine": "attro-peen",
    "epinephrine": "eppy-neff-rin",
    "asystole": "ay-sis-tuh-lee",
    "idioventricular": "iddy-oh-ventricular",
    "sinoatrial": "sino-ay-trial",
    "atrioventricular": "aytrio-ventricular",
    "hypokalemia": "hypo-kay-leemia",
    "hyperkalemia": "hyper-kay-leemia",
    "hypomagnesemia": "hypo-mag-nuh-seemia",
    "Osborn": "Ozborn",
    "calipers": "callipers",
}

# Nepali spellings for the few English words that appear *inside* a Nepali span.
# A [ne] span is read by a Nepali voice, which cannot see Latin script — anything
# left in it comes out as a stumble or as nothing at all. Only the terms the
# Nepali lines actually lean on are here; the rest of the technical vocabulary
# stays in the English narration where it belongs.
NE_TERMS = {
    "ECG": "ई सी जी",
    "QRS": "क्यू आर एस",
    "P wave": "पी वेभ",
    "T wave": "टी वेभ",
    "rhythm": "रिदम",
    "rate": "रेट",
    "monitor": "मोनिटर",
    "strip": "स्ट्रिप",
    "lead": "लिड",
    "J point": "जे पोइन्ट",
    "block": "ब्लक",
    "shock": "शक",
    "pulse": "पल्स",
    "ectopic": "एक्टोपिक",
    "aVR": "ए भी आर",
    "aVL": "ए भी एल",
    "aVF": "ए भी एफ",
    "V1": "भी वन",
    "V4": "भी फोर",
    "V5": "भी फाइभ",
    "V6": "भी सिक्स",
}

_used = set()


def _sub(text, mapping):
    """Replace whole words only, longest key first.

    Longest first matters more here than it looks: "PR" is a prefix of nothing,
    but "V1" would be eaten by a "V" rule and "NSTEMI" by a "STEMI" one, and the
    word boundaries below do not help when one key is a prefix of another.
    """
    for key in sorted(mapping, key=len, reverse=True):
        pat = re.compile(r"(?<![A-Za-z0-9])" + re.escape(key) + r"(?![A-Za-z0-9])")
        text, n = pat.subn(" " + mapping[key] + " ", text)
        if n:
            _used.add(key)
    return text


def to_spoken(text):
    """An English line as the English voice should receive it."""
    text = _sub(text, RESPELL)
    text = _sub(text, ACRONYMS)
    return re.sub(r"\s{2,}", " ", text).strip()


def to_nepali_terms(text):
    """The English terms inside a Nepali line, respelled in Devanagari."""
    return _sub(text, NE_TERMS)


def used():
    """Which table entries this process actually applied. For the linter."""
    return set(_used)


def all_keys():
    return set(ACRONYMS) | set(RESPELL) | set(NE_TERMS)
