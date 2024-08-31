/**
 * @file Function-related classes
 * @author Ondřej Hruboš
 */

/**
 * @class Func
 * @param {Declarator} declarator
 * @param {Type} returnType
 * @param {CStmt} body
 */
class Func extends Stmt {

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

	constructor(declarator, returnType, body){
		super();
		this.declarator = declarator;
		this.returnType = returnType;
		this.body = body;
	}

	accept(visitor){
		visitor.visitFunc(this);
	}
}
