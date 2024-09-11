/**
 * @file Expression-related classes
 * @author Ondřej Hruboš
 */

/**
 * Operator container
 * @class Operator
 * @param {string} op Operator as string
 */
class Operator {
	constructor(op){
		this.op = op;
	}
}

/**
 * Base expression class
 * @description Can be used as expression container. Classification of operators is roughly cppreference classification, but classified also by arity: https://en.cppreference.com/w/c/language/expressions
 * @class Expr
 * @param {Expr} expr
 * @param {Object} loc
 */
class Expr extends Construct {
	constructor(expr, loc){
		super();
		this.expr = expr;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitExpr(this);
	}
}

/**
 * Unary expression 
 * @description +a, -a, ++a, --a, a++, a--, ~a, !a
 * @class UExpr
 * @param {Expr} expr
 * @param {Operator} op
 * @param {Object} loc
 */
class UExpr extends Expr {
	constructor(expr, op, loc){
		super();
		this.op = op;
		this.expr = expr;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitUExpr(this);
	}
}

/**
 * Binary expression
 * @class BExpr
 * @param {Expr} left
 * @param {Operator} operator
 * @param {Expr} right
 * @param {Object} loc
 */
class BExpr extends Expr {
	constructor(left, op, right, loc){
		super();
		this.left = left;
		this.op = op;
		this.right = right;
		this.loc = loc;
	}
}

/**
 * Binary assignment expression
 * @description a = b, a += b, a -= b, a *= b, a /= b, a %= b, a &= b, a |= b, a ^= b, a <<= b, a >>= b
 * @class BAssignExpr
 * @param {Expr} left
 * @param {Operator} operator
 * @param {Expr} right
 * @param {Object} loc
 */
class BAssignExpr extends BExpr {
	constructor(left, op, right, loc){
		super(left, op, right, loc);
	}

	accept(visitor){
		visitor.visitBAssignExpr(this);
	}
}

/**
 * Binary arithmetic expression
 * @description a + b, a - b, a * b, a / b, a % b, a & b, a | b, a ^ b, a << b, a >> b
 * @class BArithExpr
 * @param {Expr} left
 * @param {Operator} operator
 * @param {Expr} right
 * @param {Object} loc
 */
class BArithExpr extends BExpr {
	constructor(left, op, right, loc){
		super(left, op, right, loc);
	}

	accept(visitor){
		visitor.visitBArithExpr(this);
	}
}

/**
 * Binary logical expression
 * @description a && b, a || b
 * @class BLocigExpr
 * @param {Expr} left
 * @param {Operator} operator
 * @param {Expr} right
 * @param {Object} loc
 */
class BLogicExpr extends BExpr {
	constructor(left, op, right, loc){
		super(left, op, right, loc);
	}

	accept(visitor){
		visitor.visitBLogicExpr(this);
	}
}

/**
 * Binary comparison expression
 * @description a == b, a != b, a < b, a > b, a <= b, a >= b
 * @class BCompExpr
 * @param {Expr} left
 * @param {Operator} operator
 * @param {Expr} right
 * @param {Object} loc
 */
class BCompExpr extends BExpr {
	constructor(left, op, right, loc){
		super(left, op, right, loc);
	}

	accept(visitor){
		visitor.visitBCompExpr(this);
	}
}


/**
 * Constant - integer, float, double, char
 * Literal - string, compound
 */
class CExpr extends Expr {
	constructor(type, value, loc){
		super();
		this.type = type;
		this.value = value;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitCExpr(this);
	}
}

/**
 * More specialized expressions
  * function call
  * comma operator
  * type cast
  * conditional operator (tertiary)
  * sizeof
  * typeof
 */

/**
 * Function call expression
 * @class FuncCall
 */
class FuncCallExpr extends Expr {
	constructor(expr, argumentList, loc){
		super();
		this.expr = expr;
		this.argumentList = argumentList;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitFuncCallExpr(this);
	}
}

class CastExpr extends Expr {
	constructor(type, epxr){
		super();
		this.type = type;
		this.expr = expr;
	}

	accept(visitor){
		visitor.visitCastExpr(this);
	}
}

class CondExpr extends Expr {
	constructor(){
		super();
	}
}
