/**
 * @file Memory simulator
 * @author Ondřej Hruboš
 */

// helper constants
const CHARSIZE = 1;
const INTSIZE = 4;

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const UINT_MAX = 4294967295;

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
		this.addressPointer = 1000; // Heap starts at 1000
		this.stackPointer = 5000; // Stack starts at 5000 and grows downward
		this.dataSegment = 2000;  // Initialized global variables
		this.bssSegment = 3000;   // Uninitialized global variables

		this.heapSize = heapSize;
		this.stackSize = stackSize;
		this.dataSize = dataSize;
		this.bssSize = bssSize;
	}

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
	 * Increase reference count when a pointer points to an address
	 * @param {integer} address
	*/
	addReference(address) {
		if(this.references.has(address)){
			this.references.set(address, this.references.get(address) + 1);
		}else{
			throw new Error(`Invalid reference to address ${address}`);
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

	stackAlloc(size){
		this.stackPointer -= size;
		this.#storeMemory(this.stackPointer, size, 'stack');
		return this.stackPointer; // return base address
	}

	setIntValue(address, value, loc){
		if (value < INT_MIN || value > INT_MAX) {
			this.#warningSystem.add(`Integer overflow at memory address 0x${address.toString(16)}, truncating value!`, WTYPE.OVERFLOW, loc); // loc unknown - maybe pass it as argument??
			value = value & 0xFFFFFFFF; // truncate to 32 bits
		}
		console.info(value);

		const s = INTSIZE;
		const memorySpace = new ArrayBuffer(s);
		const view = new DataView(memorySpace);
		view.setInt32(0, value, true); // little-endian!

		for(let i = 0; i < s; i++){ // alloc every byte separately
			this.memory.set(address + i, { value: view.getUint8(i), region: "heap" });
		}
	}

	getIntValue(address) {
		const s = INTSIZE;
		const buffer = new ArrayBuffer(s);
		const view = new DataView(buffer);

		for(let i = 0; i < s; i++){
			if(!this.memory.has(address + i)) throw new RTError(`Invalid memory access at ${address + i}`);
			view.setUint8(i, this.memory.get(address + i).value);
		}

		return view.getInt32(0, true);
	}


	/************************************
	 *          Helper functions        *
	 ***********************************/

	// Print memory for debugging
	printMemory(){
		console.log("Memory Dump:");
		this.memory.forEach((data, address) => {
			console.log(`${address}: value=${data.value.toString(2)}, region=${data.region}`);
		});
	}
}
