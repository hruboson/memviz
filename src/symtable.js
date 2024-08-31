/**
 * @file Symbol table
 * @author Ondřej Hruboš
 */

/**
 * @class ScopeInfo
 * @description Holds information about scope
 * @param {string} name Usually name of function or anything that's unique
 * @param {string} type Type of scope (e.g. function parameters, CStmt, global, ...)
 * @param {integer} level Level of scope (should be calculated automatically)
 */
class ScopeInfo {

	/**
	 * Name of scope (should be unique in case of functions)
	 * @type {string}
	 */
	name;

	/**
	 * Type of scope (e.g. function parameters, CStmt, global, ...)
	 * @type {string}
	 */
	type;

	/**
	 * Level of scope
	 * @type {integer}
	 */
	level;

	constructor(name, type, level){
		this.name = name;
		this.type = type;
		this.level = level;
	}
}

/**
 * Enum for possible types of symbols
 * @typedef SYMTYPE
 */
const SYMTYPE = {
	VAR: "VAR",
	PARAM: "PARAM",
	FNC: "FNC",
	STRUCT: "STRUCT",
}

/**
 * @class Sym
 * @description Structure for holding information about a single symbol
 * @param {string} name Name (identifier) of the symbol
 * @param {SYMTYPE} type Type of the symbol
 * @param {Array.<string>} specifiers Specifiers of symbol
 * @param {bool} pointer Is symbol a pointer?
 */
class Sym {

	/**
	 * Name (identifier) of the symbol
	 * @type {string}
	 * */
	name;

	/**
	 * Type of the symbol
	 * @type {SYMTYPE}
	 */
	type;

	/**
	 * Specifiers of symbol
	 * @type {Array.<string>}
	 */
	specifiers;

	/**
	 * Symbolizes whether symbol is a pointer
	 * @type {bool}
	 */
	pointer;

	/**
	 * Symbolizes whether symbol is initialized. If it is, then address must be set.
	 * @type {bool}
	 */
	initialized;

	/**
	 * Hexadecimal number specifying where in memory the symbol is stored
	 * @type {integer}
	 */
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

		// add this instance to parent's children
		if(parent){
			parent.children.push(this);
		}
	}

	/**
	 * Inserts symbol into symbol table
	 * @param {string} name Symbol name (identifier)
	 * @param {type} type
	 * @param {Array.<string>} specifiers
	 * @param {bool} pointer
	 */
	insert(name, type, specifiers, pointer){
		this.symbols.set(name, new Sym(name, type, specifiers, pointer));
	}

	/**
	 * Looks up symbol in symbol table
	 * @param {string} name Symbol name (identifier)
	 * @return {Symbol|undefined} Returns Symbol in case of success, undefined if the symbol was not found
	 */
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


