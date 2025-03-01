/**
 * @file File containing all types of statements in C
 * @author Ondřej Hruboš
 */

/**
 * Base class for all statements
 * @class Stmt
 */
class Stmt extends Construct {
	
	/**
	 * Corresponding symbol table for statement in AST
	 * @description Pointer to symbol table for lookup
	 * @type {Symtable}
	 */
	symtbptr;

	constructor(){
		super();
	}

	accept(visitor){
		return visitor.visitStmt(this);
	}

	/**
	 * Attaches pointer to corresponding symbol table to this AST node
	 * @param {Symtable} symtable
	 */
	attachSymtable(symtable){
		this.symtbptr = symtable;
	}

	/**
	 * Override to avoid recursion when printing
	 */
    toJSON() {
        const clone = { ...this }; // shallow copy
		delete clone.symtbptr;
		if(this.symtbptr) clone.symtbptr = this.symtbptr.scopeInfo.name + " (" + this.symtbptr.scopeInfo.type + ")";
        return clone;
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
		return visitor.visitCStmt(this);
	}
}

/**
 * Expression statement
 * @class EStmt
 */
class EStmt extends Stmt {
	accept(visitor){
		return visitor.visitEStmt(this);
	}
}

/**
 * Selection statement (if, switch)
 * @class SStmt
 */
class SStmt extends Stmt {
	accept(visitor){
		return visitor.visitSStmt(this);
	}
}

/**
 * Iteration statement (for, while, do-while)
 * @class IStmt
 */
class IStmt extends Stmt {
	accept(visitor){
		return visitor.visitIStmt(this);
	}
}

/**
 * Jump statement (break, continue, return, goto)
 * @class JStmt
 */
class JStmt extends Stmt {
	accept(visitor){
		return visitor.visitJStmt(this);
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
		return visitor.visitReturn(this);
	}
}
