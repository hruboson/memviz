/**
 * Semantic Error
 * @class SError
 */
class SError extends Error {
	constructor(e) {
		super(e);
		this.name = "Semantic analysis error";
	}
}

/**
 * Semantic analyzer for interpreter
 * @description Acts as a visitor for ast structures.
 * @class Semantic
 * @param {Symtable} Symbol table
 */
class Semantic {
	constructor(symtable){
		this.symtable = symtable;
	}


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		if(declarator.kind == DECLTYPE.ID){
			this.symtable.insert(declarator.identifier.name, declaration.type.specifiers[0]); //TODO specifiers
		}
	}
}
