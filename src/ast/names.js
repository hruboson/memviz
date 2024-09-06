/**
 * @file Structures for different kinds of names
 * @author Ondřej Hruboš
 */

/**
 * Used for functiuon names, object names, typedef names, enumeration constants
 * @class Identifier
 * @param {string} name
 * @param {Object} loc
 */
class Identifier extends Construct {

	/**
	 * Name of identifier
	 * @type {string}
	 */
	name;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(name, loc){
		super();
		this.name = name;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitIdentifier(this);
	}
}

/**
 * Used for structs, unions and enums
 * @description Creates record in tag name space
 * @class Tagname
 * @param {string} name
 * @param {Object} loc
 */
class Tagname extends Construct {

	/**
	 * Name of tagname
	 * @type {string}
	 */
	name;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(name, loc){
		super();
		this.name = name;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitTagname(this);
	}
}

/**
 * Unnamed (anonymous) union and structure 
 * @class Unnamed
 * @param {Object} loc
 */
class Unnamed {
	constructor(loc){
		this.unnamed = true; // only for AST representation
		this.loc = loc;
	}
}


