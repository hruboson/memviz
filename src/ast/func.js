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
