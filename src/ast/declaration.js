/**
 * @file Declaration and initialization-related classes
 */

/**
 * @class Type
 * @decription Allowed (built-in) types: void  char  short  int  long  float  double  signed  unsigned, _Bool
 * @param {Array.<string>} specifiers
 */
class Type {
	constructor(specifiers){
		this.specifiers = specifiers.filter(function (without) {
			return without !== "typedef"; // remove "typedef" as that is not needed in the specifiers 
		});
		/*this.size = this.#get_size(this.specifiers);
		this.unsigned = this.specifiers.includes("unsigned") ? true : false;*/ //<-- these shouldn't be in AST
	}
}

/**
 * Initializer type enumeration (helper constant)
 * @constant
 * @typedef INITTYPE 
 * @global
 * @todo add all necessary types
 */
const INITTYPE = {
	EMPTY: "EMPTY",
}

/**
 * @class Initializer
 * @param {INITTYPE} kind
 */
class Initializer {
	constructor(kind){
		//TODO initializer types
		switch(kind){
			case INITTYPE.EMPTY:
				break;
			default:
				throw new Error("Unknown initializer type!");
				break;
		}
		this.kind = kind;
	}
}

/**
 * Declaration type enumeration (helper constant)
 * @constant
 * @typedef DECLTYPE
 * @global
 */
const DECLTYPE = {
	ID: "ID", // identifier
	DECLPAR: "DECLPAR", // declarator enclosed in parentheses
	PTR: "PTR", // pointer
	ARR: "ARR", // array
	FNC: "FNC", // function
}

/**
 * Declarator structure.
 * @description Can be either: identifier, declarator enclosed in parentheses (pointers to arrays, pointers to functions), pointer declarator, array declarator, function declarator
 * @class Declarator
 * @param {DECLTYPE} kind Type of declarator. Described in [class description]{@link Declarator#description}.
 * @param {Declarator} child Child declarator
 * @param {Identifier|Pointer|null} data Idk whatever is needed just put it here
 */
class Declarator {
	//TODO Refactor + docu
	kind;
	child;
	identifier;
	ptr;
	arr;

	constructor(kind, child, data){
		switch(kind){
			case DECLTYPE.ID:
				this.identifier = data;
				break;
			case DECLTYPE.DECLPAR:
				break;
			case DECLTYPE.PTR:
				this.ptr = data;
				break;
			case DECLTYPE.ARR:
				this.arr = data;
				break;
			case DECLTYPE.FNC:
				break;
			default:
				throw new Error("Unknown declaration type!");
		}
		this.kind = kind;
		this.child = child;
	}
}

/**
 * @class Declaration
 * @param {Type} Type
 * @param {Declarator|Unnamed} declarator
 * @param {Initializer} initializer
 */
class Declaration extends Construct {
	constructor(type, declarator, initializer){
		super();
		this.type = type;
		this.declarator = declarator;// ?? (() => { throw new Error("Declarator cannot be null!")})();
		this.initializer = initializer;
		/*this.definition = this.initializer ? true : false;*/ //<--- shouldn't be in AST
	}

	accept(visitor){

	}
}


