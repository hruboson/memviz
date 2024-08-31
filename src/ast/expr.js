/**
 * @file Expression-related classes
 * @author Ondřej Hruboš
 */

class Expr extends Construct {
	constructor(expr){
		super();
		this.expr = expr;
	}

	accept(visitor){
		visitor.visitExpr(this);
	}
}

class CExpr extends Expr {
	constructor(expr){
		super(expr); // fix later, this is only placehodler so I can see something in the AST
	}

	accept(visitor){
		visitor.visitCExpr(this);
	}
}

class Literal extends Construct {
	constructor(type, value){
		super();
		this.type = type;
		this.value = value;
	}

	accept(visitor){
		visitor.visitLiteral(this);
	}
}
