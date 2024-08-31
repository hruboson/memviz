/**
 * @file Semantic analyzer
 * @author Ondřej Hruboš
 */

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

	/**
	 * Adds symbol to current scope
	 * @param {Declarator} declarator
	 * @param {Array.<string>} specifiers
	 * @param {SYMTYPE} type
	 * @param {Initializer} [initializer=null]
	 * @return {string|null} Symbol name, null in case of anonymous
	 */
	addSymbol(declarator, specifiers, type, initializer=null){		
		var declChild = declarator;

		// ascend the declarator list and extract all information from it
		var declMainType = type;
		var declPtr = false;
		var symbolName = ""; // return value

		do{
			if(declChild.kind == DECLTYPE.ID){
				try{
					this.symtableStack.peek().insert(declChild.identifier.name, declMainType, specifiers.toString(), declPtr);
				}catch(e){
					throw new SError(e.details, declarator.loc);
				}
				symbolName = declChild.identifier.name;
			}
			if(declChild.kind == DECLTYPE.FNC){
				declMainType = SYMTYPE.FNC;
			}
			if(declChild.kind == DECLTYPE.PTR){
				declPtr = true;
			}
			if(declChild.kind == DECLTYPE.ARR){
				
			}
			if(declChild.kind == DECLTYPE.STRUCT){
				declMainType == SYMTYPE.STRUCT;
			}
			if(declChild.kind == DECLTYPE.NESTED){
				// continue down the chain
			}
			declChild = declChild.child;
		}while(declChild != null);

		if(initializer){
			this.symtableStack.peek().lookup(symbolName).initialized = true;
		}

		return symbolName;
	}


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		this.addSymbol(declarator, declaration.type.specifiers, SYMTYPE.VAR, initializer);
	}

	visitDeclarator(declarator){
	}

	visitInitializer(initializer){
		if(initializer.kind == INITTYPE.EXPR){
			
		}
	}

	visitCStmt(stmt){
		this.symtableStack.push(new Symtable("compound statement", "stmt", this.symtableStack.peek()));
	}

	visitFunc(func){
		const funcName = this.addSymbol(func.declarator, func.returnType, SYMTYPE.FNC); // adds function to global symbol table
		this.symtableStack.push(new Symtable(funcName, "function params", this.symtableStack.peek()));

		for(const param of func.declarator.fnc.parameters){
			this.addSymbol(param.declarator, param.type.specifiers, SYMTYPE.PARAM);
		}
	}
}
