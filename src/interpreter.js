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
	#parser = ansi_c;

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
	 * @return {array} User-defined types
	 */
	get user_types(){
		return this.#parser.Parser.prototype.yy.last_types;
	}

	/* FUNCTIONS */
	/**
	* Parses user input
	* @param {string} text User input
	* @return {json} AST
	*/
	parse(text){
		this.#ast = this.#parser.parse(text);
		return this.#ast;
	}

	/**
	* @todo implement
	*/
	interpret_single(){
		return 1;
	}

	/**
	* @todo implement
	*/
	interpret(){
		return 0;
	}
}

/**
 * Interpreter instance
 * @global
 */
const interpreter = new Interpreter();
