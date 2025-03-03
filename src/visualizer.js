/**
 * @file Memory visualizer
 * @author Ondřej Hruboš
 */

/**
 * @class Memviz
 * @description Main visualization class, handles mostly memory visualization
 * Basically visualizing the call stack and each of its stack frames (symbol tables)
 */
class Memviz {
	
	#callStack;
	
	constructor(callStack){
		this.#callStack = callStack;
	}
}
