/**
 * @file File containing all types of statements in C
 * @author Ondřej Hruboš
 */

/**
 * Base class for all statements
 * @class Stmt
 */
class Stmt extends Construct {
	constructor(){
		super();
	}

	accept(visitor){ return; }
}

/**
 * Compound statement (block/block statement). 
 * @description It is a sequence of *statements* and *declarations*. Each CStmt creates new block scope.
 * @class CStmt
 */
class CStmt extends Stmt {
	constructor(sequence){
		super();
		this.sequence = sequence;
	}

	accept(visitor){
		visitor.visitCompoundStatement(this);
	}
}

/**
 * Expression statement
 * @class EStmt
 */
class EStmt extends Stmt {

}

/**
 * Selection statement (if, switch)
 * @class SStmt
 */
class SStmt extends Stmt {

}

/**
 * Iteration statement (for, while, do-while)
 */
class IStmt extends Stmt {

}

/**
 * Jump statement (break, continue, return, goto)
 * @class JStmt
 */
class JStmt extends Stmt {

}
