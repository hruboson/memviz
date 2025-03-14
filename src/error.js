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
		super(e);
		this.name = "Runtime error";
	}
}

/**
 * App (Internal error - error made by my (author's) mistake
 * @class AppError
 * @param {string} e Error message
 */
class AppError extends Error {
	constructor(e, loc=null){
		let msg;
		if(!loc){
			msg = `Application Error: \n\n${e}`;
		}else{
			msg = `Application Error: \n\n${e} on line ${loc.first_line}`;
		}
		console.error(msg);
		super(msg);
	}
}
