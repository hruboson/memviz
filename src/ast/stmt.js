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

	accept(visitor){
		visitor.visitStmt(this);
	}
}

/**
 * Compound statement (block/block statement). 
 * @description It is a sequence of *statements* and *declarations*. Each CStmt creates new block scope.
 * @class CStmt
 * @param {Array.<Construct>} sequence
 * @param {Object} loc
 */
class CStmt extends Stmt {

	/**
	 * Sequence of statements and expressions
	 * @type {Array.<Construct>}
	 */
	sequence;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(sequence, loc){
		super();
		this.sequence = sequence;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitCStmt(this);
	}
}

/**
 * Expression statement
 * @class EStmt
 */
class EStmt extends Stmt {
	accept(visitor){
		visitor.visitEStmt(this);
	}
}

/**
 * Selection statement (if, switch)
 * @class SStmt
 */
class SStmt extends Stmt {
	accept(visitor){
		visitor.visitSStmt(this);
	}
}

/**
 * Iteration statement (for, while, do-while)
 * @class IStmt
 */
class IStmt extends Stmt {
	accept(visitor){
		visitor.visitIStmt(this);
	}
}

/**
 * Jump statement (break, continue, return, goto)
 * @class JStmt
 */
class JStmt extends Stmt {
	accept(visitor){
		visitor.visitJStmt(this);
	}
}

class Return extends JStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Return expression
	 * @type {Expr|null}
	 */
	expr;

	constructor(expr, loc){
		super();
		this.expr = expr;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitReturn(this);
	}
}
