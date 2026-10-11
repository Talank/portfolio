#!/usr/bin/env python3
"""Build the CV (PDF) and the website data from the CSV files in cv/data/.

    python3 build.py            # CSV -> LaTeX -> cv/build/cv.pdf -> ../resume.pdf, and sync the website
    python3 build.py --no-pdf   # only regenerate cv/generated/*.tex and data/site-data.json
    python3 build.py --no-site  # leave data/site-data.json alone

cv/data/*.csv is the only place facts live. cv.tex and cvstyle.sty hold the
layout; this script only turns rows into calls to the macros defined there,
escaping text on the way, so a CSV cell never needs LaTeX in it.

Conventions shared by every CSV:
  * lists inside one cell are separated by ';' (authors, interests, skills)
    or '|' (experience bullets, since bullets may contain ';')
  * dates are YYYY-MM (or YYYY); rows are sorted newest first, so append
    new rows anywhere
  * an empty CSV (header only) hides its section in the PDF
Stdlib only.
"""
import argparse
import csv
import datetime
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
GEN = HERE / "generated"
BUILD = HERE / "build"
SITE_ROOT = HERE.parent
SITE_JSON = SITE_ROOT / "data" / "site-data.json"
RESUME_PDF = SITE_ROOT / "resume.pdf"

MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()

# Publication groups in the order they appear in the CV, with the letter used
# for their labels ([C3], [D1], ...).
PUB_GROUPS = [
    ("conference", "C", "Conference Papers"),
    ("journal", "J", "Journal Articles"),
    ("workshop", "W", "Workshop Papers"),
    ("demo", "D", "Tool Demonstrations"),
    ("under_review", "U", "Under Review"),
]


# ---------------------------------------------------------------- reading

def read(name):
    with open(DATA / f"{name}.csv", newline="", encoding="utf-8") as f:
        return [{k: (v or "").strip() for k, v in row.items()} for row in csv.DictReader(f)]


def profile():
    return {r["key"]: r["value"] for r in read("profile")}


def split(cell, sep=";"):
    return [p.strip() for p in cell.split(sep) if p.strip()]


def newest_first(rows, key="date"):
    return sorted(rows, key=lambda r: r[key], reverse=True)


def month_year(date):
    parts = date.split("-")
    if len(parts) >= 2:
        return f"{MONTHS[int(parts[1]) - 1]} {parts[0]}"
    return parts[0]


def year(date):
    return date.split("-")[0]


def when(date):
    """'2022-08' -> 'Aug 2022', '2022' -> '2022', 'present' -> 'Present'."""
    return "Present" if date.lower() == "present" else month_year(date)


def period_tex(start, end):
    """The two lines of a date range ('Aug 2022--', 'Present'): they sit beside
    an entry's title and organization lines, so the narrow date column never
    wraps on its own (and a month never splits from its year)."""
    a, b = (tex(when(d)).replace(" ", "~") for d in (start, end))
    return a + "--", b


# ---------------------------------------------------------------- LaTeX

_TEX = {
    "\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#",
    "_": r"\_", "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}", "^": r"\textasciicircum{}",
}


def tex(text):
    """Escape plain CSV text for LaTeX. '--' is left alone so ranges stay en-dashes."""
    return "".join(_TEX.get(c, c) for c in text)


def url_arg(url):
    # \href survives everything but these inside a macro argument
    return url.replace("\\", "/").replace("%", r"\%").replace("#", r"\#")


def call(macro, *args):
    return "\\" + macro + "".join("{" + a + "}" for a in args)


def authors_tex(names, me):
    out = []
    for n in names:
        out.append(call("me", tex(n)) if n == me else tex(n))
    if len(out) > 2:
        return ", ".join(out[:-1]) + ", and " + out[-1]
    return " and ".join(out)


def pub_links(p):
    links = []
    if p["doi"]:
        links.append(("DOI", "https://doi.org/" + p["doi"]))
    for col, label in (("pdf", "PDF"), ("slides", "Slides"), ("code", "Code"), ("artifact", "Artifact")):
        if p[col] and p[col] != "soon":
            links.append(("arXiv" if "arxiv.org" in p[col] else label, p[col]))
    return links


def gen_publications(pubs, me):
    out = []
    for cat, letter, heading in PUB_GROUPS:
        group = newest_first([p for p in pubs if p["category"] == cat])
        if not group:
            continue
        out.append(call("cvsubsection", heading))
        out.append(r"\begin{cvpubs}")
        for i, p in enumerate(group):
            label = f"{letter}{len(group) - i}"
            if p["status"] == "under_review":
                venue = r"\textit{Under review}"
            else:
                bits = [r"\textit{" + tex(p["venue_full"]) + "}"]
                if p["track"]:
                    bits.append(tex(p["track"]))
                if p["pages"]:
                    bits.append("pp.~" + tex(p["pages"]))
                if p["location"]:
                    bits.append(tex(p["location"]))
                bits.append(year(p["date"]))
                if p["status"] == "accepted":
                    bits.append(r"\textit{to appear}")
                venue = ", ".join(bits)
            extras = []
            if p["acceptance_rate"]:
                extras.append(call("pubrate", tex(p["acceptance_rate"])))
            extras += [call("publink", url_arg(u), l) for l, u in pub_links(p)]
            out.append(call(
                "cvpub", label, tex(p["venue_short"]),
                authors_tex(split(p["authors"]), me), tex(p["title"]), venue,
                call("pubaward", tex(p["award"])) if p["award"] else "",
                " ".join(extras),
            ))
        out.append(r"\end{cvpubs}")
    return "\n".join(out)


