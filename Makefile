run:
	firefox index.html

tests: test
test:
	jest tests/parser_lexer.test.js --config tests/jest.config.json 

doxy: doxygen
doxygen: clean_doc
	doxygen Doxyfile

clean_doc:
	rm -f -r doc/doxy/html/
	rm -f -r doc/doxy/latex/

.PHONY: tests
