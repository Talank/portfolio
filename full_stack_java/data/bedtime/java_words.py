#!/usr/bin/env python3
"""Devanagari spellings for the Java vocabulary of this voyage.

shared/ne_pronounce.py already covers the vocabulary the DSA course speaks —
array, heap, stack, graph. Java brings its own two hundred words, and most of
them are said aloud here for the first time on the site.

They live here rather than in the shared table on purpose. A clip is cached by
the hash of exactly what was sent to the engine, so adding "node", "key",
"cache" or "method" to shared/ne_pronounce.py would change the spoken text of
clips in the DSA voyage too and silently invalidate part of an 87 MB render
that is finished and correct. Course-local words stay course-local; when a term
turns out to be genuinely shared, it can be promoted then.

Applied *before* ne_pronounce.to_devanagari(), so a term this table spells wins
over the shared one — which is what "map" needs: in the DSA voyage a map is a
Hash Map, here it is also `Map`, `HashMap` and `map()` on a Stream.

As in the shared table this is transliteration, not translation: the listener
is learning words they will later type into an editor, so `थ्रेड` (the English
word said the Nepali way) is right and a Nepali word for "strand" is wrong. The
story around it supplies the metaphor.
"""

import re

# Multi-word and camel-case names first, so their parts are not respelled
# separately and glued back together with a stumble in the middle.
PHRASES = {
    "Spring Boot": "स्प्रिङ बुट",
    "Spring Data": "स्प्रिङ डाटा",
    "Spring Security": "स्प्रिङ सेक्युरिटी",
    "Virtual Thread": "भर्चुअल थ्रेड",
    "virtual thread": "भर्चुअल थ्रेड",
    "Garbage Collector": "गार्बेज कलेक्टर",
    "garbage collector": "गार्बेज कलेक्टर",
    "garbage collection": "गार्बेज कलेक्सन",
    "Memory Model": "मेमोरी मोडेल",
    "memory model": "मेमोरी मोडेल",
    "Pattern Matching": "प्याटर्न म्याचिङ",
    "pattern matching": "प्याटर्न म्याचिङ",
    "Type Erasure": "टाइप इरेजर",
    "type erasure": "टाइप इरेजर",
    "flaky test": "फ्लेकी टेस्ट",
    "Flaky Test": "फ्लेकी टेस्ट",
    "unit test": "युनिट टेस्ट",
    "Unit Test": "युनिट टेस्ट",
    "connection pool": "कनेक्सन पुल",
    "thread pool": "थ्रेड पुल",
    "call stack": "कल स्ट्याक",
    "stack trace": "स्ट्याक ट्रेस",
    "log pose": "लग पोज",
    "Log Pose": "लग पोज",
    "LogPose": "लग पोज",
    "try-with-resources": "ट्राई विथ रिसोर्सेस",
    "for-each": "फर इच",
    "N+1": "एन प्लस वन",
    "n+1": "एन प्लस वन",
}

