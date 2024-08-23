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
