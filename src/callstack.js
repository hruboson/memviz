/**
 * @file Call stack
 * @author Ondřej Hruboš
 */

/**
 * @class CallStack
 * @todo rename this class
 */
class CallStack{

	/**
	 * Stack of stack frames
	 * @private
	 * @type {Array}
	 */
	#sFrames;

	/**
	 * Heap frame
	 */
	hFrame;

	/**
	 * Data frame
	 */
	dFrame;

	constructor(){
		this.#sFrames = [];
		this.hFrame = new HeapFrame();
		this.dFrame = new DataFrame();
	}

	/**
	 * Returns the top-most item in stack
	 * @return {Object}
	 */
	peekSFrame(){
		return this.#sFrames[this.#sFrames.length - 1];
	}

	/**
	 * Alias for peek()
	 * @return {Object}
	 */
	topSFrame(){
		return this.peekSFrame();
	}

	/**
	 * Removes the top-most item in stack and returns it
	 * @return {Object}
	 */
	popSFrame(){
		if(this.#sFrames.length == 0){ 
			return; 
		}

		const item = this.#sFrames[this.#sFrames.length - 1];
		this.#sFrames.splice(this.#sFrames.length - 1, 1);
		return item;
	}

	/**
	 * Adds item to top of stack
	 */
	pushSFrame(item){
		this.#sFrames[this.#sFrames.length] = item;
	}

	/**
	 * Retrives StackFrame from CallStack with the symtable corresponding to current top StackFrame symtable
	 * @param {Symtable} symtbptr Pointer to symtable in semantic
	 */
	getParentSF(symtbptr){
		const lookingFor = symtbptr.parent.scopeInfo.name;

		for (let i = this.#sFrames.length - 1; i >= 0; i--) {
			if (this.#sFrames[i].symtable.scopeInfo.name == lookingFor) {
				return this.#sFrames[i];
			}
		}
		return undefined;
	}

	/**
	 * Iterator defaults to stack frames
	 */
	[Symbol.iterator](){
		let index = 0; // start from bottom
		return {
			next: () => {
				if (index < this.#sFrames.length) {
					return { value: this.#sFrames[index++], done: false };
				} else {
					return { done: true };
				}
			}
		};
	}
}

/**
 * @class StackFrame
 * @param {Symtable} symtable
 * @param {Construct} construct Construct which created the stack frame
 * @param {StackFrame} parent Pointer to parent sf on call stack
 *
 * @important symtable is copied as an object (without funcitons)
 */
class StackFrame {
	constructor(symtable, construct, parent){
		//! danger: the symtable is copied as an object without functions, bear that in mind
		this.symtable = structuredClone(symtable);
		this.construct = construct;
		this.parent = parent;
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
				return this.symtable.objects.get(name);
			case NAMESPACE.TAGS:
				return this.symtable.tags.get(name);
			case NAMESPACE.MEMBERS:
				break;
				//TODO return this.membersSpaces.get(name);
			case NAMESPACE.LABELS:
				return this.symtablelabels.get(name);
			default:
				throw new AppError("Wrong namespace type while looking up symbol!");
		}
	}

	/**
	 * Traverses this and all parent symbol tables (on call stack) and either finds a symbol and returns it, or throws RTError (should not happen)
	 * @param {string} name Symbol name (identifier)
	 * @return {Sym} Returns Symbol in case of succes
	 * @throws {SError}
	 */
	resolve(name){
		if(!name) throw new AppError("Undefined identifier name while resolving in call stack");

		if(this.symtable.objects.get(name)){
			const symbol = this.symtable.objects.get(name);
			if (symbol.interpreted){
				return symbol;
			}else{
				return this.parent.resolve(name);
			}
		}else if(this.symtable.tags.get(name)){
			const symbol = this.symtable.tags.get(name);
			if (symbol.interpreted){
				return symbol;
			}else{
				return this.parent.resolve(name);
			}
		}else if(this.symtable.labels.get(name)){
			const symbol = this.symtable.labels.get(name);
			if (symbol.interpreted){
				return symbol;
			}else{
				return this.parent.resolve(name);
			}
		}else{
			if(this.parent){
				return this.parent.resolve(name);
			}else{
				throw new RTError(`undeclared symbol ${name}`);
			}
		}
	}

	/**
	 * Checks whether symtables are empty.
	 * @return {bool}
	 */
	empty(){
		return (this.symtable.objects.size == 0 && this.symtable.tags.size == 0 && this.symtable.labels.size == 0) ? true : false;
	}
}

class HeapFrame{

}

class DataFrame{

}