# Single words. Matched case-insensitively, because a script written over many
# days capitalises the same term both ways and both have to sound alike.
WORDS = {
    # the language and its shape
    "java": "जाभा",
    "class": "क्लास",
    "classes": "क्लासहरू",
    "object": "अब्जेक्ट",
    "objects": "अब्जेक्टहरू",
    "method": "मेथड",
    "methods": "मेथडहरू",
    "field": "फिल्ड",
    "fields": "फिल्ड",
    "variable": "भेरिएबल",
    "constructor": "कन्स्ट्रक्टर",
    "static": "स्ट्याटिक",
    "final": "फाइनल",
    "public": "पब्लिक",
    "private": "प्राइभेट",
    "protected": "प्रोटेक्टेड",
    "package": "प्याकेज",
    "import": "इम्पोर्ट",
    "interface": "इन्टरफेस",
    "abstract": "एब्स्ट्र्याक्ट",
    "extends": "एक्स्टेन्ड्स",
    "implements": "इम्प्लिमेन्ट्स",
    "override": "ओभरराइड",
    "overload": "ओभरलोड",
    "inheritance": "इनहेरिटेन्स",
    "polymorphism": "पोलिमर्फिजम",
    "encapsulation": "इनक्याप्सुलेसन",
    "enum": "इनम",
    "record": "रेकर्ड",
    "records": "रेकर्ड",
    "sealed": "सिल्ड",
    "generic": "जेनेरिक",
    "generics": "जेनेरिक्स",
    "wildcard": "वाइल्डकार्ड",
    "annotation": "एनोटेसन",
    "reflection": "रिफ्लेक्सन",
    "lambda": "ल्याम्ब्डा",
    "functional": "फङ्सनल",
    "stream": "स्ट्रिम",
    "streams": "स्ट्रिम",
    "optional": "अप्सनल",
    "collector": "कलेक्टर",
    "collectors": "कलेक्टर",
    "iterator": "इटरेटर",
    "collection": "कलेक्सन",
    "collections": "कलेक्सन",
    "boxing": "बक्सिङ",
    "autoboxing": "अटोबक्सिङ",
    "immutable": "इम्युटेबल",
    "mutable": "म्युटेबल",
    "switch": "स्विच",
    "loop": "लुप",
    "exception": "एक्सेप्सन",
    "exceptions": "एक्सेप्सन",
    "throw": "थ्रो",
    "throws": "थ्रोज",
    "catch": "क्याच",
    "finally": "फाइनल्ली",
    "checked": "चेक्ड",
    "unchecked": "अनचेक्ड",
    "error": "एरर",
    "resource": "रिसोर्स",
    "resources": "रिसोर्स",
    "closeable": "क्लोजेबल",
    "iterable": "इटरेबल",
    "comparable": "कम्पेरेबल",
    "comparator": "कम्पेरेटर",
    "equals": "इक्वल्स",
    "hashcode": "ह्यास कोड",
    "tostring": "टु स्ट्रिङ",
    "stringbuilder": "स्ट्रिङ बिल्डर",
    "builder": "बिल्डर",
    "pool": "पुल",
    "intern": "इन्टर्न",
    "contract": "कन्ट्र्याक्ट",
    "instance": "इन्स्टेन्स",
    "constant": "कन्स्ट्यान्ट",
    "return": "रिटर्न",
    "null": "नल",
    "void": "भ्वाइड",
    "true": "ट्रु",
    "false": "फल्स",

    # types
    "primitive": "प्रिमिटिभ",
    "reference": "रेफरेन्स",
    "references": "रेफरेन्स",
    "int": "इन्ट",
    "integer": "इन्टिजर",
    "long": "लङ",
    "double": "डबल",
    "float": "फ्लोट",
    "boolean": "बुलियन",
    "char": "क्यार",
    "byte": "बाइट",
    "bytes": "बाइट",
    "short": "सर्ट",
    "var": "भार",

    # the machine
    "jvm": "जे भी एम",
    "jdk": "जे डी के",
    "jre": "जे आर ई",
    "javac": "जाभा सी",
    "javap": "जाभा पी",
    "jshell": "जे सेल",
    "bytecode": "बाइटकोड",
    "compiler": "कम्पाइलर",
    "compile": "कम्पाइल",
    "interpreter": "इन्टरप्रिटर",
    "jit": "जे आई टी",
    "classloader": "क्लासलोडर",
    "heap": "हिप",
    "runtime": "रनटाइम",
    "profiler": "प्रोफाइलर",
    "profiling": "प्रोफाइलिङ",
    "benchmark": "बेन्चमार्क",
    "flame": "फ्लेम",
    "native": "नेटिभ",
    "graalvm": "ग्रल भी एम",
    "gluon": "ग्लुओन",
    "jlink": "जे लिङ्क",
    "jpackage": "जे प्याकेज",

    # data & collections
    "arraylist": "एरे लिस्ट",
    "linkedlist": "लिङ्क्ड लिस्ट",
    "hashmap": "ह्यास म्याप",
    "linkedhashmap": "लिङ्क्ड ह्यास म्याप",
    "treemap": "ट्री म्याप",
    "hashset": "ह्यास सेट",
    "treeset": "ट्री सेट",
    "arraydeque": "एरे डेक",
    "priorityqueue": "प्रायोरिटी क्यू",
    "concurrenthashmap": "कन्करेन्ट ह्यास म्याप",
    "bucket": "बकेट",
    "buckets": "बकेट",
    "capacity": "क्यापासिटी",
    "load": "लोड",
    "factor": "फ्याक्टर",
    "resize": "रिसाइज",
    "iteration": "इटरेसन",
    "index": "इन्डेक्स",
    # "कि" was wrong twice over: the vowel is long, and a bare कि is one of the
    # commonest Nepali conjunctions, so "किले भ्यालु खोज्छ" parsed as a question.
    "key": "की",
    "keys": "की",
    "value": "भ्यालु",
    "values": "भ्यालु",
    "entry": "एन्ट्री",
    "node": "नोड",
    "cache": "क्यास",
    "lru": "एल आर यू",

    # concurrency
    "thread": "थ्रेड",
    "threads": "थ्रेड",
    "runnable": "रन्नेबल",
    "synchronized": "सिन्क्रोनाइज्ड",
    "volatile": "भोलाटाइल",
    "atomic": "एटोमिक",
    "executor": "एक्जिक्युटर",
    "future": "फ्युचर",
    "completablefuture": "कम्प्लिटेबल फ्युचर",
    "lock": "लक",
    "deadlock": "डेडलक",
    "race": "रेस",
    "loom": "लुम",

    # build, test, ship
    "maven": "मेभन",
    "gradle": "ग्रेडल",
    "pom": "पोम",
    "dependency": "डिपेन्डेन्सी",
    "dependencies": "डिपेन्डेन्सी",
    "artifact": "आर्टिफ्याक्ट",
    "module": "मोड्युल",
    "modules": "मोड्युल",
    "lifecycle": "लाइफसाइकल",
    "plugin": "प्लगिन",
    "scope": "स्कोप",
    "jar": "जार",
    "build": "बिल्ड",
    "test": "टेस्ट",
    "tests": "टेस्ट",
    "junit": "जे युनिट",
    "mockito": "मकिटो",
    "mock": "मक",
    "mocks": "मक",
    "stub": "स्टब",
    "spy": "स्पाई",
    "fake": "फेक",
    "assert": "एसर्ट",
    "assertion": "एसर्सन",
    "coverage": "कभरेज",
    "mutation": "म्युटेसन",
    "flaky": "फ्लेकी",
    "testcontainers": "टेस्ट कन्टेनर्स",
    "jmh": "जे एम एच",
    "tdd": "टी डी डी",

    # data stores
    "sql": "एस क्यू एल",
    "postgresql": "पोस्टग्रे एस क्यू एल",
    "postgres": "पोस्टग्रेस",
    "database": "डाटाबेस",
    "table": "टेबल",
    "row": "रो",
    "rows": "रो",
    # "कलम" is a pen. The English word has two syllables and an o.
    "column": "कोलम",
    "columns": "कोलम",
    "join": "जोइन",
    "query": "क्वेरी",
    "transaction": "ट्रान्ज्याक्सन",
    "commit": "कमिट",
    "rollback": "रोलब्याक",
    "acid": "एसिड",
    "jdbc": "जे डी बी सी",
    "jpa": "जे पी ए",
    "hibernate": "हाइबरनेट",
    "entity": "एन्टिटी",
    "repository": "रिपोजिटरी",
    "flyway": "फ्लाइवे",
    "migration": "माइग्रेसन",
    "pgvector": "पी जी भेक्टर",

    # web & app
    "http": "एच टी टी पी",
    "rest": "रेस्ट",
    "json": "जे सन",
    "jackson": "ज्याक्सन",
    "endpoint": "एन्डपोइन्ट",
    "request": "रिक्वेस्ट",
    "response": "रेस्पोन्स",
    "client": "क्लाइन्ट",
    "server": "सर्भर",
    "browser": "ब्राउजर",
    "spring": "स्प्रिङ",
    "bean": "बिन",
    "beans": "बिन",
    "injection": "इन्जेक्सन",
    "controller": "कन्ट्रोलर",
    "service": "सर्भिस",
    "validation": "भ्यालिडेसन",
    "jwt": "जे डब्ल्यू टी",
    "token": "टोकन",
    "thymeleaf": "थाइमलिफ",
    "react": "रियाक्ट",
    "vaadin": "भादिन",
    "javafx": "जाभा एफ एक्स",
    "fxml": "एफ एक्स एम एल",
    "canvas": "क्यानभास",
    "libgdx": "लिब जी डी एक्स",
    "frame": "फ्रेम",
    "render": "रेन्डर",

    # search
    "lucene": "लुसिन",
    "tokenization": "टोकनाइजेसन",
    "embedding": "एम्बेडिङ",
    "embeddings": "एम्बेडिङ",
    "vector": "भेक्टर",
    "semantic": "सिमान्टिक",
    "onnx": "ओ एन एन एक्स",
    "djl": "डी जे एल",
}

