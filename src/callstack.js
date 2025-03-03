/**
 * @file Call stack
 * @author Ondřej Hruboš
 */

/**
 * @class CallStack
 */
class CallStack extends Stack {
}

/**
 * @class StackFrame
 * @param {Symtable} symtable
 * @param {Construct} construct Construct which created the stack frame
 */
class StackFrame {
	constructor(symtable, construct){
		this.symtable = structuredClone(symtable);
		this.construct = construct;
	}
}
