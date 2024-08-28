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
 * @param {Stack} Stack of symbol tables (reference to Interpreter symtableStack)
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

		// placeholder, probably replace with accept to visitDeclarator
		if(declarator.kind == DECLTYPE.ID){
			this.symtableStack.peek().insert(declarator.identifier.name, declaration.type.specifiers.toString()); //TODO specifiers
		}
	}

	visitDeclarator(declarator){
		if(declarator.kind == DECLTYPE.FNC){
			for(const param of declarator.fnc.parameters){
				this.symtableStack.peek().insert(param.declarator.identifier.name, param.type.specifiers.toString());	
			}
		}
	}

	visitCStmt(stmt){
		this.symtableStack.push(new Symtable("compound statement", "stmt", this.symtableStack.peek()));
	}

	visitFunc(func){
		this.symtableStack.push(new Symtable("function parameters", "param", this.symtableStack.peek()));
		func.declarator.accept(this);
	}
}
