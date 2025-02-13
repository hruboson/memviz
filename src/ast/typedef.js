/**
 * @file Typedef class
 * @author Ondřej Hruboš
 */

/**
 * @class Typedef
 * @param {Type} type Type specifiers
 * @param {Declarator} declarator Declarator of typedef
 * @param {Object} loc
 */

class Typedef extends Construct {
	
	/**
	 * Specifiers of type
	 * @type {Type}
	 */
	type;

	/**
	 * Declarator of typedef (holds alias and modifiers)
	 * @type {Declarator}
	 */
	declarator;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(type, declarator, loc){
		super();
		this.type = type;
		this.declarator = declarator;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitTypedef(this);
	}
}

