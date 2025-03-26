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

	OVERFLOW: "OVERFLOW",
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
 * @description Handles all warnings. Any part of the interpreter can add warning.
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

		const header = `<h5><u>Warnings: </u></h5>`;
		var prt = header; 
		for(const warning of this.#list){
			if(warning.loc){
				prt += `${warning.msg} [${warning.type}] <kbd class="fw-bolder">on line ${warning.loc?.first_line}</kbd><br>`;
			}else{
				prt += `${warning.msg} [${warning.type}]<br>`;
			}
		}

		return prt;
	}
}

