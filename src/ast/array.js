/**
 * @file Array-related classes
 * @author Ondřej Hruboš
 */

/**
 * @class Arr
 * @param {Object} loc
 */
class Arr extends Construct{ // should this be child of Construct or something else?

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;


	/**
	* @todo add parameters for array
	*/
	//TODO
	constructor(loc){
		super();
		this.loc = loc;
	}

	accept(visitor){
		visitor.visitArr(this);
	}
}