_UNSAFE = re.compile(r"[A-Za-z]")
for _k, _v in list(PHRASES.items()) + list(WORDS.items()):
    assert not _UNSAFE.search(_v), f"{_k!r} maps to Latin text: {_v!r}"


def _compile(mapping, flags=0):
    """One alternation over the whole mapping, longest key first.

    Same shape as ne_pronounce._compile, and for the same reason: separate
    per-key passes would let an earlier replacement's output be re-scanned by a
    later key, and a single pass over the original string cannot.
    """
    keys = sorted(mapping, key=len, reverse=True)
    return re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(k) for k in keys)
                      + r")(?![A-Za-z])", flags)


_PHRASE_RE = _compile(PHRASES)
_WORD_RE = _compile(WORDS, re.IGNORECASE)


def to_devanagari(text):
    text = _PHRASE_RE.sub(lambda m: PHRASES[m.group(1)], text)
    return _WORD_RE.sub(lambda m: WORDS[m.group(1).lower()], text)


if __name__ == "__main__":
    import os
    import sys
    from collections import Counter

    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                    *[".."] * 3, "shared"))
    import ne_pronounce

    missing = Counter()
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as f:
            text = ne_pronounce.to_devanagari(to_devanagari(f.read()))
        missing.update(t for t in re.findall(r"[A-Za-z][A-Za-z'’-]*", text)
                       if len(t) > 1)
    if not missing:
        print("no uncovered Latin terms")
    for term, n in missing.most_common():
        print(f"{n:5d}  {term}")
