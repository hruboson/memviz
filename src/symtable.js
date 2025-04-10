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
 * @typedef SYMTYPE
 * @global
 * @const
 */
const SYMTYPE = {
	OBJ: "OBJ",
	FNC: "FNC",
	TAG: "TAG",
	MEMBER: "MEMBER",
	TYPEDEF: "TYPEDEF",
	LABEL: "LABEL",
};

/**
 * Enum for possible fundamental data types of symbol
 * @typedef DATATYPE
 * @global
 * @const
 * @see {memory.js} for sizes
 */
const DATATYPE = {
	bool: "bool",
	char: "char",
	uchar: "uchar",
	short: "short",
	ushort: "ushort",
	int: "int",
	uint: "uint",
	long: "long",
	ulong: "ulong",
	longlong: "longlong",
	ulonglong: "ulonglong",
	float: "float",
	double: "double",
	longdouble: "longdouble",
	void: "void",
};

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
class Sym extends MemoryRecord{

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
	 * Flag to mark inerpretation already happened on this symbol (declaration, initialization, ...anything)
	 * @type {bool}
	 */
	interpreted = false;

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

	constructor(name, type, initialized, specifiers, pointer, dimension=0, size=[], indirection=0, parameters=null, isFunction=false, astPtr=null, isNative=false){
		super();
		this.name = name;
		this.type = type;
		this.specifiers = specifiers;
		this.pointer = pointer;
		this.dimension = dimension;
		this.size = size;
		this.indirection = indirection;
		this.initialized = initialized;
		this.parameters = parameters;
		this.isFunction = isFunction;
		this.isNative = isNative;
		this.astPtr = astPtr; // is this 100% pointer??? otherwise it's super inefficient (I'm not sure how JS pointers work)
		this.memtype = this.determineMemtype();

		if(indirection > 0){ 
			this.pointsToMemtype = this.memtype; // needed for pointer arithmetic
			this.memtype = DATATYPE.int;
		}

		this.determineSize();
	}

	initialize(){
		this.initialized = true;
	}

	/**
	 * Determines the memory type based on the specifiers
	 * @return {DATATYPE}
	 * @note Determined in constructor
	 */
	determineMemtype(){
		let specArr = this.specifiers;
		if(!Array.isArray(this.specifiers)){
			console.warn("Wrong type of Sym.specifiers, expected Array, got ", getclass(this.specifiers));
			specArr = this.specifiers.split(',').filter(s => s.length > 0); 
		}

		let specSet = new Set(specArr);

		// Default type is 'int' if unspecified - but this should never happen
		if(specSet.size === 0) return DATATYPE.int;

		if(specSet.has("bool")) return DATATYPE.bool;
		if(specSet.has("char")) return specSet.has("unsigned") ? DATATYPE.uchar : DATATYPE.char;
		if(specSet.has("short")) return specSet.has("unsigned") ? DATATYPE.ushort : DATATYPE.short;
		if(specSet.has("int")) return specSet.has("unsigned") ? DATATYPE.uint : DATATYPE.int;

		// Floating-point types
		if(specSet.has("float")) return DATATYPE.float;
		if(specSet.has("double")) return specSet.has("long") ? DATATYPE.longdouble : DATATYPE.double;

		// Handling 'long', 'long long', and unsigned variations
		if(specSet.has("long")){
			if(specSet.has("long")) return specSet.has("unsigned") ? DATATYPE.ulonglong : DATATYPE.longlong;
			return specSet.has("unsigned") ? DATATYPE.ulong : DATATYPE.long;
		}

		// Default to int
		return DATATYPE.int;
	}

	/**
	 * Override to avoid recursion
	 * @description Convert this to ordinary Object without recursive references.
	 * @return {Object}
	 */
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            initialized: this.initialized,
            specifiers: this.specifiers,
            pointer: this.pointer,
            dimension: this.dimension,
            isFunction: this.isFunction,
            isNative: this.isNative,
            astPtr: this.astPtr ? '[AST present]' : null, // Prevent deep recursion
        };
    }
}

/**
 * Types of name spaces
 * @see {@link http://port70.net/~nsz/c/c99/n1256.html#6.2.3}
 * @typedef NAMESPACE
 * @global
 * @const
 */
const NAMESPACE = {
	ORDS: "ORDS", // ordinary identifiers
	TAGS: "TAGS",
	MEMBERS: "MEMBERS",
	LABELS: "LABELS",
};

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
	 * @param {bool} initialized
	 * @param {string} name Symbol name (identifier)
	 * @param {Array.<string>} specifiers
	 * @param {bool} pointer
	 * @param {integer} dimension
	 * @param {integer} size
	 * @param {integer} indirection
	 * @param {Array.<Declarator>} parameters
	 * @param {bool} isFunction
	 * @param {Construct} astPtr
	 * @param {bool} isNative
	 */
	insertORD(namespace, type, initialized, name, specifiers, pointer, dimension=0, size=0, indirection=0, parameters=null, isFunction=false, astPtr=null, isNative=false){
		const sym = this.lookup(namespace, name);
		if(sym){
			if(sym.initialized){
				throw new SError(`redefinition of ${name}`, astPtr.loc);
			}else{
				// allow function declaration - definition
				if(type == SYMTYPE.FNC){
					sym.initialize();
					sym.astPtr = astPtr;
					sym.type = SYMTYPE.FNC;
					sym.isNative = isNative;
					return;
				}

				throw new SError(`redefinition of ${name}`, astPtr.loc);
			}
		}

		this.objects.set(name, new Sym(name, type, initialized, specifiers, pointer, dimension, size, indirection, parameters, isFunction, astPtr, isNative));
	}

	insertTAG(namespace, tagname, values){
		const tag = this.lookup(namespace, tagname);
		if(tag) throw new SError(`redefinition of ${tagname}`, astPtr.loc);
		this.tags.set(tagname, new Sym());
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


