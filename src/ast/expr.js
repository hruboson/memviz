/**
 * @file Expression-related classes
 * @author Ondřej Hruboš
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

class CExpr extends Expr {
	constructor(expr, loc){
		super(expr, loc); // fix later, this is only placehodler so I can see something in the AST
	}

	accept(visitor){
		visitor.visitCExpr(this);
	}
}

class Literal extends Construct {
	constructor(type, value, loc){
		super();
		this.type = type;
		this.value = value;
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitLiteral(this);
	}
}
