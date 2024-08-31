/**
 * @file Struct and union-related classes
 * @author Ondřej Hruboš
 */

/**
* @class Struct
* @param {Array.<Declaration>|null} declarations Struct's body (declarations inside)
* @param {Tagname|Unnamed|null} tagname Tagname
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

	constructor(declarations, tagname){
		this.declarations = declarations;
		this.tagname = tagname;
	}
}

/**
* @class Union
* @param {Array.<Declaration>|null} declarations Union's body (declarations inside)
* @param {Tagname|Unnamed|null} tagname
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

	constructor(declarations, tagname){
		this.declarations = declarations;
		this.tagname = tagname;
	}
}
