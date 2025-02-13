include .env

# Detect the operating system
UNAME_S := $(shell uname -s)

ifeq ($(UNAME_S),Darwin) # MacOS
    RM_RF := rm -rf
endif
ifeq ($(UNAME_S),Windows_NT)
	RM_RF := rmdir /s
else # Linux
    RM_RF := rm -rf
endif

run:
	firefox index.html

parser:
	cd src/parser/ && jison c_parser.jison c_parser.jisonlex

doc: clean_doc
	jsdoc -r src/ -t ${TEMPLATE_PATH} -d doc/gen/ --readme README.md

run_doc: doc
	firefox doc.html

clean_doc:
	$(RM_RF) doc/gen/

.PHONY: tests
