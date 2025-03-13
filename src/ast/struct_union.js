/**
 * @file Struct and union-related classes
 * @author Ondřej Hruboš
 */

/**
* @class Struct
* @param {Array.<Declaration>|null} declarations Struct's body (declarations inside)
* @param {Tagname|Unnamed|null} tagname Tagname
* @param {Object} loc
*/
class Struct {

	/**
	 * Struct's body
	 * @type {Array.<Declaration>}
	 */
	declarations;

	/**
	 * Struct's tagname (or unnamed in case of anonymous structure)
	 * @type {Tagname|Unnamed}
	 */
	tagname;

	/**
	 * Line of code
	 * @type {Object}
	 */
	loc;

	constructor(declarations, tagname, loc){
		this.declarations = declarations;
		this.tagname = tagname;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitStruct(this);
	}
}

/**
* @class Union
* @param {Array.<Declaration>|null} declarations Union's body (declarations inside)
* @param {Tagname|Unnamed|null} tagname
* @param {Object} loc
*/
class Union {

	/**
	 * Struct's body
	 * @type {Array.<Declaration>}
	 */
	declarations;

	/**
	 * Union's tagname (or unnamed in case of anonymous union)
	 * @type {Tagname|Unnamed}
	 */
	tagname;

	constructor(declarations, tagname, loc){
		this.declarations = declarations;
		this.tagname = tagname;
		this.loc = loc;
	}

	accept(visitor){
		return visitor.visitUnion(this);
	}
}
