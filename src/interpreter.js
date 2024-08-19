/**
 * @file Interpreter file
 * @author Ondřej Hruboš
 */

/**
 * Interpreter class, acts as a Visitor for AST
 * @class Interpreter
 * @singleton
 */
class Interpreter {

	// singleton hack
	static #instance;
	constructor(){
		if(Interpreter.#instance){
			return Interpreter.#instance;
		}else{
			Interpreter.#instance = this;
		}
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
	 * Program counter
	 * @private
	 */
	#pc = 0;
	get pc(){
		const instr = this.#pc;
		this.#pc += 1;
		return instr;
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
	* @return {json} AST
	*/
	parse(text){
		this.#refreshSymbols();
		this.#ast = this.#parser.parse(text);
		return this.#ast;
	}

	/**
	* @todo implement
	*/
	//TODO
	interpretSingle(){
		return 1;
	}

	/**
	* @todo implement
	*/
	//TODO
	interpret(){
		return 0;
	}

	/**
	 * Refreshes cached symbols stored in parser
	 * @return {void}
	 * @private
	 */
	#refreshSymbols(){
		this.#parser.Parser.prototype.yy.symbols = { types: [], enums: [] }; //TODO make this a class perhaps
	}
}

/**
 * Interpreter instance
 * @global
 */
const interpreter = new Interpreter();
