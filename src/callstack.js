/**
 * @file Call stack
 * @author Ondřej Hruboš
 */

/**
 * @class CallStack
 * @param {Memsim} memsim Memory manager to deallocate stack symbols
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
	 * Instance of Memsim, will be used to automatically free stack symbols
	 * @type {Memsim}
	 */
	#memsim;

	/**
	 * Heap frame
	 */
	hFrame;

	/**
	 * Data frame
	 */
	dFrame;

	constructor(memsim){
		this.#sFrames = [];
		this.#memsim = memsim;
		this.hFrame = new HeapFrame();
		this.dFrame = new DataFrame();
	}

	/**
	 * Finds memory record by its address
	 * @returns {MemoryRecord|undefined}
	 */
	findMemoryRecord(address){
		let record;
		for(record of this.hFrame){
			if(record.address == address ) return record;
			if(record.addresses.includes(address)){
				const dummyRecord = new MemoryRecord();
				dummyRecord.address = address;
				dummyRecord.size = []; // when reading from one address it cannot return array (it can only return pointer)
				dummyRecord.indirection = record.indirection;
				dummyRecord.memtype = record.memtype;
				dummyRecord.memsize = MEMSIZES[record.memtype];
				
				return dummyRecord;
			}
		}
		for(record of this.dFrame){
			if(record.address == address ) return record;
			if(record.addresses.includes(address)){
				const dummyRecord = new MemoryRecord();
				dummyRecord.address = address;
				dummyRecord.size = []; // when reading from one address it cannot return array (it can only return pointer)
				dummyRecord.indirection = record.indirection;
				dummyRecord.memtype = record.memtype;
				dummyRecord.memsize = MEMSIZES[record.memtype];
				
				return dummyRecord;
			}
		}
		for(const frame of this.#sFrames){
			for(record of frame.symtable.objects.values().filter(obj => obj.type == SYMTYPE.OBJ)){
				if(record.address == address || record.addresses.includes(address)) return record;
				if(record.addresses.includes(address)){
					const dummyRecord = new MemoryRecord();
					dummyRecord.address = address;
					dummyRecord.size = []; // when reading from one address it cannot return array (it can only return pointer)
					dummyRecord.indirection = record.indirection;
					dummyRecord.memtype = record.memtype;
					dummyRecord.memsize = MEMSIZES[record.memtype];
					
					return dummyRecord;
				}
			}
		}
	}

	/**
	 * Returns the top-most item in stack
	 * @return {StackFrame}
	 */
	peekSFrame(){
		return this.#sFrames[this.#sFrames.length - 1];
	}

	/**
	 * Alias for peekSFrame()
	 * @return {StackFrame}
	 */
	topSFrame(){
		return this.peekSFrame();
	}

	bottomSFrame(){
		return this.#sFrames[0];
	}

	/**
	 * Removes the top-most item in stack of stack frames and returns it
	 * @return {StackFrame}
	 */
	popSFrame(){
		if(this.#sFrames.length == 0){ 
			return; 
		}

		const sFrame = this.#sFrames[this.#sFrames.length - 1];

		// deallocate all objects/symbols/records
		for(const [name, obj] of sFrame.symtable.objects){
			if(obj.address){
				this.#memsim.free(obj.address, obj.memsize, MEMREGION.STACK);
			}
		}

		this.#sFrames.splice(this.#sFrames.length - 1, 1);
		return sFrame;
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

	/**
	 * Checks whether symbol table contains no objects (meaning objects that can be visualized)
	 * @note Returns empty even if functions, typedefs and other non-object types are in the symtable
	 * @return {bool}
	 */
	emptyObjects(){
		const filteredObjects = Array.from(this.symtable.objects.entries()).filter(([name, sym]) => !sym.isFunction && !sym.isNative);
		console.log(filteredObjects);
		return filteredObjects.length == 0 ? true : false;
	}
}

class HeapFrame{
	records = [];

	add(record){
		this.records.push(record);
	}

	remove(record){
		const index = this.records.indexOf(record);
		if(index != -1){
			this.records.splice(index, 1);
		}
	}

	get(address){
		for(const r of this.records){
			if(r.address == address) return r;
		}
		return false;
	}

	[Symbol.iterator](){
		let index = 0; // start from bottom
		return {
			next: () => {
				if (index < this.records.length) {
					return { value: this.records[index++], done: false };
				} else {
					return { done: true };
				}
			}
		};
	}
}

class DataFrame{
	records = [];

	add(record){
		this.records.push(record);
	}

	remove(record){
		const index = this.records.indexOf(record);
		if(index != -1){
			this.records.splice(index, 1);
		}
	}

	get(address){
		for(const r of this.records){
			if(r.address == address) return r;
		}
		return false;
	}

	[Symbol.iterator](){
		let index = 0; // start from bottom
		return {
			next: () => {
				if (index < this.records.length) {
					return { value: this.records[index++], done: false };
				} else {
					return { done: true };
				}
			}
		};
	}
}

