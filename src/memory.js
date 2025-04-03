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
// Floating point size in C can vary, but let's assume standard 32-bit float and 64-bit double

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
 * @typedef MEMREGION
 * @global
 * @const
 */
const MEMREGION = {
	HEAP: "HEAP",
	STACK: "STACK",
	BSS: "BSS",
	DATA: "DATA",
}

/**
 * Memory types sizes. Lookup table for DATATYPE.
 * @typedef MEMSIZES
 * @global
 * @const
 */
const MEMSIZES = {
	bool: CHARSIZE,
	char: CHARSIZE,
	uchar: CHARSIZE,
	short: SHORTSIZE,
	ushort: SHORTSIZE,
	int: INTSIZE,
	uint: INTSIZE,
	long: LONGSIZE,
	ulong: LONGSIZE,
	longlong: LONGLONGSIZE,
	ulonglong: LONGLONGSIZE,
	float: FLOATSIZE,
	double: DOUBLESIZE,
	longdouble: LONGDOUBLESIZE,
}

/**
 * @class MemoryRecord
 */
class MemoryRecord{

	/**
	 * Hexadecimal number specifying where in memory the symbol is stored
	 * @type {integer}
	 */
	address;

	/**
	 * Array of hexadecimal numbers. This field is set in case of array.
	 * @type {integer}
	 * @example
	 * 	int x[][][] = {{{10, 20, 30}, {10, 20, 30}}, {{10, 20, 30}, {10, 20, 30}}}; -> addresses == [4996,4992,4988,4984,4980,4976,4972,4968,4964,4960,4956,4952] (array on stack)
	 */
	addresses = [];

	/**
	 * Dimension of an array
	 * @type {integer}
	 */
	dimension;

	/**
	 * Array sizes in case of array symbol
	 * @type {Array.<integer>|Array.<char>}
	 * @example
	 * 	int a = 1; // size = []
	 * 	int[] = {1, 2, 3}; // size = [3]
	 * 	int[][] = { {1, 2, 3}, {3, 4, 5} }; // size = [2, 3]
	 */
	size = [];

	/**
	 * Pointer indirection level
	 * @type {integer}
	 * @example
	 * 	int x = 10; // indirection = 0
	 * 	int *p = &x; // indirection = 1
	 * 	int **p = &p; // indirection = 2
	 */
	indirection = 0;

	memsize; // size of memory object in bytes

	/**
	 * Data type
	 * @type {DATATYPE}
	 * @description Derived from specifiers
	 */
	memtype;

	/**
	 * Region in which the record is allocated
	 * Can be acquired with address through getMemoryRegion
	 * @type {MEMREGION}
	 */
	memregion;

	constructor(){
		
	}

	determineSize(){
		this.memsize = this.size.length > 0 ? this.size.reduce((res, item) => res *= item) * MEMSIZES[this.memtype] : MEMSIZES[this.memtype];
	}
}

/**
 * @class Memsim
 * @description Memory simulation class, handles calls from interpreter
 * @param {WarningSystem} warningSystem
 * @param {integer} [heapSize=1024]
 * @param {integer} [heapPointer=1000]
 * @param {integer} [stackSize=1024]
 * @param {integer} [stackPointer=5000]
 * @param {integer} [dataSize=512]
 * @param {integer} [dataPointer=2000]
 * @param {integer} [bssSize=512]
 * @param {integer} [bssPointer=3000]
 */
class Memsim {

	/**
	 * Warning system passed from interpreter.
	 * @type {WarningSystem}
	 * @private
	 */
	#warningSystem;

