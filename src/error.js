/**
 * @file Custom error classes
 * @author Ondřej Hruboš
 */

/**
 * Semantic Error
 * @class SError
 */
class SError extends Error {
	constructor(e) {
		super("Semantic analysis error: " + e);
		this.name = "Semantic analysis error";
	}
}

/**
 * Runtime error
 * @class RTError
 */
class RTError extends Error {
	constructor(e) {
		super("Runtime error: " + e);
		this.name = "Runtime error";
	}
}
