include .env

run:
	firefox index.html

parser:
	cd src/parser/ && jison c_parser.jison c_parser.jisonlex

doc: clean_doc
	jsdoc -r src/ -t ${TEMPLATE_PATH} -d doc/gen/ --readme README.md

run_doc: doc
	firefox doc.html

clean_doc:
	rm -f -r doc/gen/

.PHONY: tests
