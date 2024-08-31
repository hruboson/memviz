/**
 * @file Structures for different kinds of names
 * @author Ondřej Hruboš
 */

/**
 * Used for functiuon names, object names, typedef names, enumeration constants
 * @class Identifier
 * @param {string} name
 */
class Identifier extends Construct {

	/**
	 * Name of identifier
	 * @type {string}
	 */
	name;

	constructor(name){
		super();
		this.name = name;
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
 */
class Tagname extends Construct {

	/**
	 * Name of tagname
	 * @type {string}
	 */
	name;

	constructor(name){
		super();
		this.name = name;
	}

	accept(visitor){
		visitor.visitTagname(this);
	}
}

/**
 * Unnamed (anonymous) union and structure 
 * @class Unnamed
 */
class Unnamed {
	constructor(){
		this.unnamed = true; // only for AST representation
	}
}


