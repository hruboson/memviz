/**
 * @file Declaration and initialization-related classes
 * @author Ondřej Hruboš
 */

/**
 * @class Type
 * @decription Allowed (built-in) types: void  char  short  int  long  float  double  signed  unsigned, _Bool
 * @param {Array.<String>} [specifiers=[]]
 */
class Type {
	constructor(specifiers=[]){
		if(specifiers.length == 0){
			this.specifiers = ["int"]; // Empty type defaults to int
		}else{
			this.specifiers = specifiers.filter(function (without) {
				return without !== "typedef"; // remove "typedef" as that is not needed in the specifiers 
			});
		}
		/*this.size = this.#get_size(this.specifiers);
		this.unsigned = this.specifiers.includes("unsigned") ? true : false;*/ //<-- these shouldn't be in AST
	}
}

/**
 * Initializer type enumeration (helper constant)
 * @constant
 * @typedef INITTYPE 
 * @global
 */
const INITTYPE = { //FIX These types are probably wrong and are not used in code
	EXPR: "EXPR",
	SCALAR: "SCALAR",
	ARR: "ARRAY",
	STRUCT: "STRUCT",
	NESTED: "NESTED",
}

/**
 * Used to modify which part of struct/array is being initialized (a kind of specifier)
 * @class Designator
 * @param {Identifier|CExpr|Array.<Identifier>|Array.<CExpr>} designator Either identifier or constant expression OR arrays of them
 */
class Designator {
	constructor(designator){
		if(designator instanceof Identifier){ //FIX should be exact instanceof, create a function in util.js for this
			this.kind = "IDENTIFIER";
		}else{
			this.kind = "CEXPR";
		}
		this.designator = designator;
	}
}

/**
 * Initializer structure
 * @desription Initializer can be one of the following: expression, scalar initializer, array initializer, structure initializer
 * @class Initializer
 * @param {INITTYPE} kind
 * @param {Expr|Array.<Expr>} data
 * @param {Initializer} child For nested arrays and structs
 * @param {Designator|Array.<Designator>|null} designator Single or array of designators
 */
class Initializer {
	constructor(kind, data, child, designator){
		this.kind = kind;
		switch(kind){
			case INITTYPE.EXPR:
			case INITTYPE.SCALAR:
				this.expr = data;
				break;
				break;
			case INITTYPE.ARR:
				this.arr = data;
				break;
			case INITTYPE.STRUCT:
				this.struct = data;
				break;
			case INITTYPE.NESTED:
				break;
			default:
				throw new Error("Unknown initializer type!");
				break;
		}
		this.initializer = child;
		this.designator = designator;
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
 * @param {Identifier|Object|Pointer|Expr|null} data Idk whatever is needed just put it here
 */
class Declarator {
	//TODO Refactor + docu
	kind;
	child;
	identifier;
	ptr;
	arrSizeExp;
	fnc;

	constructor(kind, child, data){
		this.kind = kind;
		switch(kind){
			case DECLTYPE.ID:
				this.identifier = data;
				break;
			case DECLTYPE.PTR:
				this.ptr = data;
				break;
			case DECLTYPE.ARR:
				this.arrSizeExp = data;
				break;
			case DECLTYPE.FNC:
				this.fnc = data;
				break;
			default:
				throw new Error("Unknown declaration type!");
		}
		this.child = child;
	}
}

/**
 * Abstract declarator. For prototype-less function declarations.
 * @class AbstractDeclarator
 * @param {DECLTYPE} kind
 * @param {AbstractDeclarator} child
 * @param {Pointer|Object|null}
 */
class AbstractDeclarator extends Declarator {
	constructor(kind, child, data){
		super(kind, child, data);
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


