/**
 * @file Native functions
 * @author Ondřej Hruboš
 */

/**
 * @class {NATIVE_printf}
 * @description Custom class for native function printf, create new instance when adding printf to symboltable
 */
class NATIVE_printf{
	accept(visitor, args){ // will only be called in interpreter
		visitor.visitPrintF(this, args);
	}
}

function addNativeFunctions(symtableGlobal){
	symtableGlobal.insert(
		NAMESPACE.ORDS,
		SYMTYPE.FNC,
		true,                      // initialized
		"printf",                  // function name
		["int"],                   // return type (C's printf returns int)
		false,                     // not a pointer
		0,                         // not an array
		[new Declarator(DECLTYPE.ID, null, {name: "formatstr"})],
		true,                      // isFunction
		new NATIVE_printf(),       // no AST, built-in function pointer
		true                       // isNative
	);
}
