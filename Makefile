include .env

run:
	firefox index.html

tests: test
test:
	jest tests/parser_lexer.test.js --config tests/jest.config.json 

doc: clean_doc
	jsdoc -r src/ -t ${TEMPLATE_PATH} -d doc/gen/ --readme README.md

run_doc: doc
	firefox doc.html

clean_doc:
	rm -f -r doc/doxy/html/
	rm -f -r doc/doxy/latex/

.PHONY: tests