	constructor(warningSystem, heapSize = 1024, heapPointer = 1000, stackSize = 1024, stackPointer = 5000, dataSize = 512, dataPointer = 2000, bssSize = 512, bssPointer = 3000){
		this.#warningSystem = warningSystem;
		this.memory = new Map(); // Simulated memory
		this.references = new Map(); // Reference counter
		this.heapPointer = heapPointer;
		this.stackPointer = stackPointer;
		this.dataSegment = dataPointer;
		this.bssSegment = bssPointer;

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
	 * High-level memory function which determines and sets memory to a memory record
	 * @param {MemoryRecord} record
	 * @param {integer|character|double|Array|Object}
	 * @param {MEMREGION} region
	 */
	setRecordValue(record, value, region){
		if (!Object.values(MEMREGION).includes(region)) {
			throw new AppError(`Invalid memory while setting MEMREGION: ${region}`);
		}

		record.memregion = region;

		//TODO struct
		if(record.size.length > 0){ // array
			this.setArrayValue(record, value, region);
		}else if(record.indirection > 0){
			record.address = this.setPointerValue(record, value, region);
		}else { 
			record.address = this.setPrimitiveValue(record, value, region);
		}
	}

	/**
	 * High-level memory function. Allocates and sets memory value depending on type of symbol passed as an argument.
	 * @param {MemoryRecord} record
	 * @param {number} value
	 * @param {MEMREGION} region
	 * @return {integer} Address of allocated memory
	 */
	setPrimitiveValue(record, value, region){
		switch(record.memtype){
			case DATATYPE.bool:
				return this.setBoolValue(value, region, record.address);

			case DATATYPE.char:
				return this.setCharValue(value, region, record.address);

			case DATATYPE.uchar:
				return this.setUCharValue(value, region, record.address);

			case DATATYPE.short:
				return this.setShortValue(value, region, record.address);

			case DATATYPE.ushort:
				return this.setUShortValue(value, region, record.address);

			case DATATYPE.int:
				return this.setIntValue(value, region, record.address);

			case DATATYPE.uint:
				return this.setUIntValue(value, region, record.address);

			case DATATYPE.long:
				return this.setLongValue(value, region, record.address);

			case DATATYPE.ulong:
				return this.setULongValue(value, region, record.address);

			case DATATYPE.longlong:
				return this.setLongLongValue(value, region, record.address);

			case DATATYPE.ulonglong:
				return this.setULongLongValue(value, region, record.address);

			case DATATYPE.float:
				return this.setFloatValue(value, region, record.address);

			case DATATYPE.double:
				return this.setDoubleValue(value, region, record.address);

			case DATATYPE.longdouble:
				return this.setLongDoubleValue(value, region, record.address);

			default:
				throw new AppError(`Invalid DATATYPE while setting value of primitive object: ${record.type}!`);
		}
	}

	/**
	 * High-level memory function. Allocates space for the array and returns the first address. Also sets the Sym.addresses field with allocated addresses.
	 * @param {MemoryRecord} record
	 * @param {Array} value JS array
	 * @param {MEMREGION} region
	 */
	setArrayValue(record, value, region){
		// determine derived type of array
		const memtype = record.memtype;
		const dimension = record.dimension;
		const size = record.size;
		const memsize = record.memsize;

		if(!value){
			record.address = this.#allocRegion(region, memsize);
		}else{
			record.addresses = this.allocArray(value, memtype, region);
			record.address = record.addresses[0];
		}
	}

	/**
	 * Allocates the whole array in recursive manner. This is needed to correctly allocate all dimensions. Returns the first address allocated.
	 * @param {Array} arr
	 * @param {DATATYPE} memtype
	 * @param {MEMREGION} region
	 * @return {integer} address
	 */
	allocArray(arr, memtype, region){
		let addresses = [];

		for(let s = 0; s < arr.length; s++){
			if(Array.isArray(arr[s])){
				const allocatedAddress = this.allocArray(arr[s], memtype, region);
				addresses.push(...allocatedAddress);
			}else{
				const dummySym = { memtype: memtype, address: null, identifier: "array" };
				const allocatedAddress = this.setPrimitiveValue(dummySym, arr[s], region);
				addresses.push(allocatedAddress);
			}
		}

		return addresses;
	}

	/**
	 * Allocates and sets memory for a pointer record. Returns address of the allocated memory.
	 * @note Pointer in my architecture is a 32bit integer... it's just that simple.
	 * @praam {MemoryRecord} record
	 * @param {integer} value
	 * @param {MEMREGION} region
	 * @return {integer} address
	 */
	setPointerValue(record, value, region){
		// pointer is 32 bits
		return this.setIntValue(value, region, record.address);
	}

	/**
	 * High-level memory function which determines and reads memory of a record
	 * @param {MemoryRecord} record
	 * @param {integer|character|double|Array|Object}
	 * @param {MEMREGION} region
	 */
	readRecordValue(record){
		if(!record) throw new AppError("Trying to read value of undefined record");
		if(record.address == undefined || isNaN(record.address)){
			console.error(record);
			throw new RTError(`Cannot read from a record with no address: ${record.address}`);
		}

		//TODO struct
		if(record.size.length > 0){ // array
			return this.readArrayValue(record);
		}else if(record.indirection > 0){
			return this.readPointerValue(record);
		}else {
			return this.readPrimitiveValue(record);
		}
	}

	readPrimitiveValue(record){
		switch(record.memtype){
			case DATATYPE.bool:
			break;

			case DATATYPE.char:
				return this.readCharValue(record.address);

			case DATATYPE.uchar:
				return this.readUCharValue(record.address);

			case DATATYPE.short:
			break;

			case DATATYPE.ushort:
			break;

			case DATATYPE.int:
				return this.readIntValue(record.address);

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

	readArrayValue(record){
		let arr = [];
		
		const size = record.size.reduce((res, item) => res *= item);
		for(let i = 0; i < size; i++){ // this will create flat array
			const addr = record.memregion == MEMREGION.STACK ? record.address - i * MEMSIZES[record.memtype] : record.address + i * MEMSIZES[record.memtype];
			const dummyrecord = { memtype: record.memtype, address: addr };
			const value = this.readPrimitiveValue(dummyrecord);
			arr.push(value);
		}

		if(record.dimension > 1){ // reshape
			arr = this.reshapeArray(arr, record.size);
		}

		return arr;
	}

	readPointerValue(record){
		return this.readIntValue(record.address);
	}

	/******************************
	 *       MEMORY FUNCTIONS     *
	 ******************************
	 * Low-level memory functions *
	 *****************************/

	/**
	 * Sets memory on given address of given size in given region.
	 * @param {integer} address
	 * @parma {integer} size Size in bytes
	 * @param {MEMREGION} region
	 * @param {DataView} view DataView with the actual data. They should be stored as Uint8.
	 */
	#storeMemory(address, size, region, view){
		for (let i = 0; i < size; i++) {
			if(view == undefined || view == null){ // in case of no initializer, set address but no value (not even 0)
				this.memory.set(address + i, { 
					value: undefined, 
					region: region,
				});
			}else{
				this.memory.set(address + i, { 
					value: view.getUint8(i),
					region: region, 
				});
			}

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
	 * Marks memory as unused
	 * @param {integer} address
	 * @param {integer} size Size in bytes
	 * @param {MEMREGION} [region=null]
	 */
	free(address, size, region=null){
		if(!region) region = this.getMemoryRegion(address);
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

	/*****************************
	 * Primitive types functions *
	 *****************************
	 * - all values are stored as little endian using the ArrayBuffer and DataView classes of JS
	 */

	//////////
	// BOOL //
	//////////

	setBoolValue(value, region, address){
		value = this.checkValueOverflow(value, 0, 1, 1, "Boolean");

		const size = CHARSIZE;

		let addr = address;
		if(!addr){
			addr = this.#allocRegion(region, size);
		}

		const memorySpace = new ArrayBuffer(size);
		let view;

		if(value == undefined || value == null){ 
			view = undefined; // uninitialized object
		}else{
			view = new DataView(memorySpace);
			view.setUint8(0, value, region, true);
		}

		this.#storeMemory(addr, size, region, view);

		return addr;
	}

	//////////
	// CHAR //
	//////////

	setCharValue(value, region, address) {
		value = this.checkValueOverflow(value, CHAR_MIN, CHAR_MAX, 0xFF, "Char");

		const size = CHARSIZE;

		let addr = address;
		if(!addr){
			addr = this.#allocRegion(region, size);
		}

		const memorySpace = new ArrayBuffer(size);
		let view;

		if(value == undefined || value == null){ 
			view = undefined; // uninitialized object
		}else{
			view = new DataView(memorySpace);
			view.setUint8(0, value, region, true);
		}

		this.#storeMemory(addr, size, region, view);

		return addr;
	}

	readCharValue(addr){
		const s = CHARSIZE;
		const buffer = new ArrayBuffer(s);
		const view = new DataView(buffer);

		for(let i = 0; i < s; i++){
			if (!this.memory.has(addr + i)) throw new RTError(`Invalid memory access at ${addr + i}`);
			if (this.memory.get(addr + i).value == undefined) return undefined; // handle uninitialized memory
			view.setUint8(i, this.memory.get(addr + i).value);
		}

		return view.getInt8(0); // read the char value (signed 8-bit integer)
	}

	///////////
	// UCHAR //
	///////////

	setUCharValue(value, region, address) {
		value = this.checkValueOverflow(value, 0, UCHAR_MAX, 0xFF, "UChar");

		const size = CHARSIZE;

		let addr = address;
		if(!addr){
			addr = this.#allocRegion(region, size);
		}

		const memorySpace = new ArrayBuffer(size);
		let view;

		if(value == undefined || value == null){ 
			view = undefined; // uninitialized object
		}else{
			view = new DataView(memorySpace);
			view.setUint8(0, value, region, true);
		}

		this.#storeMemory(addr, size, region, view);

		return addr;
	}
	

	readUCharValue(addr){
		const s = CHARSIZE;
		const buffer = new ArrayBuffer(s);
		const view = new DataView(buffer);

		for(let i = 0; i < s; i++){
			if (!this.memory.has(addr + i)) throw new RTError(`Invalid memory access at ${addr + i}`);
			if (this.memory.get(addr + i).value == undefined) return undefined; // handle uninitialized memory
			view.setUint8(i, this.memory.get(addr + i).value);
		}

		return view.getUint8(0); // read the char value (unsigned 8-bit integer)
	}



	/////////
	// INT //
	/////////

	setIntValue(value, region, address){
		value = this.checkValueOverflow(value, INT_MIN, INT_MAX, 0xFFFFFFFF, "Integer");

		const size = INTSIZE;

		let addr = address;
		if(!addr){
			addr = this.#allocRegion(region, size);
		}

		const memorySpace = new ArrayBuffer(size);
		let view;

		if(value == undefined || value == null){ 
			view = undefined; // uninitialized object
		}else{
			view = new DataView(memorySpace);
			view.setInt32(0, value, region, true);
		}

		this.#storeMemory(addr, size, region, view);

		return addr;
	}

	readIntValue(addr) {
		const size = INTSIZE;
		const buffer = new ArrayBuffer(size);
		const view = new DataView(buffer);

		for(let i = 0; i < size; i++){
			if(!this.memory.has(addr + i)) throw new RTError(`Invalid memory access at ${addr + i}`);
			if(this.memory.get(addr + i).value == undefined) return undefined;
			view.setUint8(i, this.memory.get(addr + i).value);
		}

		return view.getInt32(0, true);
	}


	/************************************
	 *          Helper functions        *
	 ***********************************/

	/**
	 * Check if value is over limits
	 * @param {Number} value
	 * @param {Number} min
	 * @param {Number} max
	 * @param {integer} mask
	 * @param {string} type Only for messaging purposes
	 * @param {Object} loc
	 */
	checkValueOverflow(value, min, max, mask, type, loc=undefined){
		if(value < min || value > max){
			this.#warningSystem.add(`${type} overflow, truncating value!`, WTYPE.OVERFLOW, loc); // loc unknown - maybe pass it as argument??
			return value = value & mask; // truncate to n bits
		}

		return value;
	}

	/**
	 * Reshapes a flat array into a multi-dimensional array based on dimensions.
	 * @param {number[]} flatArray The flattened input array (e.g., [1010, 10100, 11110]).
	 * @param {number[]} dimensions The shape of the output array (e.g., [3] or [2, 3]). This is the size member in Symbol
	 * @returns {Array} The multi-dimensional array.
	 */
	reshapeArray(flatArray, dimensions){
		let result = flatArray;
		// build dimensions from innermost to outermost
		for(let i = dimensions.length - 1; i >= 0; i--){
			const dimSize = dimensions[i];
			result = this.chunkArray(result, dimSize);
		}
		return result[0]; // Remove outer nesting
	}

	/**
	 * Splits an array into chunks of size `chunkSize`.
	 * @param {Array} arr 
	 * @param {number} chunkSize Size of each chunk.
	 * @returns {Array[]} Array of chunks.
	 */
	chunkArray(arr, chunkSize){
		const chunks = [];
		for(let i = 0; i < arr.length; i += chunkSize){
			chunks.push(arr.slice(i, i + chunkSize));
		}
		return chunks;
	}

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

	/**
	 * Memory dump of the simulator.
	 * @public
	 */
	printMemory(){
		console.log("Memory Dump:");
		this.memory.forEach((data, addr) => {
			console.log(data.value == undefined ? `${addr}: value=${data.value}, region=${data.region}` : `${addr}: value=${data.value.toString(2)}, region=${data.region}`);
		});
	}
}
