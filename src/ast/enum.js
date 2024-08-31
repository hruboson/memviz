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

	/**
	 * Tagname of Enum
	 * @type {Tagname}
	 */
	tagname;

	/**
	 * List of enumerators
	 * @type {Array.<Enumerator>}
	 */
	enumerator_list;

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
 * @param {CExpr} [constantExpression=null] Optional constant expression 
 */
class Enumerator {
	
	/**
	 * Name (identifier) of enumerator
	 * @type {Identifier}
	 */
	identifier;

	/**
	 * Optional constant expression (otherwise calculated)
	 * @type {CExpr}
	 */
	constantExpression


	constructor(identifier, constantExpression = null){
		this.identifier = identifier;
		this.constantExpression = constantExpression;
	}
}

