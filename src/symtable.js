class Symtable {
	#table;

	constructor(){
		this.#table = new Map();
	}

	insert(name, type){
		this.#table.set(name, { value: null, type: type, scope: null});
	}

	lookup(name){
		return this.#table.has(name);
	}

	set_value(name, value){
		this.#table.set(name, { value: value });
	}

	get_value(name){
		return this.#table.get(name);
	}

	get_type(name){
		return this.#table.get(name).type;
	}

	size(){
		return this.#table.size;
	}
}

module.exports = Symtable;
