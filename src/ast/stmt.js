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

	accept(visitor){ return 1; }
}

/**
 * Compound statement (block/block statement)
 * @class CStmt
 */
class CStmt extends Stmt {
	constructor(){
		super();
	}

	accept(visitor){
		return 1;
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
