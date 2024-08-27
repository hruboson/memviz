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
 * @description Acts as a visitor for AST structures.
 * @class Semantic
 * @param {Stack} Stack of symbol tables
 */
class Semantic {
	constructor(symtableStack){
		this.symtableStack = symtableStack;
	}


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		if(declarator.kind == DECLTYPE.ID){
			this.symtableStack.peek().insert(declarator.identifier.name, declaration.type.specifiers.toString()); //TODO specifiers
		}
	}

	visitCompoundStatement(stmt){
		this.symtableStack.push(new Symtable("compound statement", "stmt", this.symtableStack.peek()));
	}

	visitFunc(func){
		this.symtableStack.push(new Symtable("function parameters", "param", this.symtableStack.peek()));
	}
}
