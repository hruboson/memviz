class Expr extends Construct {

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
