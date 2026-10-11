# CV + website data

One set of CSV files feeds both the PDF CV (`../resume.pdf`) and the website
(`../data/site-data.json`). Edit a CSV, run `make`, done.

```
cv/
  data/*.csv     <- the only files you edit
  build.py       <- CSV -> generated/*.tex -> build/cv.pdf -> ../resume.pdf, and -> ../data/site-data.json
  cv.tex         <- section order
  cvstyle.sty    <- all design (fonts, colors, spacing)
  generated/     <- written by build.py (git-ignored)
  build/         <- LaTeX output (git-ignored)
```

## Common edits

| To...                                | Edit                                   |
|--------------------------------------|----------------------------------------|
| add a paper                          | a row in `publications.csv`            |
| mark a paper accepted / published    | its `status` column: `under_review` -> `accepted` -> `published` |
| add a paper award                    | its `award` column (it also appears under Honors & Awards automatically) |
| say slides are coming                | put `soon` in its `slides` column; replace with the URL later |
| add news to the website              | a row in `news.csv` (`**bold**` and `[text](url)` allowed) |
| add a talk / award / TA term         | `talks.csv` / `awards.csv` / `teaching.csv` |
| change a job or its dates            | `experience.csv` (`start`/`end` are `YYYY-MM` or `present`) |
| add reviewing or other service       | `service.csv` (the section stays hidden while it is empty) |

Rules: list cells use `;` (authors, skills) or `|` (experience bullets); dates are
`YYYY-MM`; rows can be in any order (they are sorted newest first); write plain
text, never LaTeX: `build.py` escapes `&`, `%`, `_`, `#` and the rest.
Your own name (from `profile.csv`) is bolded in every author list.

Publication `category` is one of `conference`, `journal`, `workshop`, `demo`,
`under_review`. The website shows only `published` and `accepted` rows.

## Building

```
make          # PDF + website data
make site     # website data only (needs no LaTeX)
```

The PDF needs either TeX Live (`sudo apt install latexmk texlive-latex-extra
texlive-fonts-extra`) or a `tectonic` binary. If neither is on your `PATH`,
`build.py` uses `cv/.tools/tectonic` (git-ignored), keeping its package cache in
`cv/.tools/` too.

To preview the website locally: `python3 -m http.server` in the repo root, then
open http://localhost:8000.
