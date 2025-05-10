# MEMVIZ
C memory visualization in JavaScript using the maxGraph library.

Author: Ondřej Hruboš

[License](LICENSE), [Documentation](doc/gen/index.html)

# About

This tool is capable of interpreting simple C constructs (excluding `structs`, `unions`, `enums`) and then visualize the memory space.
It was built for beginners, who are just starting with the C language. There are no macros, built-in functions include:
- `printf`,
- `malloc`,
- `free`.

The version of the C language is the ISO/IEC 9899:1999 (also known as **C99**) with some advanced keywords omitted. The exact
grammar can be found in the `src/parser/` folder.

# User Manual

The application requires no special installation. To run it:

1. Open the **`index.html`** file (in the main directory) in a web browser  
   *(such as Mozilla Firefox, Google Chrome, Microsoft Edge, etc.)*
2. The application runs entirely client-side  
- No internet connection is required after initial loading  
- All necessary libraries are included in the distribution

## User Interface Overview

The main interface consists of three sections:

![UI Description](doc/ui-info.drawio-en.png)  
*Application interface layout*

1. **Code Editor** (left panel)
2. **Memory Visualization** (right panel)
3. **Control Panel** (top menu bar)

## Control Panel Functions

The control panel contains these buttons (left to right):

| Button          | Functionality |
|-----------------|---------------|
| **Compile**     | Compiles code and prepares for execution |
| **Step Forward**| Executes one program step |
| **Step Back**   | Returns one step backward |
| **Reset**       | Returns interpretation to program start |
| **Run**         | Executes the entire program |

# Deriving from this work

This project is modular, so you can use individual components as needed:

### Parser
The parser generates a pretty good AST (with some minor things still untested). To use only the parser, get the `c_parser.js` file and use
it on its own. The usage would be something like:

```
<script src="c_parser.js"> 
<script>

const ast = c_parser.parse(text); // parser stored in global variable c_parser

</script>
```

### Interpreter

Interpreter works without visualization (just don't call the `updateHTML` function). You can also try implementing new functions like `random`
in the `nativefuncs.js` file. Also don't forget to add native function to symbol table in `semantic.js` - `addNativeFunctions`.

### Memory simulator
While maybe not completely usable on its own, it poses as a good start if you need low-level memory simulation. The implmenentation
builds on the `ArrayBuffer` and `DataView` classes of JavaScript.

## Compiling parser

If you need to change the grammar or AST generation, you will have to re-compile the parser.

Prerequisities:
- [Jison](https://gerhobbelt.github.io/jison/docs/)
- [make](https://www.gnu.org/software/make/)

Then run:

`make parser`

or without make:

`cd src/parser/ && jison c_parser.jison c_parser.jisonlex`

## Generating documentation

Prerequisities:
- [JSDoc](https://jsdoc.app/)
- [docdash](https://clenemt.github.io/docdash/) theme for JSDoc
- set `TEMPLATE_PATH` to *docdash* path in `.env` (if the file does not exist, create it at index level)
- [make](https://www.gnu.org/software/make/)
Then run:

`make doc`

or without make (replace the docdash template path):

`jsdoc -r src/ -t YOUR_DOCDASH_TEMPLATE_PATH -d doc/gen/ --readme README.md`

## External libraries
All libraries are stored locally in the `lib/` folder. The libraries include:
- **ace** editor
- **bootstrap**
- **boxicons**
- **jsoneditor** (mostly for debugging)
- **maxGraph**
- **split.js**

## Tests
Tests are accessible from the [tests.html](/tests.html) page. They are defined in the `tests/` folder.
