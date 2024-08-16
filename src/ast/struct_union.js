/**
 * Struct and union-related classes
 */

/**
* @class Struct
* @param {Array.<Declaration>|null} declarations Struct's body (declarations inside)
* @param {Identifier|null} tagname Tagname
*/
class Struct {
	constructor(declarations, tagname){
		this.declarations = declarations;
		this.tagname = tagname;
	}
}

/**
* @class Union
* @param {Array.<Declaration>|null} declarations Union's body (declarations inside)
* @param {Identifier|null} tagname Tagname
*/
class Union {
	constructor(declarations, tagname){
		this.declarations = declarations;
		this.tagname = tagname;
	}
}
