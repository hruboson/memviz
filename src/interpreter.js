class Interpreter {
	/* ATTRIBUTES */
	#parser = ansi_c;
	#ast;

	#pc = 0; // program counter
	
	/* GETTERS */
	get ast(){
		return this.#ast;
	}

	get pc(){
		const instr = this.#pc;
		this.#pc += 1;
		return instr;
	}

	get user_types(){
		return this.#parser.Parser.prototype.yy.last_types;
	}

	/* FUNCTIONS */
	parse(text){
		this.#ast = this.#parser.parse(text);
		return this.#ast;
	}

	interpret_single(){
		return 1;
	}

	interpret(){
		return 0;
	}
}

const interpreter = new Interpreter();
