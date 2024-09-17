/**
 * @file Interpreter file
 * @author Ondřej Hruboš
 */

/**
 * Interpreter class, acts as a Visitor for AST
 * @description We are pretending to be "compiling" to target machine code. This is in order to simulate single-pass of AST. Due to this reason, each visit 
 * 				function first calls semantic analyzer and then changes internal state of interpreter. The output is only visible to the user if no error 
 * 				is thrown.
 * @class Interpreter
 */
class Interpreter {

	constructor(){
		this.#symtableGlobal = new Symtable("global", "global");
		this.#symtableStack = new Stack();
		this.#symtableStack.push(this.#symtableGlobal);

		this.#semanticAnalyzer = new Semantic(this.#symtableStack);
	}

	/**
	 * Simple function that prepares ("""compiles""") the C code
	 * @param {string} code Code to be "compiled"
	 * @return {Object} TODO
	 * @throws {SError|Error}
	 */
	compile(code){
		return this.parse(code).semantic(this.#ast);
	}

	/* ATTRIBUTES */
	/**
	 * Parser instance
	 * @private
	 */
	#parser = c_parser;

	/**
	 * AST
	 * @private
	 * @type {AST}
	 */
	#ast;
	get ast(){
		return this.#ast;
	}

	/**
	 * Top-most (global) symbol table
	 * @private
	 * @type {Symtable}
	 */
	#symtableGlobal;
	get symtableGlobal(){
		return this.#symtableGlobal;
	}

	/**
	 * Symtable stack (mostly for printing reason)
	 */
	#symtableStack;
	get symtableStack(){
		return this.#symtableStack;
	}

	/**
	 * Semantic analyzer
	 * @private
	 * @type {Semantic}
	 */
	#semanticAnalyzer;

	/**
	 * Program counter
	 * @description Currently interpreted line
	 * @private
	 * @type {integer}
	 */
	#pc = 0;
	get pc(){
		return this.#pc;
	}

	/**
	 * Breakline
	 * @type {integer}
	 */
	#breakline = 0;

	/* GETTERS */
	/**
	 * Returns types defined by user (typedefs)
	 * @return {Array.<string>} User-defined types
	 */
	get userTypes(){
		return this.#parser.Parser.prototype.yy.lastSymbols.types;
	}

	/**
	 * Returns enums declared by user (enums)
	 * @return {Array.<string>} User-defined enums
	 */
	get userEnums(){
		return this.#parser.Parser.prototype.yy.lastSymbols.enums;
	}

	/* FUNCTIONS */
	/**
	* Parses user input
	* @descriptions Sets the #ast attribute of interpreter
	* @param {string} text User input
	* @return {Interpreter} Interpreter
	*/
	parse(text){
		this.#refreshSymbols();
		this.#ast = this.#parser.parse(text);
		return this;
	}

	/**
	 * Semantic analysis of single construct
	 * @throws {SError} Semantic error
	 * @param {AST} ast
	 */
	semantic(ast){
		for(const construct of ast){
			construct.accept(this.#semanticAnalyzer);
		}
		
		const mainFnc = this.#symtableGlobal.lookup("main");
		if(mainFnc){
			if(mainFnc.type != SYMTYPE.FNC){
				throw new SError("main is not a function");
			}
		}else{
			throw new SError("Undefined reference to main()")
		}
	}

	/**
	 * Interpret until specified breakline
	 * @throws {RTError|SError}
	 * @param {integer} line Interpret until this line number
	 * @todo change to run main() function
	 */
	interpretBreakline(breakline){
		this.#breakline = breakline;
		var iNum = 0;
		var construct = this.#ast[iNum];
		while(construct && construct.loc.first_line <= this.#breakline){
			construct.accept(this);
			this.updateHTML();

			iNum++;
			construct = this.#ast[iNum];
		}
	}

	/**
	 * Interprets ast (for now, maybe do IC later)
	 * @throws {RTError} Runtime error
	 * @param {AST} ast
	 * @todo change to run main() function
	 * @todo remove probably??? or make it run interpretBreakline until end
	 */
	//TODO
	interpret(ast){
		for(const construct of ast){
			construct.accept(this);
		}
		
		return this.#symtableGlobal.print();//TODO change this to return result of main()
	}

	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;
	};

	visitDeclarator(declarator){
	}

	visitIdentifier(id){

	}

	visitCStmt(stmt){
		var iNum = 0;
		var construct = stmt.sequence[iNum];
		while(construct && construct.loc.first_line <= this.#breakline){
			construct.accept(this);
			this.updateHTML();

			iNum++;
			construct = stmt.sequence[iNum];
		}
		
		/*for(var construct of stmt.sequence){ old version without breaklines
			construct.accept(this);
		}*/

		//! this.#symtableStack.peek().children.pop() // removes child not longer used (scope went out of its life)
	}

	visitFunc(func){
		func.body.accept(this); // run body
	}

	visitTypedef(typedef){
	}

	visitFuncCallExpr(funcCall){
	}

















	/* Helper functions */
	/**
	 * Refreshes cached symbols stored in parser
	 * @private
	 */
	#refreshSymbols(){
		this.#parser.Parser.prototype.yy.symbols = { types: [], enums: [] }; //? make this a class perhaps
	}

	/**
	 * Updates HTML to display interpreter output and generated structure
	 * @todo If needed, pass the element ids as arguments
	 */
	updateHTML(){
		document.getElementById("ast").innerHTML = JSON.stringify(this.#ast, null, 4);
		document.getElementById("programCounter").innerHTML = breaklineEditor + "/" + editor.getSession().getLength(); 
		document.getElementById("typedefs").innerHTML = JSON.stringify(this.userTypes.concat(this.userEnums), null, 4);
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print();
		document.getElementById("warnings").innerHTML = warnings.print();

		unhighlight(); // global function, defined in index.html

		// create new marker
		var rangeTBI = new Range(this.#breakline, 0, this.#breakline, 1); // to be interpreted
		var markerTBI = editor.getSession().addMarker(rangeTBI, "rangeTBI", "fullLine")
		var rangeJI = new Range(this.#breakline - 1, 0, this.#breakline - 1, 1); // just interpreted 
		var markerJI = editor.getSession().addMarker(rangeJI, "rangeJI", "fullLine")
	}
}
