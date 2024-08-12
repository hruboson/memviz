/**
 * @file Base file for abstract syntax tree
 * @author Ondřej Hruboš
 */

/**
 * @class AST
 * @description Construct categorization was mostly inspired by [cppreference]{@link https://en.cppreference.com/w/c/language}
 */
class AST {
	/**
	 * Tree array
	 * @type {Construct[]}
	 */
	constructs; // declarations + statements	
}

/**
 * @class Construct
 * @abstract
 * @implements accept
 */
class Construct {
	constructor(){
		abstract(this, Construct);
		intfc(this, "accept", ["visitor"]);
	}
}