def gen_education(rows):
    out = []
    for r in rows:
        notes = []
        if r["gpa"]:
            notes.append("GPA: " + tex(r["gpa"]))
        if r["details"]:
            notes.append(tex(r["details"]))
        out.append(call("cventry", tex(r["degree"]), *period_tex(r["start"], r["end"]),
                        tex(r["institution"]), tex(r["location"]), " \\textbullet{} ".join(notes)))
    return "\n".join(out)


def gen_experience(rows):
    out = []
    for r in newest_first(rows, "start"):
        items = "".join(r"\item " + tex(b) + "\n" for b in split(r["bullets"], "|"))
        body = r"\begin{cvitems}" + "\n" + items + r"\end{cvitems}" if items else ""
        out.append(call("cventry", tex(r["role"]), *period_tex(r["start"], r["end"]),
                        tex(r["organization"]), tex(r["location"]), body))
    return "\n".join(out)


def gen_teaching(rows):
    return "\n".join(
        call("cvline", tex(r["term"]),
             r"\textbf{" + tex(r["course"]) + "}: " + tex(r["title"]) + r" \hfill \textit{" + tex(r["role"]) + "}")
        for r in rows)


def gen_awards(rows, pubs):
    # Paper awards live on the publication row; they are listed here too so
    # the honors section can never fall out of step with the paper.
    merged = [dict(date=p["date"], when="", title=p["award"], organization=p["venue_short"],
                   description=p["title"], paper=True)
              for p in pubs if p["award"]]
    merged += rows
    out = []
    for r in newest_first(merged):
        when = tex(r["when"]) if r["when"] else month_year(r["date"])
        icon = r"\awardicon{} " if r.get("paper") else ""
        what = icon + r"\textbf{" + tex(r["title"]) + "}, " + tex(r["organization"])
        if r["description"]:
            what += r"\newline\textcolor{muted}{\small " + tex(r["description"]) + "}"
        out.append(call("cvline", when, what))
    return "\n".join(out)


def gen_talks(rows):
    out = []
    for r in newest_first(rows):
        what = (r"\textit{" + tex(r["title"]) + r"}\newline{\small " + tex(r["event"])
                + r" \textbullet{} " + tex(r["kind"]) + r" \textbullet{} " + tex(r["location"]) + "}")
        out.append(call("cvline", month_year(r["date"]), what))
    return "\n".join(out)


def gen_service(rows):
    return "\n".join(call("cvline", tex(r["year"]), tex(r["role"]) + ", " + tex(r["venue"]))
                     for r in sorted(rows, key=lambda r: r["year"], reverse=True))


def gen_opensource(rows):
    out = []
    for r in rows:
        name = r"\textbf{" + tex(r["name"]) + "}"
        if r["url"]:
            name = call("href", url_arg(r["url"]), name)
        out.append(r"\item " + name + ": " + tex(r["description"]))
    return r"\begin{cvitems}" + "\n" + "\n".join(out) + "\n" + r"\end{cvitems}" if out else ""


def gen_skills(rows):
    return "\n".join(call("cvline", tex(r["category"]), ", ".join(tex(s) for s in split(r["items"])))
                     for r in rows)


def gen_profile(p):
    fields = {k: tex(p[k]) for k in ("name", "title", "affiliation", "department", "address",
                                      "email", "website", "github", "linkedin", "orcid", "summary")}
    fields["interests"] = r" \textperiodcentered{} ".join(tex(i) for i in split(p["interests"]))
    fields["updated"] = datetime.date.today().strftime("%B %Y")
    return "\n".join(f"\\newcommand{{\\cv{k}}}{{{v}}}" for k, v in fields.items())


def section(title, body):
    """Wrap a generated body in its heading, or nothing at all if it is empty."""
    if not body.strip():
        return "% (empty: section hidden)\n"
    return call("cvsection", title) + "\n" + body + "\n"


def write_tex():
    p = profile()
    me = p["name"]
    pubs = read("publications")
    parts = {
        "profile": gen_profile(p),
        "education": section("Education", gen_education(read("education"))),
        "publications": section("Publications", gen_publications(pubs, me)),
        "awards": section("Honors \\& Awards", gen_awards(read("awards"), pubs)),
        "experience": section("Experience", gen_experience(read("experience"))),
        "teaching": section("Teaching", gen_teaching(read("teaching"))),
        "talks": section("Invited \\& Conference Talks", gen_talks(read("talks"))),
        "service": section("Professional Service", gen_service(read("service"))),
        "opensource": section("Open-Source Contributions", gen_opensource(read("opensource"))),
        "skills": section("Technical Skills", gen_skills(read("skills"))),
    }
    GEN.mkdir(exist_ok=True)
    for name, body in parts.items():
        (GEN / f"{name}.tex").write_text(
            "% GENERATED by build.py from data/*.csv -- edit the CSV, not this file.\n" + body + "\n",
            encoding="utf-8")
    print(f"wrote {len(parts)} files to {GEN.relative_to(SITE_ROOT)}/")


