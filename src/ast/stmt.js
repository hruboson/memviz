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
 * Label statement
 * @class LStmt
 */
class LStmt extends Stmt {

	/**
	 * Name of the label statement
	 * @type {string}
	 */
	name;

	/**
	 * Statement belonging to the label
	 * @type {CStmt}
	 */
	stmt;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;
	
	constructor(name, stmt, loc){
		super();
		this.name = name;
		this.stmt = stmt;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitLStmt(this);
	}
}

class CaseStmt extends LStmt {
	/**
	 * Constant expression
	 * In case of null the case is the 'default' case
	 * @type {CExpr|null}
	 */
	expr;

	/**
	 * Statement belonging to the case
	 * @type {CStmt}
	 */
	stmt;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(expr, stmt, loc){
		super();
		this.expr = expr;
		this.stmt = stmt;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitCaseStmt(this);
	}
}

/**
 * Selection statement (if, switch)
 * @class SStmt
 */
class SStmt extends Stmt {
	constructor(){
		super();
	}
}

class IfStmt extends SStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Expression to compare
	 * @type {Expr}
	 */
	expr;

	/**
	 * Body of true branch
	 * @type {CStmt}
	 */
	strue;

	/**
	 * Body of false branch
	 * @type {CStmt}
	 */
	sfalse;

	constructor(expr, strue, sfalse, loc){
		super();

		this.expr = expr;
		this.strue = strue;
		this.sfalse = sfalse;

		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitIfStmt(this);
	}
}

class SwitchStmt extends SStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Expression to compare
	 * @type {Expr}
	 */
	expr;

	/**
	 * Statement in which case and default are permitted and break has special meaning
	 * @type {CStmt}
	 */
	body;

	constructor(expr, body, loc){
		super();

		this.expr = expr;
		this.body = body;

		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitSwitchStmt(this);
	}
}

/**
 * Iteration statement (for, while, do-while)
 * @class IStmt
 */
class IStmt extends Stmt {
	constructor(){
		super();
	}
}

class ForLoop extends IStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Init-expression
	 * @type {Expr|Declaration}
	 */
	init;

	/**
	 * Condition expression
	 * @type {BCompExpr}
	 */
	cond;

	/**
	 * Iteration expression
	 * @type {Expr}
	 */
	itexpr;

	/**
	 * Body
	 * @type {CStmt}
	 */
	body;

	constructor(init, cond, itexpr, body, loc){
		super();
		this.init = init;
		this.cond = cond;
		this.itexpr = itexpr; // iteration expression
		this.body = body;

		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitForLoop(this);
	}
}

class WhileLoop extends IStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Condition expression
	 * @type {BCompExpr}
	 */
	cond;

	/**
	 * Body
	 * @type {CStmt}
	 */
	body;

	constructor(cond, body, loc){
		super();
		this.cond = cond;
		this.body = body;

		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitWhileLoop(this);
	}
}

class DoWhileLoop extends IStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Condition expression
	 * @type {BCompExpr|Expr}
	 */
	cond;

	/**
	 * Body
	 * @type {CStmt}
	 */
	body;

	constructor(cond, body, loc){
		super();
		this.cond = cond;
		this.body = body;

		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitDoWhileLoop(this);
	}
}

/**
 * Jump statement (break, continue, return, goto)
 * @class JStmt
 */
class JStmt extends Stmt {

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

class Break extends JStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(loc){
		super();
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitBreak(this);
	}
}

class Continue extends JStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(loc){
		super();
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitContinue(this);
	}
}

class Goto extends JStmt {
	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	/**
	 * Label to jump to
	 * @type {Identifier}
	 */
	label;

	constructor(label, loc){
		super();
		this.label = label;

		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitGoto(this);
	}
}
