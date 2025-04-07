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
	constructor(loc){
		super();
		this.loc = loc;
	}
}

class NOP extends Construct {
	constructor(loc){
		super();
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitNOP(this);
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
		super(loc);
		this.op = op;
		this.expr = expr;
	}

	accept(visitor){
		return visitor.visitUExpr(this);
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
		super(loc);
		this.left = left;
		this.op = op;
		this.right = right;
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
		return visitor.visitBAssignExpr(this);
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
		return visitor.visitBArithExpr(this);
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
		return visitor.visitBLogicExpr(this);
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
		return visitor.visitBCompExpr(this);
	}
}

/**
 * Member access expressions
 */

/**
 * Subscript expression
 * @description a[b]
 * @param {Expr} pointer
 * @param {Expr} integer
 */
class SubscriptExpr extends Expr {
	constructor(pointer, expr, loc){
		super(loc);
		this.pointer = pointer;
		this.expr = expr;
	}

	accept(visitor){
		return visitor.visitSubscriptExpr(this);
	}
}

/**
 * Member access (structure/union)
 * @description a.b
 * @param {Expr} expr Can be either structure or union
 * @param {Identifier} member
 */
class MemberAccessExpr extends Expr {
	constructor(expr, member, loc){
		super(loc);
		this.expr = expr;
		this.member = member;
	}

	accept(visitor){
		return visitor.visitMemberAccessExpr(this);
	}
}

/**
 * Pointer member access (pointer to structure/union)
 * @description a->b
 * @param {Expr} pointer
 * @param {Identifier} member
 */
class PtrMemberAccessExpr extends Expr {
	constructor(pointer, member, loc){
		super(loc);
		this.pointer = pointer;
		this.member = member;
	}

	accept(visitor){
		return visitor.visitPtrMemberAccessExpr(this);
	}
}

/**
 * Constant - integer, float, double, char
 * Literal - string, compound
 */
class CExpr extends Expr {
	constructor(type, value, loc){
		super(loc);
		this.type = type;
		this.value = value;
	}

	accept(visitor){
		return visitor.visitCExpr(this);
	}
}

/**
 * More specialized expressions:
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
class FncCallExpr extends Expr {
	constructor(expr, argumentList, loc){
		super(loc);
		this.expr = expr;
		this.arguments = argumentList;
	}

	accept(visitor){
		return visitor.visitFncCallExpr(this);
	}
}

class CastExpr extends Expr {
	constructor(type, expr, loc){
		super(loc);
		this.type = type;
		this.expr = expr;
	}

	accept(visitor){
		return visitor.visitCastExpr(this);
	}
}

class CondExpr extends Expr {
	constructor(){
		super();
	}

	//TODO
}

class SizeOfExpr extends Expr {
	constructor(expr, type, loc){
		super(loc);
		this.expr = expr;
		this.type = type;
	}

	accept(visitor){
		return visitor.visitSizeOfExpr(this);
	}
}
