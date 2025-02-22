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
 * @see {@link http://port70.net/~nsz/c/c99/n1256.html#6.2.1} 
 * @global
 * @typedef SYMTYPE
 */
const SYMTYPE = {
	OBJ: "OBJ",
	FNC: "FNC",
	TAG: "TAG",
	MEMBER: "MEMBER",
	TYPEDEF: "TYPEDEF",
	LABEL: "LABEL",
}

/**
 * @class Sym
 * @description Structure for holding information about a single symbol
 * @param {string} name Name (identifier) of the symbol
 * @param {SYMTYPE} type Type of the symbol
 * @param {bool} initialized
 * @param {Array.<string>} specifiers Specifiers of symbol
 * @param {bool} pointer Is symbol a pointer?
 * @param {integer} dimension Dimension of array, 0 for non-array
 * @param {Array.<Declarator>} parameters
 * @param {bool} isFunction Declares symbol as type of function
 * @param {Construct} astPtr Pointer to AST
 * @param {bool} isNative Specifies if function is native or user defined
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

	/**
	 * In case of function, stores parameters
	 * @type {Array.<Declarator>}
	 */
	parameters;

	/**
	 * Object can be type of function (e.g. pointer to function)
	 * @type {bool}
	 */
	isFunction;

	/**
	 * "Pointer" to the code to be interpreted (in AST)
	 * @type {Construct}
	 */
	astPtr;

	/**
	 * Mark function as built-in (native). For printf, malloc, free, ...
	 * @type {boolean}
	 */
	isNative;

	constructor(name, type, initialized, specifiers, pointer, dimension=0, parameters=null, isFunction=false, astPtr=null, isNative=false){
		this.name = name;
		this.type = type;
		this.specifiers = specifiers;
		this.pointer = pointer;
		this.dimension = dimension;
		this.initialized = initialized;
		this.parameters = parameters;
		this.isFunction = isFunction;
		this.isNative = isNative;
		this.astPtr = astPtr; // is this 100% pointer??? otherwise it's super inefficient (I'm not sure how JS pointers work)
	}

	initialize(){
		this.initialized = true;
	}
}

/**
 * Types of name spaces
 * @see {@link http://port70.net/~nsz/c/c99/n1256.html#6.2.3}
 * @global
 * @typedef NAMESPACE
 */
