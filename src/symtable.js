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
	scope; // typeof Scope
	initialized;
	address;

	constructor(name, type){
		this.name = name;
		this.type = type;
		this.scope = scope;
	}
}

/**
 * Scoped symbol table
 * @class Symtable
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
	symbols;

	constructor(name, type, parent=null){
		this.scope = parent === null ? new ScopeInfo(name, type, 1) : new ScopeInfo(name, type, parent.scopeInfo.level + 1);
		this.parentSymtable = parent;
	}
	
	insert(symbol){

	}

	lookup(name){

	}
}


