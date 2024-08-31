/**
 * @file Pointer class
 * @author Ondřej Hruboš
 */

/**
 * @class Pointer
 * @param {Pointer} child
 * @param {Array.<string>} qualifiers
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

	constructor(child, qualifiers){
		this.child = child;
		this.qualifiers = qualifiers;
	}
}
