/**
 * @file Declaration and initialization-related classes
 */

/**
 * @class Declaration
 * @param {Identifier} identifier
 * @param {Initializer} initializer
 */
class Declaration extends Construct {
	constructor(identifier, initializer){ // TODO: ...
		super();
		this.identifier = identifier;
		if(initializer != null){
			this.initializer = initializer;
		}
	}
}

/**
 * Declarator structure
 * @class Declarator
 */
class Declarator {

}

/**
 * @class Initializer
 */
class Initializer {

}
