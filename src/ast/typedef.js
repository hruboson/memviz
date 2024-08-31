/**
 * @file Typedef class
 * @author Ondřej Hruboš
 */

/**
 * @class Typedef
 * @param {Type} type Type specifiers
 * @param {Declarator} declarator Declarator of typedef
 */

class Typedef {
	
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

	constructor(type, declarator){
		this.type = type;
		this.declarator = declarator;
	}
}

