/**
 * @file Memory simulator
 * @author Ondřej Hruboš
 */

// Helper constants for type sizes and limits
// sources: 
// 	- C Standard (ISO/IEC 9899)
//	- limits.h
//	- IEEE 754 FP Standard

// Character (8-bit signed & unsigned)
const CHARSIZE = 1;
const CHAR_MIN = -128;
const CHAR_MAX = 127;
const UCHAR_MAX = 255;

// Short Integer (16-bit signed & unsigned)
const SHORTSIZE = 2;
const SHORT_MIN = -32768;
const SHORT_MAX = 32767;
const USHORT_MAX = 65535;

// Integer (32-bit signed & unsigned)
const INTSIZE = 4;
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const UINT_MAX = 4294967295;

// Long Integer (32-bit signed & unsigned, assuming standard C `long` on 32-bit systems)
const LONGSIZE = 4;
const LONG_MIN = -2147483648;
const LONG_MAX = 2147483647;
const ULONG_MAX = 4294967295;

// Long Long Integer (64-bit signed & unsigned)
const LONGLONGSIZE = 8;
const LLONG_MIN = -9223372036854775808n; // Use BigInt (`n` at the end)
const LLONG_MAX = 9223372036854775807n;
const ULLONG_MAX = 18446744073709551615n;

// Floating-Point Types (IEEE 754 Standard)
// Floating point size in C can vary, but we assume standard 32-bit float and 64-bit double

// Float (32-bit)
const FLOATSIZE = 4;
const FLOAT_MIN = 1.17549435e-38; // Smallest positive normalized float
const FLOAT_MAX = 3.40282347e+38; // Largest finite float

// Double (64-bit)
const DOUBLESIZE = 8;
const DOUBLE_MIN = 2.2250738585072014e-308; // Smallest positive normalized double
const DOUBLE_MAX = 1.7976931348623157e+308; // Largest finite double

// Long double (128-bit)
const LONGDOUBLESIZE = 128;

/**
 * Memory regions
 * @description Memory regions enum
 * @global
 * @typedef MEMREGION
 */
const MEMREGION = {
	HEAP: "HEAP",
	STACK: "STACK",
	BSS: "BSS",
	DATA: "DATA",
}

/**
 * @class Memsim
 * @description Memory simulation class, handles calls from interpreter
 */
class Memsim {

	#warningSystem;

	constructor(warningSystem, heapSize = 1024, stackSize = 1024, dataSize = 512, bssSize = 512){
		this.#warningSystem = warningSystem;
		this.memory = new Map(); // Simulated memory
		this.references = new Map(); // Reference counter
		this.heapPointer = 1000; // Heap starts at 1000
		this.stackPointer = 5000; // Stack starts at 5000 and grows downward
		this.dataSegment = 2000;  // Initialized global variables
		this.bssSegment = 3000;   // Uninitialized global variables

		this.heapSize = heapSize;
		this.stackSize = stackSize;
		this.dataSize = dataSize;
		this.bssSize = bssSize;
	}

	/*******************************
	 *        CORE FUNCTIONS       *
	 *******************************
	 * High-level memory functions *
	 ******************************/

	/**
	 * High-level memory function which determines and sets memory to a symbol
	 * @param {Symbol} sym
	 * @param {integer|character|double|Array|Object}
	 * @param {MEMREGION} region
	 */
	setSymValue(sym, value, region){
		if (!Object.values(MEMREGION).includes(region)) {
			throw new AppError(`Invalid memory while setting MEMREGION of ${sym.name}: ${region}`);
		}

		//TODO struct
		if(sym.dimension > 0){ // array
			this.setArrayValue(sym, value, region);
		}else if(sym.pointer){
			this.setPointerValue(sym, value, region);
		}else { 
			this.setPrimitiveValue(sym, value, region);
		}
	}

	setPrimitiveValue(sym, value, region){
		switch(sym.memtype){
			case DATATYPE.bool:
			break;

			case DATATYPE.char:
			break;

			case DATATYPE.uchar:
			break;

			case DATATYPE.short:
			break;

			case DATATYPE.ushort:
			break;

			case DATATYPE.int:
				sym.address = sym.address ? this.changeIntValue(sym.address, value, sym.astPtr.loc) : this.setIntValue(value, region, sym.astPtr.loc);
			break;

			case DATATYPE.uint:
			break;

			case DATATYPE.long:
			break;

			case DATATYPE.ulong:
			break;

			case DATATYPE.longlong:
			break;

			case DATATYPE.ulonglong:
			break;

			case DATATYPE.float:
			break;

			case DATATYPE.double:
			break;

			case DATATYPE.longdouble:
			break;

			default:
				throw new AppError(`Invalid DATATYPE while setting value of ${sym.identifier}: ${sym.memtype}!`);
		}
	}

	setArrayValue(sym, value, region){
		// determine derived type of array
		const memtype = sym.memtype;
		const dimension = sym.dimension;
	}

	setPointerValue(sym, value, region){
		// pointer is 32 bits
		sym.address = sym.address ? this.changeIntValue(sym, value, sym.astPtr.loc) : this.setIntValue(value, region, sym.astPtr.loc);
	}

	/**
	 * High-level memory function which determines and reads memory of a symbol
	 * @param {Symbol} sym
	 * @param {integer|character|double|Array|Object}
	 * @param {MEMREGION} region
	 */
	readSymValue(sym){
		if(!sym) throw new AppError("Trying to read value of undefined Symbol");
		if(sym.address == undefined || isNaN(sym.address)){
			console.error(sym);
			throw new RTError(`Cannot read from a symbol with no address: ${sym.name}`);
		}

		//TODO struct
		if(sym.dimension > 0){ // array
			return this.readArrayValue(sym);
		}else if(sym.pointer){
			return this.readPointerValue(sym);
		}else {
			return this.readPrimitiveValue(sym);
		}
	}

