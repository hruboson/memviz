/**
 * @file Custom error classes
 * @author Ondřej Hruboš
 */

/**
 * Parser/syntax Error
 * @class PError
 * @param {string} message Error message
 */
class PError extends Error {
	constructor(message) {
		super(message);
		this.name = "Syntax error";
	}
}

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

/**
 * Not supported feature error - for things I don't support yet (or never will)
 * @class NSError
 * @param {string} what Which feature is not supported
 * @param {Object} loc
 */
class NSError extends Error {
	constructor(what, loc=null){
		if(!loc){
			super(`Sorry, we currently do not support ${what}`);
		}else{
			const line = loc.first_line;
			super(`Sorry, we currently do not support ${what} (on line ${loc.first_line})`);
		}
		console.error(`NS:${what}`);
		this.name = "Not supported error";
	}
}
