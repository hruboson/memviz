class Expr extends Construct {

}

class Identifier extends Construct {
	constructor(name){
		super();
		this.name = name;
	}

	accept(visitor){

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
