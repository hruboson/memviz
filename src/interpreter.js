class Interpreter {

	/* ATTRIBUTES */
	#parser = ansi_c;
	#ast;

	#current_instruction = 0;
	
	/* GETTERS */
	get ast(){
		return this.#ast;
	}

	get current_instruction(){
		const instr = this.#current_instruction;
		this.#current_instruction += 1;
		return instr;
	}

	get types(){
		return this.#parser.Parser.prototype.yy.last_types;
	}

	/* FUNCTIONS */
	parse(text){
		this.#ast = this.#parser.parse(text);
	}

	interpret_single(){
		return 1;
	}

	interpret(){
		return 0;
	}
}

const interpreter = new Interpreter();
