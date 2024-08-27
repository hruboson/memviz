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
	}else if(obj[function_name].length != parameters.length){
		throw new Error(`Function ${function_name} must have the following parameters: ${parameters}!`)
	}
}

/**
 * Implementation of simple stack
 * @description JS array stack functions don't include peek(), which is what I ultimately need the most.
 * @class {Stack}
 */
class Stack {
	/**
	 * Items in stack
	 * @private
	 * @type {Array}
	 */
	#items;

	constructor(){
		this.#items = [];
	}

	/**
	 * Returns the top-most item in stack
	 * @return {Object}
	 */
	peek(){
		return this.#items[this.#items.length - 1];
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
		if(this.#items.length == 0){ 
			return; 
		}

		const item = this.#items[this.#items.length - 1];
		this.#items.splice(this.#items.length - 1, 1);
		return item;
	}

	/**
	 * Adds item to top of stack
	 */
	push(item){
		this.#items[this.#items.length] = item;
	}
}
