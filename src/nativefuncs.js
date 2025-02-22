/**
 * @file Native functions
 * @author Ondřej Hruboš
 */

/**
 * @class NATIVE_printf
 * @description Custom class for native function printf, create new instance when adding printf to symboltable
 */
class NATIVE_printf{
	accept(visitor, args){ // will only be called in interpreter
		visitor.visitPrintF(this, args);
	}
}
