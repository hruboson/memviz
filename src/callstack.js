/**
 * @file Call stack
 * @author Ondřej Hruboš
 */

/**
 * @class CallStack
 * @inheritdoc
 */
class CallStack extends Stack {

	/**
	 * Retrives StackFrame from CallStack with the symtable corresponding to current top StackFrame symtable
	 * @param {Symtable} symtbptr Pointer to symtable in semantic
	 */
	getParentSF(symtbptr){
		const lookingFor = symtbptr.parent.scopeInfo.name;

		for (let i = this.items.length - 1; i >= 0; i--) {
			if (this.items[i].symtable.scopeInfo.name == lookingFor) {
				return this.items[i];
			}
		}
		return undefined;
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
			return this.symtable.objects.get(name);

		}else if(this.symtable.tags.get(name)){
			return this.symtable.tags.get(name);

		}else if(this.symtable.labels.get(name)){
			return this.symtable.labels.get(name);

		}else{
			if(this.parent){
				return this.parent.resolve(name);
			}else{
				throw new RTError(`undeclared symbol ${name}`);
			}
		}
	}
}
