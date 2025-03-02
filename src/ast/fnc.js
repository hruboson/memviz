/**
 * @file Function-related classes
 * @author Ondřej Hruboš
 */

/**
 * @class Fnc
 * @param {Declarator} declarator
 * @param {Type} returnType
 * @param {CStmt} body
 * @param {Object} loc
 */
class Fnc extends Stmt {

	/**
	 * Declarator of function
	 * @type {Declarator}
	 */
	declarator;

	/**
	 * Return type (specifiers) of function
	 * @type {Type}
	 */
	returnType;

	/**
	 * Body of function (compound statement)
	 * @type {CStmt}
	 */
	body;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(declarator, returnType, body, loc){
		super();
		this.declarator = declarator;
		this.returnType = returnType;
		this.body = body;
		this.loc = loc;
	}

	accept(visitor, args){
		return visitor.visitFnc(this, args);
	}
}
