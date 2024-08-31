/**
 * @file enumeration-related classes
 * @author Ondřej Hruboš
 */

/**
 * Assigns numerical values to each enumerator. Starts from 0 or assigns expression.
 * @class Enum
 * @param {Tagname} tagname
 * @param {Array.<Enumerator>} enumerator_list
 * @param {Object} loc
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

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(tagname, enumerator_list, loc){
		super();
		this.tagname = tagname;
		this.enumerator_list = enumerator_list;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitEnum(this);
	}
}

/**
 * @class Enumerator
 * @param {Identifier} Enumerator identifier, resides in ordinary identifiers (not tag or member names)
 * @param {CExpr} [constantExpression=null] Optional constant expression 
 * @param {Object} loc
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

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(identifier, constantExpression = null, loc){
		this.identifier = identifier;
		this.constantExpression = constantExpression;
		this.loc = loc;
	}
}

