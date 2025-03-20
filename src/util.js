/**
 * @file Small util library with neat functions :-)
 * @author Ondřej Hruboš
 */

/**
 * Declares class as abstract. Call this function in class constructor to get the effect.
 * @param {Object} obj Instance of class (it will always be `this`)
 * @param {string} name Name of class to declare abstract
 */
function abstract(obj, name){ // passing name makes the children not abstract
	if(obj.constructor == name) { // abstract hack
		throw new Error(`Class of ${obj.constructor.name} cannot be instantiated (abstract class)!`);
	};
}

/**
 * Declares a function a class must implement. Call this function in class constructor to get the effect.
 * @param {Object} obj Instance of class (it will always be `this`)
 * @param {string} function_name Name of the function the class will have to implement
 * @param {array} [parameters=[]] Optional parameters for function
 */
function intfc(obj, function_name, parameters = []){
	if(typeof obj[function_name] != "function"){
		throw new Error(`Class ${obj.constructor.name} must implement function ${function_name}!`);
	}else if(obj[function_name].length < parameters.length){
		throw new Error(`Function ${function_name} must have the following parameters: ${parameters}!`);
	}
}

/**
 * Implementation of simple stack
 * @description JS array stack functions don't include peek(), which is what I ultimately need the most.
 * @class Stack
 */
class Stack {
	/**
	 * Items in stack
	 * @private
	 * @type {Array}
	 */
	#items;

	constructor(){
		this.items = [];
	}

	/**
	 * Returns the top-most item in stack
	 * @return {Object}
	 */
	peek(){
		return this.items[this.items.length - 1];
	}

	/**
	 * Alias for peek()
	 * @return {Object}
	 */
	top(){
		return this.peek();
	}

	/**
	 * Removes the top-most item in stack and returns it
	 * @return {Object}
	 */
	pop(){
		if(this.items.length == 0){ 
			return; 
		}

		const item = this.items[this.items.length - 1];
		this.items.splice(this.items.length - 1, 1);
		return item;
	}

	/**
	 * Adds item to top of stack
	 */
	push(item){
		this.items[this.items.length] = item;
	}

	[Symbol.iterator](){
		let index = 0; // start from bottom
		return {
			next: () => {
				if (index < this.items.length) {
					return { value: this.items[index++], done: false };
				} else {
					return { done: true };
				}
			}
		};
	}
}

/**
 * Check the class of object against a string (name)
 * @param {Object} obj Object to check
 * @param {string} str Name of class to check against
 * @return {boolean}
 */
function isclass(obj, str){
	if(obj == null) return false;
	return obj.constructor.name == str;
}

/**
 * Get the name of class of the object
 * @param {Object} obj Object to check
 * @return {string}
 */
function getclass(obj){
	if(obj == null) return "null";
	return obj.constructor.name;
}

/**
 * Zips any number of iterables. It will always zip() the largest Iterable returning undefined for shorter arrays.
 * @param  {...Iterable<any>} iterables
 * @see {https://stackoverflow.com/questions/22015684/zip-arrays-in-javascript#72221748}
 * @example 
 * 	
 * 	const a = zip(this.#currSymtable.objects, args); 
 * 	console.log(...a);
 *
 */
function* zip(...iterables){
	// get the iterator of for each iterables
	const iters = [...iterables].map((iterable) => iterable[Symbol.iterator]());
	let next = iters.map((iter) => iter.next().value);
	// as long as any of the iterables returns something, yield a value (zip longest)
	while(anyOf(next)){
		yield next;
		next = iters.map((iter) => iter.next().value);
	}

	function anyOf(arr){
		return arr.some(v => v !== undefined);
	}
}

/**
 * Returns size of all dimension of an array
 * @description Only works on array whose dimensions are the same size
 * @param {Array} arr
 * @return {Array} sizes of dimensions
 * @example
 * 	[[1, 2], [3, 4], [5, 6]] -> returns [3, 2]
 */
function getArraySizes(jsArray){
    if(!Array.isArray(jsArray)) return [];

    let sizes = [];
    let queue = [{ array: jsArray, depth: 0 }];

    while(queue.length > 0){
        let { array, depth } = queue.shift(); // dequeue an element

        if(!Array.isArray(array)) continue; // skip non-array values

        if(sizes.length <= depth){
            sizes[depth] = array.length;
        }

        // Enqueue the next level arrays
        for(let i = 0; i < array.length; i++){
            queue.push({ array: array[i], depth: depth + 1 });
        }
    }

    return sizes;
}

/**
 * Equivalent to std::pair from C++
 * @param {Object} first
 * @param {Object} second
 */
class Pair {
	constructor(first, second){
		this.first = first;
		this.second = second;
	}

	swap(){
		const tmp = this.first;
		this.first = this.second;
		this.second = tmp;
	}
}