	readPrimitiveValue(sym){
		switch(sym.memtype){
			case DATATYPE.bool:
			break;

			case DATATYPE.char:
			break;

			case DATATYPE.uchar:
			break;

			case DATATYPE.short:
			break;

			case DATATYPE.ushort:
			break;

			case DATATYPE.int:
				return this.readIntValue(sym.address);

			case DATATYPE.uint:
			break;

			case DATATYPE.long:
			break;

			case DATATYPE.ulong:
			break;

			case DATATYPE.longlong:
			break;

			case DATATYPE.ulonglong:
			break;

			case DATATYPE.float:
			break;

			case DATATYPE.double:
			break;

			case DATATYPE.longdouble:
			break;
		}

	}

	readArrayValue(sym){

	}

	readPointerValue(sym){

	}

	/******************************
	 *       MEMORY FUNCTIONS     *
	 ******************************
	 * Low-level memory functions *
	 *****************************/

	#storeMemory(address, size, region, value, type){
		for (let i = 0; i < size; i++) {
			this.memory.set(address + i, { 
				value: value !== undefined ? value : 0, 
				region: region 
			});

			this.references.set(address + i, 0); // initialize reference counter
		}
	}

	/**
	 * Adjusts pointer in memory region and calls storeMemory to allocate memory, returns address of allocated memory
	 * @param {MEMREGION} region
	 * @param {integer} size Size of allocated memory in BYTES
	 * @return {integer} address
	 */
	#allocRegion(region, size){
		var addr;

		switch(region){
			case MEMREGION.STACK:
				this.stackPointer -= size;
				this.#storeMemory(this.stackPointer, size, MEMREGION.STACK);
				addr = this.stackPointer;
				break;
			case MEMREGION.HEAP:
				addr = this.heapPointer;
				this.#storeMemory(this.heapPointer, size, MEMREGION.HEAP);
				this.heapPointer += size;
				break;
			case MEMREGION.BSS:
				addr = this.bssSegment;
				this.#storeMemory(this.bssSegment, size, MEMREGION.BSS);
				this.bssSegment += size;
				break;
			case MEMREGION.DATA:
				addr = this.dataSegment;
				this.#storeMemory(this.dataSegment, size, MEMREGION.DATA);
				this.dataSegment += size;
				break;
	        default:
    	        throw new AppError(`Invalid memory region: ${region}`);
		}

		return addr;
	}

	/**
	 * Increase reference count when a pointer points to an address
	 * @param {integer} address
	*/
	addReference(address) {
		if(this.references.has(address)){
			this.references.set(address, this.references.get(address) + 1);
		}else{
			throw new AppError(`Invalid reference to address ${address}`);
		}
	}

	/**
	 * Decrease reference count when a pointer is removed
	 * @param {integer} address
	 */
	removeReference(address) {
		if (this.references.has(address)) {
			let count = this.references.get(address);
			if (count > 0) {
				this.references.set(address, count - 1);
			}
		}
	}

	setIntValue(value, region, loc){
		if (value < INT_MIN || value > INT_MAX) {
			this.#warningSystem.add(`Integer overflow at memory address 0x${addr.toString(16)}, truncating value!`, WTYPE.OVERFLOW, loc);
			value = value & 0xFFFFFFFF; // truncate to 32 bits
		}

		const s = INTSIZE;
		const addr = this.#allocRegion(region, s);

		const memorySpace = new ArrayBuffer(s);
		const view = new DataView(memorySpace);
		view.setInt32(0, value, true); // little-endian!

		for(let i = 0; i < s; i++){ // alloc every byte separately
			this.memory.set(addr + i, { value: view.getUint8(i), region: region });
		}

		return addr;
	}

	changeIntValue(value, loc){
		if (value < INT_MIN || value > INT_MAX) {
			this.#warningSystem.add(`Integer overflow at memory address 0x${addr.toString(16)}, truncating value!`, WTYPE.OVERFLOW, loc); // loc unknown - maybe pass it as argument??
			value = value & 0xFFFFFFFF; // truncate to 32 bits
		}

		/*const s = INTSIZE;
		const addr = this.#allocRegion(region, s);

		const memorySpace = new ArrayBuffer(s);
		const view = new DataView(memorySpace);
		view.setInt32(0, value, true); // little-endian!

		for(let i = 0; i < s; i++){ // alloc every byte separately
			this.memory.set(addr + i, { value: view.getUint8(i), region: "heap" });
		}*/

		return sym.address;
	}

	readIntValue(addr) {
		const s = INTSIZE;
		const buffer = new ArrayBuffer(s);
		const view = new DataView(buffer);

		for(let i = 0; i < s; i++){
			if(!this.memory.has(addr + i)) throw new RTError(`Invalid memory access at ${addr + i}`);
			view.setUint8(i, this.memory.get(addr + i).value);
		}

		return view.getInt32(0, true);
	}


	/************************************
	 *          Helper functions        *
	 ***********************************/

	/**
	 * Determines the memory region of a given address.
	 * @param {integer} address The memory address to check.
	 * @returns {MEMREGION} The memory region (HEAP, STACK, BSS, DATA).
	 * @throws {AppError} If the address does not belong to any valid region.
	 */
	getMemoryRegion(address){
		if (this.memory.has(address)){
			return this.memory.get(address).region; // for some reason the stored string is lowercase
		}else{
			throw new AppError(`Address ${address} does not belong to any valid memory region.`);
		}
	}

	// Print memory for debugging
	printMemory(){
		console.log("Memory Dump:");
		this.memory.forEach((data, addr) => {
			console.log(`${addr}: value=${data.value.toString(2)}, region=${data.region}`);
		});
	}
}
