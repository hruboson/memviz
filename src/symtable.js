class ScopeInfo {
	name;
	type;
	level;

	constructor(name, type, level){
		this.name = name;
		this.type = type;
		this.level = level;
	}
}

class Symbol {
	name;
	type;
	initialized;
	address;

	constructor(name, type){
		this.name = name;
		this.type = type;
		this.initialized = false;
		this.address = 0x00000000;
	}
}

/**
 * Scoped symbol table
 * @class Symtable
 * @param {string} name Name of scope
 * @param {string} type Type of scope
 * @param {Symtable} [parent=null] Parent scoped symbol table
 */
class Symtable {
	/**
	 * Parent symtable
	 * @type {Symtable}
	 */
	parent;
	
	/**
	 * Data about current scope
	 * @type {ScopeInfo}
	 */
	scopeInfo;

	/**
	 * Symbol table
	 * @type {Map<string, Symbol>}
	 */
	symbols = new Map();

	constructor(name, type, parent=null){
		this.scope = parent === null ? new ScopeInfo(name, type, 1) : new ScopeInfo(name, type, parent.scopeInfo.level + 1);
		this.parentSymtable = parent;
	}

	/**
	 * Inserts symbol into symbol table
	 * @param {string} name
	 * @param {Symbol} Symbol
	 */
	insert(name, type){
		this.symbols.set(name, new Symbol(name, type));
	}

	lookup(name){

	}

	/**
	 * @todo implement pretty printing for debugging purposes
	 */
	print(){
		while(this.parent != null){
			
		}
	}
}


