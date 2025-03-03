/**
 * @file Declaration and initialization-related classes
 * @author Ondřej Hruboš
 */

/**
 * @class Type
 * @decription Allowed (built-in) types: void  char  short  int  long  float  double  signed  unsigned, _Bool
 * @param {Array.<string>} [specifiers=[]]
 * @param {Object} loc
 */
class Type {

	/**
	 * Array of specifiers
	 * @type {Array.<string>}
	 */
	specifiers;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(specifiers=[], loc){
		this.loc = loc;
		if(specifiers.length == 0){
			this.specifiers = ["int"]; // Empty type defaults to int
		}else{
			this.specifiers = specifiers.filter(function (without) {
				return without !== "typedef"; // remove "typedef" as that is not needed in the specifiers 
			});
		}
	}
}

/**
 * Initializer type enumeration (helper constant)
 * @constant
 * @typedef INITTYPE 
 * @global
 */
const INITTYPE = {
	EXPR: "EXPR", // expression == scalar, see https://en.cppreference.com/w/c/language/scalar_initialization
	ARR: "ARRAY", // array == string, { ... }, see https://en.cppreference.com/w/c/language/array_initialization 
	STRUCT: "STRUCT", // struct, see https://en.cppreference.com/w/c/language/struct_initialization
	NESTED: "NESTED",
}

/**
 * Used to modify which part of struct/array is being initialized (a kind of specifier)
 * @class Designator
 * @param {Identifier|CExpr|Array.<Identifier>|Array.<CExpr>} designator Either identifier or constant expression OR arrays of them
 * @param {Object} loc
 */
class Designator {
	
	/**
	 * Either identifier or constant expression OR arrays of them
	 * @type {Identifier|CExpr|Array.<Identifier>|Array.<CExpr>}
	 */
	designator;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(designator, loc){
		if(isclass(designator, "Identifier")){
			this.kind = "IDENTIFIER";
		}else{
			this.kind = "CEXPR";
		}
		this.designator = designator;
		this.loc = loc;
	}
}

/**
 * Initializer structure
 * @desription Initializer can be one of the following: expression, scalar initializer, array initializer, structure initializer
 * @class Initializer
 * @param {INITTYPE} kind
 * @param {Expr|Arr|Struct} data
 * @param {Initializer} child For nested arrays and structs
 * @param {Designator|Array.<Designator>|null} designator Single or array of designators
 * @param {Object} loc
 */
class Initializer extends Construct {
	
	/**
	 * Kind of initializer
	 * @type {INITTYPE}
	 */
	kind;

	/**
	 * Expression initializer
	 * @type {Expr}
	 */
	expr;

	/**
	 * Array initializer
	 * @type {Arr}
	 */
	arr;

	/**
	 * Struct initializer
	 * @type {Struct}
	 */
	struct;

	/**
	 * Child initializer (for nested arrays and structs)
	 * @type {Initializer}
	 */
	child;

	/**
	 * Designator
	 * @type {Designator|Array.<Designator>|null}
	 */
	designator;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(kind, data, child, designator, loc){
		super();
		this.kind = kind;
		switch(kind){
			case INITTYPE.EXPR:
				this.expr = data;
				break;
			case INITTYPE.ARR:
				if(data.length < 2){ // this is SCALAR
					this.kind = INITTYPE.EXPR;
					this.expr = data[0];
					break;
				}
				this.arr = data;
				break;
			case INITTYPE.STRUCT:
				this.struct = data;
				break;
			case INITTYPE.NESTED:
				this.child = data;
				this.unnest();
				return;

			default:
				throw new AppError(`Unknown initializer type: ${kind}`);
				break;
		}
		this.initializer = child;
		this.designator = designator;
		this.loc = loc;
	}	

	accept(visitor){
		return visitor.visitInitializer(this);
	}

	/**
	 * Flatten Initializer - remove NESTED initializers and replace them with their child
	 * hopefully this works, because it seems too good to be true
	 */
	unnest() {
		if (this.kind == INITTYPE.NESTED) {
			const nested = this.child; // get the nested initializer
			this.kind = nested.kind;
			this.expr = nested.expr ?? null;
			this.arr = nested.arr ?? null;
			this.struct = nested.struct ?? null;
			this.child = nested.child ?? null;
			this.designator = nested.designator ?? this.designator;
			this.loc = nested.loc ?? this.loc;
		}

		// recursively unnest arrays
		if (this.kind == INITTYPE.ARR && this.arr) {
			this.arr = this.arr.map(item => {
				if (item.kind == INITTYPE.NESTED) {
					item.unnest(); // modify in-place
				}
				return item;
			});
		}

		// recursively unnest structs
		if (this.kind == INITTYPE.STRUCT && this.struct) {
			for (const key in this.struct) {
				if (this.struct[key].kind == INITTYPE.NESTED) {
					this.struct[key].unnest(); // modify in-place
				}
			}
		}
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
 * @param {Declarator} [child=null] Child declarator
 * @param {Identifier|Object|Pointer|Expr|null} data Idk whatever is needed just put it here
 * @param {Object} loc
 */
class Declarator extends Construct {
	
	/**
	 * Type of declarator. Described in [class description]{@link Declarator#description}.
	 * @type {DECLTYPE}
	 */
	kind;

	/**
	 * Child declarator
	 * @type {Declarator}
	 */
	child;

	/**
	 * Identifier of declarator
	 * @description Should be only set if DECLTYPE is ID
	 * @type {Identifier}
	 */
	identifier;

	/**
	 * Pointer of declarator
	 * @description Should be only set if DECLTYPE is PTR
	 * @type {Pointer}
	 */
	ptr;

	/**
	 * Size of array of declarator
	 * @description Should be only set if DECLTYPE is ARR
	 * @type {Array}
	 * @todo check if this is correct (when you continue work on parser)
	 */
	arrSizeExp;

	/**
	 * Function parameters
	 * @description Should be only set if DECLTYPE is FNC
	 * @type {Object}
	 */
	fnc;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(kind, child=null, data, loc){
		super();
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
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitDeclarator(this);
	}
}

/**
 * Abstract declarator. For prototype-less function declarations.
 * @class AbstractDeclarator
 * @param {DECLTYPE} kind
 * @param {AbstractDeclarator} child
 * @param {Pointer|Object|null} data
 * @param {Object} loc
 */
class AbstractDeclarator extends Declarator {
	constructor(kind, child, data, loc){
		super(kind, child, data, loc);
	}
}

/**
 * @class Declaration
 * @param {Type} Type
 * @param {Declarator|Unnamed} declarator
 * @param {Initializer} initializer
 * @param {Object} loc
 */
class Declaration extends Construct {

	/**
	 * Type (specifiers) of declaration
	 * @type {Type}
	 */
	type;

	/**
	 * Declarator part of Declaration
	 * @type {Declarator}
	 */ 
	declarator;

	/**
	 * Initializer part of Declaration (or null if there is none)
	 * @type {Initializer}
	 */ 
	initializer;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(type, declarator, initializer, loc){
		super();
		this.type = type;
		this.declarator = declarator;
		this.initializer = initializer;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitDeclaration(this);
	}
}


