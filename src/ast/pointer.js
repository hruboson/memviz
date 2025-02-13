/**
 * @file Pointer class
 * @author Ondřej Hruboš
 */

/**
 * @class Pointer
 * @param {Pointer} child
 * @param {Array.<string>} qualifiers
 * @param {Object} loc
 */
class Pointer {
	
	/**
	 * Child pointer (or null in case of leaf pointer)
	 * @type {Pointer}
	 */
	child;

	/**
	 * Qualifiers of pointer (const, restrict, volatile)
	 * @type {Array.<string>}
	 */
	qualifiers;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(child, qualifiers, loc){
		this.child = child;
		this.qualifiers = qualifiers;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitPtr(this);
	}
}
