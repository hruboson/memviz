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
 * @description We are pretending to be "compiling" to target machine code. This is in order to simulate single-pass of AST. Due to this reason, each visit 
 * 				function first calls semantic analyzer and then changes internal state of interpreter. The output is only visible to the user if no error 
 * 				is thrown.
 * @class Interpreter
 */
class Interpreter {

	constructor(){
		this.#symtableGlobal = new Symtable("global", "global"); //tbh idk what ScopeInfo.type was supposed to be
		this.#symtableStack = new Stack();
		this.#symtableStack.push(this.#symtableGlobal);

		this.#semanticAnalyzer = new Semantic(this.#symtableStack);
	}

	/**
	 * Simple function that runs all stages of interpreter
	 * @param {string} code Code to be interpreted
	 * @return {integer} Return value of main() function
	 * @throws {RTError|SError|Error}
	 */
	run(code){
		return this.parse(code).interpret(this.#ast);
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
	 * @param {Construct} construct
	 */
	semantic(construct){
		construct.accept(this.#semanticAnalyzer);
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
		
		return this.#symtableGlobal.print();//TODO change this to return result of main()
	}

	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		this.semantic(declaration);

		const declarator = declaration.declarator;
		const initializer = declaration.initializer;
	};

	visitCompoundStatement(stmt){
		this.semantic(stmt);

		for(var instruction of stmt.sequence){
			this.semantic(instruction);
			instruction.accept(this);
		}
	}

	visitFunc(func){
		this.semantic(func);

		func.body.accept(this);
	}

















	/* Helper functions */
	/**
	 * Refreshes cached symbols stored in parser
	 * @return {void}
	 * @private
	 */
	#refreshSymbols(){
		this.#parser.Parser.prototype.yy.symbols = { types: [], enums: [] }; //? make this a class perhaps
	}

	updateHTML(){
		document.getElementById("ast").innerHTML = JSON.stringify(this.#ast, null, 4);
		document.getElementById("programCounter").innerHTML = this.#pc + "/" + this.#ast.length; 
		document.getElementById("typedefs").innerHTML = JSON.stringify(this.userTypes.concat(this.userEnums), null, 4);
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print(); 
	}

}
