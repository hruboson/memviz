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

	firstPhase(ast){
		for(const construct of ast){
			construct.accept(this);
		}
	}

	secondPhase(){
		const gSymtable = this.symtableStack.peek();

		for (const [name, symbol] of gSymtable.objects) {
			if (symbol.isFunction && !symbol.initialized) {
				throw new SError(`function '${name}' declared but never defined`, symbol.astPtr.loc);
			}
		}
	}

	/**
	 * Adds symbol to current scope
	 * @param {SYMTYPE} type
	 * @param {Declarator} declarator
	 * @param {Initializer} initializer
	 * @param {Array.<string>} specifiers
	 * @param {Object} astPtr Pointer to structure (Construct) in AST
	 *
	 * @return {string|null} Symbol name, null in case of anonymous
	 */
	addSymbol(type, declarator, initializer, specifiers, astPtr=null){
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
					currSymtable.insert(namespace, declMainType, initialized, declChild.identifier.name, specifiers.toString(), declPtr, dimension, parameters, isFunction, astPtr);
					symbolName = declChild.identifier.name;
				}
				if(declChild.kind == DECLTYPE.FNC){
					isFunction = true;
					parameters = [];
					for(const param of declarator.fnc.parameters){
						if(param.type.specifiers.includes("void")) continue; // don't add void parameter
						parameters.push(param);
					}
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

		if(isclass(initializer, "Initializer")){
			if(isFunction){
				//? this might be completely wrong check this! Yes it is wrong, it could be function that returns pointer (honestly really check this xd)
				if(!declPtr){
					throw new SError(`Function ${symbolName} initialized like a variable`, initializer.loc);
				}	
			}
		}

		return symbolName;
	}


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		this.addSymbol(SYMTYPE.OBJ, declarator, initializer, declaration.type.specifiers, declaration);
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
		const fncName = this.addSymbol(SYMTYPE.FNC, fnc.declarator, fnc.body, fnc.returnType, fnc); // adds function to global symbol table
		this.symtableStack.push(new Symtable(fncName, "function params", this.symtableStack.peek()));

		for(const param of fnc.declarator.fnc.parameters){
			if(param.type.specifiers.includes("void")) continue; // dont add void as parameter to symtable: int f(void){}

			this.addSymbol(SYMTYPE.OBJ, param.declarator, false, param.type.specifiers, param);
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
		var fncName;
		var currSymtable;
		var fncSym;

		// https://en.cppreference.com/w/c/language/operator_other#Function_call
		// so I should first implicitly convert the expression (lvalue) and check if it is pointer-to-function type 
		// 	-->	https://en.cppreference.com/w/c/language/conversion#Lvalue_conversions
		if(isclass(fncCall.expr, "Identifier")){
			fncName = fncCall.expr.name;
			currSymtable = this.symtableStack.peek();
			fncSym = currSymtable.resolve(fncName);
		}else if(isclass(fncCall.expr, "FncCallExpr")){
			fncName = fncCall.expr.expr.name;
			currSymtable = this.symtableStack.peek();
			fncSym = currSymtable.resolve(fncName);
		}else if(isclass(fncCall.expr, "Array")){
			console.info("Array expr call");
			return;
		}else{
			console.warning("TODO SEMANTICS FUNCTION CALL");
		}


		if(!fncSym){
			throw new SError(`undeclared function ${fncName}`, fncCall.loc);
		}

		if(!fncSym.isFunction){
			throw new SError(`called object ${fncName} is not a function or function pointer`, fncCall.loc);
		}

		if(fncSym.isNative){
			// actually maybe do small typechecking (only first parameter or something like that), the same way I do calling in interpreter
			// fncSym.accept(this); // add visitPrintF function and other native functions visitor functions
			return;
		}

		if(fncCall.arguments.length > fncSym.parameters.length){
			throw new SError(`too many arguments to function ${fncName}`, fncCall.loc);
		}else if(fncCall.arguments.length < fncSym.parameters.length){
			throw new SError(`too few arguments to function ${fncName}`, fncCall.loc);
		}

		// check types of parameters
		for(let [arg, param] of fncCall.arguments.map((el, i) => [el, fncSym.parameters])){
			this.typeCheck(this.getParameterType(param), arg);
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
			var symtable = this.symtableStack.peek();
			var funcName = symtable.scopeInfo.name;

			while(symtable.scopeInfo.type != "body"){ //TODO "body" (the string) should be enum same as "function params"
				symtable = symtable.parent;
				funcName = symtable.scopeInfo.name;
			}

			const funcSymbol = this.symtableStack.peek().resolve(funcName);

			if(funcSymbol.specifiers == "void" && funcSymbol.pointer == false && ret.expr != null){
				this.warningSystem.add(`return with a value, in function returning void`, WTYPE.RETURNTYPE, ret.loc);
			}

			if(!funcSymbol.specifiers.includes("void")){
				for(const exp of ret.expr){ // expr is always an array
					exp.accept(this);
				}
			}

			/*if(ret.expr instanceof Identifier){//! just a showcase, remove later
				this.warningSystem.add(`return with a value in function returning void`, WTYPE.RETURNTYPE, ret.loc);
			}*/


		}catch(e){
			console.error(e);
		}
	}

	/**********************
	 *  HELPER FUNCTIONS  *
	 *********************/

	/**
	 * Adds built-in (native) functions to the global symbol table.
	 * Currently, only `printf` is added, but more functions can be implemented in `nativefuncs.js`.
	 * @todo Add more built-in functions
	 *
	 * @see {@link nativefuncs.js}
	 * @param {Symtable} symtableGlobal - The global symbol table where native functions are registered.
	 */
	addNativeFunctions(symtableGlobal){
		symtableGlobal.insert(
			NAMESPACE.ORDS,
			SYMTYPE.FNC,
			true,                      // initialized
			"printf",                  // function name
			["int"],                   // return type (C's printf returns int)
			false,                     // not a pointer
			0,                         // not an array
			[new Declarator(DECLTYPE.ID, null, {name: "formatstr"})],
			true,                      // isFunction
			new NATIVE_printf(),       // no AST, built-in function pointer
			true                       // isNative
		);
	}

	/**
	 * Returns the type of declared parameter
	 * @param {Declarator} declarator
	 * @return {string} specifiers
	 */
	getParameterType(declarator){
		// not sure but for params it should not be longer than 1
		return declarator[0].type.specifiers;
	}

	/**
	 * Checks if the declared type matches the inferred type of the expression.
	 * @param {Array<string>} specifiers The list of type specifiers from the declaration
	 * @param {Object} expression The expression to be type-checked
	 * @throws {Error} Throws an error if there is a type mismatch
	 */
	typeCheck(specifiers, expression) {
		// Determine the expression type
		let declType = this.normalizeType(specifiers);
		let exprType = this.inferType(expression);

		// Check if the types match
		if (declType != exprType) {
			throw new SError(`Type mismatch: expected ${declType}, but got ${exprType}`, expression.loc);
		}
	}

	/**
	 * Returns normalized specifier list (main type will be first)
	 * @param {Array<string>} specifiers
	 * @return {Arr}
	 */
	normalizeType(specifiers) {
		// omit signed (as it is default)
		let filteredSpecifiers = specifiers.includes("signed")
        ? specifiers.filter(s => s != "signed")
        : specifiers;

		// sort specifiers for consistency
		return filteredSpecifiers.sort().join(" ");
	}

	/**
	 * Infers the type of an expression.
	 * @param {Object} expression The expression object to analyze
	 * @returns {string} The inferred C type of the expression
	 * @throws {Error} Throws an error if the expression type is unknown
	 */
	inferType(expression) {
		if (expression.cType == "CExpr") {
			switch (expression.type) {
				case "s_literal": return "char*";
				case "i_constant":
					if (expression.value.endsWith("LL")) return "int long long";  // Long long int
					if (expression.value.endsWith("L")) return "int long";        // Long int
					return "int";  // Default to int
				case "f_constant":
					if (expression.value.endsWith("f") || expression.value.endsWith("F")) return "float";
					return "double";  // Default to double
				default:
					throw new AppError(`Unknown expression type: ${expression.type}`);
			}
		}

		throw new AppError(`Invalid expression structure`);
	}
}