def build_pdf():
    """latexmk (TeX Live) if present, else tectonic (a single self-contained binary)."""
    BUILD.mkdir(exist_ok=True)
    local = HERE / ".tools" / "tectonic"
    tectonic = os.environ.get("TECTONIC") or shutil.which("tectonic") or (str(local) if local.exists() else None)
    env = dict(os.environ, XDG_CACHE_HOME=str(HERE / ".tools"))  # keep tectonic's cache in the repo
    if shutil.which("latexmk"):
        cmd = ["latexmk", "-pdf", "-interaction=nonstopmode", "-halt-on-error", f"-outdir={BUILD}", "cv.tex"]
    elif tectonic:
        cmd = [tectonic, "--keep-logs", "--outdir", str(BUILD), "cv.tex"]
    else:
        sys.exit("No TeX engine found: install TeX Live or tectonic (see cv/README.md), or run with --no-pdf")
    r = subprocess.run(cmd, cwd=HERE, env=env, capture_output=True, text=True)
    if r.returncode:
        sys.stdout.write((r.stdout + r.stderr)[-4000:])
        sys.exit("LaTeX failed; full log in cv/build/cv.log")
    shutil.copyfile(BUILD / "cv.pdf", RESUME_PDF)
    print(f"built cv/build/cv.pdf -> {RESUME_PDF.name}")


# ---------------------------------------------------------------- website

def md_inline(text):
    """The tiny bit of Markdown news.csv allows: **bold** and [text](url)."""
    s = html.escape(text, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    return re.sub(r"\[(.+?)\]\((\S+?)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)


def site_venue(p):
    bits = [p["venue_full"]]
    if p["track"]:
        bits.append(p["track"])
    if p["location"]:
        bits.append(p["location"])
    if p["pages"]:
        bits.append("pages " + p["pages"].replace("--", "–"))
    bits.append(year(p["date"]))
    return ", ".join(bits) + "."


def write_site():
    p = profile()
    site = json.loads(SITE_JSON.read_text(encoding="utf-8")) if SITE_JSON.exists() else {}
    site["_generated"] = "Generated by cv/build.py from cv/data/*.csv. Edit the CSVs, not this file."
    site["profile"] = {
        "name": p["name"],
        "title": p["title"].replace("Ph.D.", "PhD"),
        "affiliation": p["affiliation"],
        "photo": p["photo"],
        "bio": p["summary"],
        "tags": split(p["tags"]),
    }
    site["news"] = [
        {"date": r["date"], "highlighted": r["highlighted"].lower() == "yes", "html": md_inline(r["text"])}
        for r in newest_first(read("news"))
    ]
    pubs = []
    for r in newest_first(read("publications")):
        if r["status"] not in ("published", "accepted"):
            continue  # the website lists published work only
        pub = {
            "title": r["title"],
            "authors": split(r["authors"]),
            "venueShort": r["venue_short"],
            "venue": site_venue(r),
            "year": year(r["date"]),
            "status": r["status"],
            "links": [{"label": l, "url": u} for l, u in pub_links(r)],
        }
        if r["slides"] == "soon":
            pub["pending"] = ["Slides"]
        if r["award"]:
            pub["award"] = r["award"]
        if r["acceptance_rate"]:
            pub["acceptanceRate"] = r["acceptance_rate"]
        pubs.append(pub)
    site["publications"] = pubs
    exp = []  # the website lists jobs only; TA terms stay in the PDF's Teaching section
    for r in newest_first(read("experience"), "start"):
        org = html.escape(r["organization"])
        if r["url"]:
            org = f'<a href="{html.escape(r["url"])}" target="_blank" rel="noopener">{org}</a>'
        exp.append({"role": r["role"], "period": f"{when(r['start'])} &ndash; {when(r['end'])}", "html": org})
    site["experience"] = exp
    site["blogs"] = {"html": f'You can find my blogs at <a href="{p["blog"]}" target="_blank" rel="noopener">dev.to</a>'}
    SITE_JSON.write_text(json.dumps(site, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {SITE_JSON.relative_to(SITE_ROOT)} ({len(pubs)} publications, {len(site['news'])} news)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--no-pdf", action="store_true", help="skip the LaTeX compile")
    ap.add_argument("--no-site", action="store_true", help="do not touch data/site-data.json")
    a = ap.parse_args()
    write_tex()
    if not a.no_site:
        write_site()
    if not a.no_pdf:
        build_pdf()


if __name__ == "__main__":
    main()
