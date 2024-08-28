/**
 * @file enumeration-related classes
 * @author Ondřej Hruboš
 */

/**
 * Assigns numerical values to each enumerator. Starts from 0 or assigns expression.
 * @class Enum
 * @param {Tagname} tagname
 * @param {Array.<Enumerator>} enumerator_list
 */
class Enum extends Construct {
	constructor(tagname, enumerator_list){
		super();
		this.tagname = tagname;
		this.enumerator_list = enumerator_list;
	}

	accept(visitor){
		visitor.visitEnum(this);
	}
}

/**
 * @class Enumerator
 * @param {Identifier} Enumerator identifier, resides in ordinary identifiers (not tag or member names)
 * @param {CExpr} [constant_expression=null] Optional constant expression 
 */
class Enumerator {
	constructor(identifier, constant_expression = null){
		this.identifier = identifier;
		this.constant_expression = constant_expression;
	}
}

