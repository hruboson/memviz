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
	void: 1,
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

	/**
	 * Data type of value being pointed to
	 * @type {DATATYPE}
	 */
	pointsToMemtype;

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

	constructor(warningSystem, heapSize = 3000, heapPointer = 2000, stackSize = 3000, stackPointer = 5000, dataSize = 500, dataPointer = 500, bssSize = 500, bssPointer = 1000){
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
		}else{ 
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

			case DATATYPE.void:{
				return this.setVoidValue(record, value, region);
			}

			default:
				throw new AppError(`Invalid DATATYPE while setting value of primitive object: ${record.memtype}!`);
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
		const memsize = record.memsize;

		record.address = this.#allocRegion(region, memsize);

		// calculate addresses
		for(let i = 0; i < memsize; i += MEMSIZES[memtype]){
			record.addresses.push(record.address + i);
		}

		if(value){
			const flatValue = value.flat(Infinity);
			for(let i = 0; i < flatValue.length; i++){
				const dummySym = { memtype: memtype, address: record.address + i*MEMSIZES[memtype], identifier: "array" };
				const address = this.setPrimitiveValue(dummySym, flatValue[i], region);
			}
		}
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
				return this.readBoolValue(record.address);

			case DATATYPE.char:
				return this.readCharValue(record.address);

			case DATATYPE.uchar:
				return this.readUCharValue(record.address);

			case DATATYPE.short:
				return this.readShortValue(record.address);

			case DATATYPE.ushort:
				return this.readUShortValue(record.address);

			case DATATYPE.int:
				return this.readIntValue(record.address);

			case DATATYPE.uint:
				return this.readUIntValue(record.address);

			case DATATYPE.long:
				return this.readlongValue(record.address);

			case DATATYPE.ulong:
				return this.readULongValue(record.address);

			case DATATYPE.longlong:
				return this.readLongLongValue(record.address);

			case DATATYPE.ulonglong:
				return this.readULongLongValue(record.address);

			case DATATYPE.float:
				return this.readFloatValue(record.address);

			case DATATYPE.double:
				return this.readDoubleValue(record.address);

			case DATATYPE.longdouble:
				return this.readLongDoubleValue(record.address);

			case DATATYPE.void:
				return this.readVoidValue(record.memsize, record.address);
		}

	}

	readArrayValue(record){
		let arr = [];
		
		const noElements = record.size.reduce((res, item) => res *= item);

		// here the record.addresses could be used
		for(let i = 0; i < noElements; i++){
			const addr = record.address + i * MEMSIZES[record.memtype];
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
	 * Frees (deletes) memory from memory map
	 * @param {integer} address
	 * @param {integer} size Size in bytes
	 * @param {MEMREGION} [region=null]
	 */
	free(address, size, region=null){
		if(address == undefined || address == null) throw new AppError(`Trying to free undefined address with size ${size} from ${region}`);
		if(!region) region = this.getMemoryRegion(address);

		// validate the range is fully within the region
		for(let i = 0; i < size; i++){
			const currentAddr = address + i;

			// check if address exists in memory
			if(!this.memory.has(currentAddr)){
				throw new RTError(`Invalid memory address ${currentAddr} in free()`);
			}

			// verify region consistency
			// I curently don't change memory address when changing region of MemoryRecord
			// TODO
			/*const memRegion = this.memory.get(currentAddr).region;
			if(memRegion != region){
				throw new RTError(`Memory region mismatch at ${currentAddr} (expected ${region}, found ${memRegion})`);
			}*/
		}

		// Mark memory as freed
		for(let i = 0; i < size; i++){
			const currentAddr = address + i;
			this.memory.delete(currentAddr);
			//this.references.delete(currentAddr);
		}

		// move memory pointer
		if(region == MEMREGION.STACK){
			if (address == this.stackPointer){
				this.stackPointer += size;
			}
			// Note: We don't handle "holes" in stack memory - that would require more complex management
		}
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
	// VOID // (for void pointers)
	//////////

	setVoidValue(record, value, region){
		const bytes = [];
		for (let i = 0; i < record.memsize; i++) {
			if(value == undefined || value == null){
				bytes.push(undefined);
			}else{
				bytes.push((value >> (i * 8)) & 0xFF);
			}
		}

		let firstAddress;
		for(let i = 0; i < record.memsize; i++){
			const newAddress = this.setUCharValue(bytes[i], region, record.address+i);
			firstAddress = firstAddress ? firstAddress : newAddress;
		}
		return firstAddress;
	}

	readVoidValue(size, address){
		const bytes = [];
		for(let i = 0; i < size; i++){
			bytes.push(this.readUCharValue(address+i));
			if(bytes[i] == undefined) return undefined;
		}

		let number = 0;
		for(let i = 0; i < size; i++){
			number |= bytes[i] << (i*8);
		}
		return number;
	}

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

	//////////
	// UINT //
	//////////
	
	setUIntValue(value, region, address){
		value = this.checkValueOverflow(value, 0, UINT_MAX, 0xFFFFFFFF, "Integer");

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
			view.setUint32(0, value, region, true);
		}

		this.#storeMemory(addr, size, region, view);

		return addr;
	}

	readUIntValue(addr) {
		const size = INTSIZE;
		const buffer = new ArrayBuffer(size);
		const view = new DataView(buffer);

		for(let i = 0; i < size; i++){
			if(!this.memory.has(addr + i)) throw new RTError(`Invalid memory access at ${addr + i}`);
			if(this.memory.get(addr + i).value == undefined) return undefined;
			view.setUint8(i, this.memory.get(addr + i).value);
		}

		return view.getUint32(0, true);
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
		if (this.memory.size === 0) return "All memory freed";

		// alignment measurements
		const addrWidth = Math.max(5, ...Array.from(this.memory.keys()).map(addr => addr.toString().length));
		const hexAddrWidth = 6;  // "0x" + 4 hex digits
		const valueWidth = 8;    // 8-bit binary
		const hexValueWidth = 4; // hex value (0xFF)
		const regionWidth = 10;  // memory region name

		// calculate max spacing
		const spaceForAddr = addrWidth - 7; // space for address column
		const spaceForHexAddr = hexAddrWidth - 6; // space for hex address column
		const spaceForBinary = valueWidth - 8; // space for binary column
		const spaceForHexValue = hexValueWidth - 4; // space for hex value column
		const spaceForRegion = regionWidth - 10; // space for region column

		// header
		let dump = `Addr | Hex Addr | Binary   | Hex  | Region\n`;
		dump += "-".repeat(addrWidth + hexAddrWidth + valueWidth + hexValueWidth + regionWidth + 13) + "\n";

		this.memory.forEach((data, addr) => {
			let hexAddr = "0x" + addr.toString(16).toUpperCase().padStart(4, '0');
			let binValue = data.value !== undefined ? data.value.toString(2).padStart(valueWidth, '0') : " ".repeat(valueWidth);
			let hexValue = data.value !== undefined ? "0x" + data.value.toString(16).toUpperCase().padStart(2, '0') : " ".repeat(hexValueWidth);
			let region = data.region.toString().padEnd(regionWidth);

			// add the row with padding
			dump += addr.toString().padEnd(addrWidth, ' ') + " | " + hexAddr + " | " + binValue + " | " + hexValue + " | " + region + "\n";
		});

		return dump;
	}
}
