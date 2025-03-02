/**
 * @file Memory visualizer
 * @author Ondřej Hruboš
 */

/**
 * @class Memviz
 * @description Main visualization class, handles mostly memory visualization
 * All that is needed is the currently active symbol table, from there traverse the tree to the top and visualize every symbol that has address assigned
 */
class Memviz {
	
	#symtable;
	
	constructor(symtable){
		this.#symtable = symtable;
	}
}
