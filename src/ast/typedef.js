/**
 * @file Typedef class
 */

/**
 * @class Typedef
 * @param {Type} type Type specifiers
 * @param {Declarator} declarator Alias
 */

class Typedef {
	constructor(type, declarator){
		this.type = type;
		this.declarator = declarator;
	}
}

