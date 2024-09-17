/**
 * @file Warning system
 * @author Ondřej Hruboš
 */

/**
 * Allowed types of warning
 * @typedef WTYPE
 * @const
 * @global
 */
const WTYPE = {
	RETURNTYPE: "RETURNTYPE",
}


/**
 * @class Warning
 * @param {string} msg
 * @param {Object} loc
 * @param {WTYPE} type
 */
class Warning {

	/**
	 * Message of warning
	 * @type {string}
	 */
	#msg;
	get msg(){
		return this.#msg;
	}

	/**
	 * Type of warning
	 * @type {WTYPE}
	 */
	#type;
	get type(){
		return this.#type;
	}

	/**
	 * Line of code information
	 * @type {Object}
	 */
	#loc;
	get loc(){
		return this.#loc;
	}

	constructor(msg, type, loc){
		this.#msg = msg;
		this.#type = type;
		this.#loc = loc;
	}
}

/**
 * @class WarningSystem
 */
class WarningSystem {
	/**
	 * List of warnings
	 * @type {Array.<Warning>}
	 */
	#list = [];

	/**
	 * Adds new warning to array
	 * @param {string} msg
	 * @param {WTYPE} type
	 * @param {Object} loc
	 */
	new(msg, type, loc){
		this.#list.push(new Warning(msg, type, loc));
	}

	/**
	 * Alias for new()
	 * @param {string} msg
	 * @param {WTYPE} type
	 * @param {Object} loc
	 */
	add(msg, type, loc){
		this.new(msg, type, loc);
	}

	/**
	 * Prints warnings
	 * @return {string}
	 */
	print(){
		if(this.#list.length < 1){
			return ``;
		}

		const header = `Compiler warnings: \n`;
		var prt = header; 
		for(const warning of this.#list){
			prt += `warning: ${warning.msg} [${warning.type}] on line ${warning.loc.first_line}`;
		}

		return prt;
	}
}

