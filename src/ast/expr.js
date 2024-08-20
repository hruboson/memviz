class Expr extends Construct {
	constructor(expr){
		super();
		this.expr = expr;
	}

	accept(visitor){

	}
}

class CExpr extends Expr {
	constructor(expr){
		super(expr); // fix later, this is only placehodler so I can see something in the AST
	}
}

class Literal extends Construct {
	constructor(type, value){
		super();
		this.type = type;
		this.value = value;
	}

	accept(visitor){

	}
}