const NAMESPACE = {
	ORDS: "ORDS", // ordinary identifiers
	TAGS: "TAGS",
	MEMBERS: "MEMBERS",
	LABELS: "LABELS",
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
	 * Objects name space - everything that isn't structure, union, enum, member of structure, union or enum, or label
	 * @see {@link http://port70.net/~nsz/c/c99/n1256.html#6.2.3}
	 * @type {Map<string, Sym>}
	 */
	objects;

	/**
	 * Tags namespace - structure, union, enum
	 * @see {@link http://port70.net/~nsz/c/c99/n1256.html#6.2.3}
	 * @type {Map<string, Sym>}
	 */
	tags;

	/**
	 * Name spaces of each defined tag
	 * @type {Array.<Map<string, Map<string, Sym>>>}
	 */
	memberSpaces;

	/**
	 * Labels namespace
	 * @see {@link http://port70.net/~nsz/c/c99/n1256.html#6.2.3}
	 * @type {Map<string, Sym>}
	 */
	labels;

	/**
	 * Children symbol tables (for traversal and visualization)
	 * @description Empty array symbolizes no children
	 * @type {Array.<Symtable>}
	 */
	children;

	constructor(name, type, parent=null){
		this.objects = new Map();
		this.tags = new Map();
		this.labels = new Map();
		this.memberSpaces = [];

		this.scopeInfo = (parent == null) ? new ScopeInfo(name, type, 0) : new ScopeInfo(name, type, parent.scopeInfo.level + 1);
		this.parent = parent;
		this.children = [];

		// add this instance to parent's children
		if(parent){
			parent.children.push(this);
		}
	}

	/**
	 * Inserts symbol into symbol table
	 * @param {NAMESPACE} namespace Name space to add the identifier to
	 * @param {SYMTYPE} type
	 * @param {string} name Symbol name (identifier)
	 * @param {Array.<string>} specifiers
	 * @param {bool} pointer
	 * @param {integer} dimension
	 * @param {Array.<Declarator>} parameters
	 */
	insert(namespace, type, initialized, name, specifiers, pointer, dimension=0, parameters=null, isFunction=false, astPtr=null, isNative=false){
		switch(namespace){
			case NAMESPACE.ORDS:
				const sym = this.lookup(namespace, name);
				if(sym){
					if(sym.initialized){
						throw new SError(`redefinition of ${name}`);
					}else{
						// allow function declaration - definition
						if(type == SYMTYPE.FNC){
							sym.initialize();
							sym.astPtr = astPtr;
							sym.type = SYMTYPE.FNC;
							sym.isNative = isNative;
							return;
						}

						throw new SError(`redefinition of ${name}`);
					}
				}

				this.objects.set(name, new Sym(name, type, initialized, specifiers, pointer, dimension, parameters, isFunction, astPtr, isNative));
				break;
			case NAMESPACE.TAGS:
				break;
			case NAMESPACE.MEMBERS:
				break;
			case NAMESPACE.LABELS:
				break;
			default:
				throw new AppError("Wrong namespace type while inserting symbol!");
		}
	}

	/**
	 * Looks up symbol in symbol table (local)
	 * @param {NAMESPACE} namespace Type of namespace to look for given name (identifier)
	 * @param {string} name Symbol name (identifier)
	 * @return {Sym|undefined} Returns Symbol in case of success, undefined if the symbol was not found
	 */
	lookup(namespace, name){
		switch(namespace){
			case NAMESPACE.ORDS:
				return this.objects.get(name);
			case NAMESPACE.TAGS:
				return this.tags.get(name);
			case NAMESPACE.MEMBERS:
				break;
				//TODO return this.membersSpaces.get(name);
			case NAMESPACE.LABELS:
				return this.labels.get(name);
			default:
				throw new AppError("Wrong namespace type while looking up symbol!");
		}
	}

	/**
	 * Traverses this and all parent symbol tables and either finds a symbol and returns it, or throws SError
	 * @param {string} name Symbol name (identifier)
	 * @return {Sym} Returns Symbol in case of succes
	 * @throws {SError}
	 */
	resolve(name){
		if(this.objects.get(name)){
			return this.objects.get(name);

		}else if(this.tags.get(name)){
			return this.tags.get(name);

		}else if(this.labels.get(name)){
			return this.labels.get(name);

		}else{
			if(this.parent){
				return this.parent.resolve(name);
			}else{
				throw new SError(`undeclared symbol ${name}`);
			}
		}
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

		var objectsString = ``;
		this.objects.forEach(function(symbol, name){
			const spacing = ` `.repeat(symbol.type.length + 3);

			//${indent}${spacing}addr: 0x${(+symbol.address).toString(16)}

			objectsString += `${indent}(${symbol.type}) ${name}
${indent}${spacing}type: ${symbol.specifiers}
${indent}${spacing}ptr: ${symbol.pointer}
${indent}${spacing}arr: ${symbol.dimension}
${indent}${spacing}init: ${symbol.initialized}
`;

			if(symbol.isFunction){
				objectsString += `${indent}${spacing}isFunction: ${symbol.isFunction}\n`;
				objectsString += `${indent}${spacing}isNative: ${symbol.isNative}\n`;
				/*symbol.parameters.forEach(function(){
					objectsString += `${indent}\t`;
				});*/
			}
		});


		var prt = header + divider + objectsString + divider;
		for(const child of this.children){
			prt += child.print(level+1);	
		}

		return prt;
	}
}


