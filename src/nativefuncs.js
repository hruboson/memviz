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
		return visitor.visitPrintF(this, args);
	}
}

/**
 * @class NATIVE_malloc
 * @description Custom "node" for built-in malloc function. Is visitable by visitor.
 */
class NATIVE_malloc{
	accept(visitor, arg){
		return visitor.visitMalloc(this, arg);
	}
}

/**
 * @class NATIVE_free
 * @description Custom "node" for built-in free function. Is visitable by visitor.
 */
class NATIVE_free{
	accept(visitor, arg){
		return visitor.visitFree(this, arg);
	}
}
