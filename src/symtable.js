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

/**
 * @typedef SYMTYPE
 */
const SYMTYPE = {
	VAR: "VAR",
	PARAM: "PARAM",
	FNC: "FNC",
	STRUCT: "STRUCT",
}

class Sym {
	name;
	type;
	specifiers;
	pointer;
	initialized;
	address;

	constructor(name, type, specifiers, pointer){
		this.name = name;
		this.type = type;
		this.specifiers = specifiers;
		this.pointer = pointer;
		this.initialized = false;
		this.address = Math.floor(Math.random() * 4294967296); // for now random
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
	symbols;

	/**
	 * Children symbol tables (for traversal and visualization)
	 * @description Empty array symbolizes no children
	 * @type {Array.<Symtable>}
	 */
	children;

	constructor(name, type, parent=null){
		this.symbols = new Map();
		this.scopeInfo = (parent == null) ? new ScopeInfo(name, type, 0) : new ScopeInfo(name, type, parent.scopeInfo.level + 1);
		this.parentSymtable = parent;
		this.children = [];

		// add this to parent's children
		if(parent){
			parent.children.push(this);
		}
	}

	/**
	 * Inserts symbol into symbol table
	 * @param {string} name
	 * @param {Symbol} Symbol
	 */
	insert(name, type, specifiers, pointer){
		this.symbols.set(name, new Sym(name, type, specifiers, pointer));
	}

	lookup(name){
		return this.symbols.get(name);
	}

	/**
	 * Prints the symtable and its children
	 * @param {integer} [level=0] Indentation level
	 * @return {string}
	 */
	print(level=0){
		const indent = `\t`.repeat(level);
		const header = `${indent}${this.scopeInfo.name}(${this.scopeInfo.type}), level ${this.scopeInfo.level}\n`;
		const divider = `${indent}` + (`¯`.repeat(header.length-1)) + `\n`;

		var symbols_string = ``;
		this.symbols.forEach(function(symbol, name){
			symbols_string += `${indent}(${symbol.type}) ${name}: 0x${(+symbol.address).toString(16)}, ${symbol.specifiers}, ${symbol.pointer}; \n`;
		});

		var prt = header + divider + symbols_string + divider;
		for(const child of this.children){
			prt += child.print(level+1);	
		}

		return prt;
	}
}


