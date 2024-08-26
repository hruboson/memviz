/**
 * @file Interpreter file
 * @author Ondřej Hruboš
 */

/**
 * Runtime error
 * @class RTError
 */
class RTError extends Error {
	constructor(e) {
		super(e);
		this.name = "Runtime error";
	}
}

/**
 * Interpreter class, acts as a Visitor for AST
 * @descripiton Its main functions (parse, semantic, interpret) are designed to be daisy chained.
 * @class Interpreter
 * @singleton
 */
class Interpreter {

	// singleton hack
	static #instance;
	constructor(){
		this.#symtable = new Symtable("global", "global"); //tbh idk what ScopeInfo.type was supposed to be
		this.#semanticAnalyzer = new Semantic(this.#symtable);

		if(Interpreter.#instance){
			return Interpreter.#instance;
		}else{
			Interpreter.#instance = this;
		}
	}

	/**
	 * Simple function that runs all stages of interpreter (parser, semantic analyzer, interpret)
	 * @param {string} code Code to be interpreted
	 * @return {integer} Return value of main() function
	 */
	run(code){
		return this.parse(code).semantic(this.#ast).interpret(this.#ast);
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
	#symtable;
	get symtable(){
		return this.#symtable;
	}

	/**
	 * Semantic analyzer
	 * @private
	 * @type {Semantic}
	 */
	#semanticAnalyzer;
	get semanticAnalyzer(){
		return this.#semanticAnalyzer;
	}

	/**
	 * Program counter
	 * @private
	 */
	#pc = 0;
	get pc(){
		return this.#pc;
	}

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
	* @param {string} text User input
	* @return {Interpreter} Interpreter
	*/
	parse(text){
		this.#refreshSymbols();
		this.#ast = this.#parser.parse(text);
		this.#setProgramCounterText("0/" + this.#ast.length);
		document.getElementById("ast").innerHTML = JSON.stringify(interpreter.ast, null, 4);
		return this;
	}

	/**
	 * Analyses AST and returns Interpreter instance
	 * @throws {SError} Semantic error
	 * @param {AST} ast
	 * @return {Interpreter} Interpreter
	 */
	semantic(ast){
		for(var instruction of ast){
			instruction.accept(this.#semanticAnalyzer);
		}
		return this;
	}

	/**
	* @todo implement
	*/
	//TODO
	interpretSingle(){

	}

	/**
	 * Interprets instructions
	 * @throws {RTError} Runtime error
	 * @param {AST} ast
	 * @todo implement
	 * @todo change to run main() function
	 */
	//TODO
	interpret(ast){
		for(var instruction of ast){
			instruction.accept(this);
		}
		
		return JSON.stringify(Array.from(this.#symtable.symbols.entries()), null, 4); //TODO change this to return result of main()
	}

	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/
	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;
	};

















	/* Helper functions */
	/**
	 * Refreshes cached symbols stored in parser
	 * @return {void}
	 * @private
	 */
	#refreshSymbols(){
		this.#parser.Parser.prototype.yy.symbols = { types: [], enums: [] }; //TODO make this a class perhaps
	}

	#setProgramCounterText(text){
		document.getElementById("programCounter").innerHTML = text; 
	}

}

/**
 * Interpreter instance
 * @global
 */
const interpreter = new Interpreter();
