include .env

# Detect the operating system
UNAME_S := $(OS)
FIREFOX := firefox

ifeq ($(UNAME_S),Darwin) # MacOS
    RM_RF := rm -rf
endif
ifeq ($(UNAME_S),Windows_NT)
	RM_RF := echo y|rmdir /s 
	FIREFOX := start firefox
else # Linux
    RM_RF := rm -rf
endif

run:
	$(FIREFOX) index.html

parser:
	cd src/parser/ && jison c_parser.jison c_parser.jisonlex

doc: clean_doc
	jsdoc -r src/ -t ${TEMPLATE_PATH} -d doc/gen/ --readme README.md

run_doc: doc
	$(FIREFOX) doc.html

clean_doc:
	$(RM_RF) "doc/gen/"

.PHONY: tests
