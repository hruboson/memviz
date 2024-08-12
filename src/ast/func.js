/**
 * @file Function-related classes
 * @author Ondřej Hruboš
 */

/**
 * @class Func
 * @param {Declarator} declarator
 * @param {Type} return_type
 * @param {CStmt} body
 */
class Func extends Stmt {
	constructor(declarator, return_type, body){
		super();
		this.declarator = declarator;
		this.return_type = return_type;
		this.body = body;
	}
}
