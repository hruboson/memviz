/**
 * @file Semantic analyzer
 * @author Ondřej Hruboš
 */

/**
 * Semantic analyzer for interpreter
 * @description Acts as a visitor for AST structures.
 * @class Semantic
 * @param {Stack} Stack of symbol tables (reference to Interpreter symtableStack)
 * @param {WarningSystem}
 */
class Semantic {
	constructor(symtableStack, warningSystem){
		this.symtableStack = symtableStack;
		this.warningSystem = warningSystem;
	}

	/**
	 * Adds symbol to current scope
	 * @param {Declarator} declarator
	 * @param {Array.<string>} specifiers
	 * @param {SYMTYPE} type
	 * @param {Array.<Declarator>} [parameters=null]
	 * @return {string|null} Symbol name, null in case of anonymous
	 */
	addSymbol(type, declarator, initializer, specifiers){		
		var declChild = declarator;

		// ascend the declarator list and extract all information from it
		var declMainType = type;
		var declPtr = false;
		var symbolName = ""; // return value
		var dimension = 0;
		var parameters = null;
		var isFunction = false;
		var namespace = NAMESPACE.ORDS;
		var initialized = initializer ? true : false;

		do{
			try {
				if(declChild.kind == DECLTYPE.ID){
					const currSymtable = this.symtableStack.peek();
					currSymtable.insert(namespace, declMainType, initialized, declChild.identifier.name, specifiers.toString(), declPtr, dimension, parameters, isFunction);
					symbolName = declChild.identifier.name;
				}
				if(declChild.kind == DECLTYPE.FNC){
					isFunction = true;
					parameters = declarator.fnc.parameters;
				}
				if(declChild.kind == DECLTYPE.PTR){
					declPtr = true;
				}
				if(declChild.kind == DECLTYPE.ARR){
					dimension += 1;
				}
				if(declChild.kind == DECLTYPE.STRUCT){
					namespace = NAMESPACE.TAGS;
					declMainType == SYMTYPE.STRUCT;
				}
				if(declChild.kind == DECLTYPE.NESTED){
					// continue down the chain
				}
				declChild = declChild.child;
			} catch(e){
				throw new SError(e.details, declarator.loc);
			}
		}while(declChild != null);

		return symbolName;
	}


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		this.addSymbol(SYMTYPE.OBJ, declarator, initializer, declaration.type.specifiers);
	}

	visitDeclarator(declarator){
	}

	visitInitializer(initializer){
		if(initializer.kind == INITTYPE.EXPR){
			
		}
	}

	visitCStmt(stmt){
		this.symtableStack.push(new Symtable("compound statement", "stmt", this.symtableStack.peek()));

		for(const construct of stmt.sequence){
			construct.accept(this);
		}

		this.symtableStack.pop();
	}

	visitFnc(fnc){
		const fncName = this.addSymbol(SYMTYPE.FNC, fnc.declarator, fnc.body, fnc.returnType); // adds function to global symbol table
		this.symtableStack.push(new Symtable(fncName, "function params", this.symtableStack.peek()));

		for(const param of fnc.declarator.fnc.parameters){
			this.addSymbol(SYMTYPE.OBJ, param.declarator, false, param.type.specifiers);
		}

		this.symtableStack.push(new Symtable(fncName, "body", this.symtableStack.peek()));
		for(const construct of fnc.body.sequence){
			construct.accept(this);
		}
		
		this.symtableStack.pop();
		this.symtableStack.pop();
	}

	visitTypedef(typedef){
		this.addSymbol(SYMTYPE.TYPEDEF, typedef.declarator, false, typedef.type.specifiers);
	}

	visitFncCallExpr(fncCall){
		//TODO https://en.cppreference.com/w/c/language/operator_other#Function_call
		// for now just go with identifier
		if(fncCall.expr instanceof Identifier){
			const fncName = fncCall.expr.name;
			const currSymtable = this.symtableStack.peek();
			const fncSym = currSymtable.resolve(fncName);

			if(!fncSym){
				throw new SError(`undeclared function ${fncName}`, fncCall.loc);
			}

			if(!fncSym.isFunction){
				throw new SError(`called object ${fncName} is not a function or function pointer`, fncCall.loc);
			}

			if(fncCall.arguments.length > fncSym.parameters.length){
				throw new SError(`too many arguments to function ${fncName}`, fncCall.loc);
			}else if(fncCall.arguments.length < fncSym.parameters.length){
				throw new SError(`too few arguments to function ${fncName}`, fncCall.loc);
			}
		}else{
			return "TODO";
		}
	}

	visitBAssignExpr(expr){
		try{
			expr.left.accept(this);
			expr.right.accept(this);
		}catch(e){
			throw e;
		}
	}

	visitBArithExpr(expr){
		try{
			expr.left.accept(this);
			expr.right.accept(this);
		}catch(e){
			throw e;
		}
	}

	visitUExpr(expr){

	}

	visitCExpr(expr){

	}

	visitIdentifier(identifier){
		try{
			const name = this.symtableStack.peek().resolve(identifier.name);
		}catch(e){
			throw new SError(e.details, identifier.loc);
		}
	}

	visitReturn(ret){
		try{
			ret.expr.accept(this);

			if(ret.expr instanceof Identifier){//! just a showcase, remove later
				this.warningSystem.add(`return with a value in function returning void`, WTYPE.RETURNTYPE, ret.loc);
			}
		}catch(e){
			console.log(e);
		}
	}
}
