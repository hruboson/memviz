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
		if(!loc){
			super(`Runtime error: ${e}`);
		}else{
			const line = loc.first_line;
			super(`Runtime error: ${e} on line ${line}`);
		}
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
		if(!loc){
			super(`Application Error: ${e}`);
		}else{
			const line = loc.first_line;
			super(`Application Error: ${e} on line ${loc.first_line}`);
		}
		console.error(`${e}`);
		this.name = "Application error";
	}
}
