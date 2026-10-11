# make        rebuild resume.pdf and the website data from data/*.csv
# make site   only regenerate data/site-data.json (no LaTeX needed)
# make clean  remove build output

all:
	python3 build.py

site:
	python3 build.py --no-pdf

clean:
	rm -rf build generated

.PHONY: all site clean
