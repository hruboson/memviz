/**
 * @file Custom error classes
 * @author Ondřej Hruboš
 */

/**
 * Semantic Error
 * @class SError
 * @param {string} details Error message
 * @param {Object} [loc=null] Line of code where error appeared
 */
class SError extends Error {
	constructor(details, loc=null) {
		if(!loc){
			super(`Semantic analysis error: ${details}`);
		}else{
			const line = loc.first_line;
			super(`Semantic analysis error: ${details} on line ${line}`);
		}
		this.details = details;
		this.loc = loc;
		this.name = "Semantic analysis error";
	}
}

/**
 * Runtime error
 * @class RTError
 * @param {string} e Error message
 * @param {Object} [loc=null] Line of code where error appeared
 */
class RTError extends Error {
	constructor(e, loc=null) {
		super("Runtime error: " + e);
		this.name = "Runtime error";
	}
}
