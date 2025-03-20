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
		var size = [];
		var parameters = null;
		var isFunction = false;
		var namespace = NAMESPACE.ORDS;
		var initialized = initializer ? true : false;



		if(isclass(initializer, "Initializer")){
			if(isFunction){
				//? this might be completely wrong check this! Yes it is wrong, it could be function that returns pointer (honestly really check this xd)
				if(!declPtr){
					throw new SError(`Function ${symbolName} initialized like a variable`, initializer.loc);
				}
			}
		}

		do{
			try {
				if(declChild.kind == DECLTYPE.ID){
					//TODO refactor this, its ugly as heck
					if(isclass(initializer, "Initializer") && dimension > 0 && size.length < 1){ // is an array and size was not determined from declarator (int[3] = ...);
						const jsArray = initializer.toJSArray(this);
						size = getArraySizes(jsArray);
					}

					const currSymtable = this.symtableStack.peek();
					currSymtable.insert(namespace, declMainType, initialized, declChild.identifier.name, specifiers, declPtr, dimension, size, parameters, isFunction, astPtr);
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
					if(declChild.arrSizeExp){
						const exprValue = declChild.arrSizeExp.accept(this);
						if(exprValue < 0){
							throw new SError(`Invalid array size`, declarator.loc);
						}

						size[dimension] = exprValue; // should always be constant expression
					}
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
				throw e;
			}
		}while(declChild != null);

		return symbolName;
	}

	/**
	 * Pushes new scope onto stack. Attaches the scope to AST node.
	 * @param {Symtable} symtable
	 * @param {Construct} astPtr
	 */
	newScope(symtable, astPtr){
		this.symtableStack.push(symtable);
		astPtr.attachSymtable(symtable);
	}

	/**
	 * Pops the top-most symbol table from symtable stack
	 */
	closeScope(){
		this.symtableStack.pop();
	}


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitArr(arr){

	}

	visitBAssignExpr(expr){
		let lval;
		let rval;

		if(expr.left.length){
			for(const subexpr of expr.left){
				lval = subexpr.accept(this);
			}
		}else{
			lval = expr.left.accept(this);
		}

		if(expr.right.length){
			for(const subexpr of expr.right){
				rval = subexpr.accept(this);
			}
		}else{
			rval = expr.right.accept(this);
		}
	}

	visitBArithExpr(expr){
		let lval;
		let rval;

		if(expr.left.length){
			for(const subexpr of expr.left){
				lval = subexpr.accept(this);
			}
		}else{
			lval = expr.left.accept(this);
		}

		if(expr.right.length){
			for(const subexpr of expr.right){
				rval = subexpr.accept(this);
			}
		}else{
			rval = expr.right.accept(this);
		}
	}

    visitBCompExpr(expr){

	}

    visitBLogicExpr(expr){

	}

	visitBreak(br){

	}

    visitCastExpr(expr){

	}

	visitCExpr(expr){
		switch(expr.type){
			case "s_literal":
				return String(expr.value.slice(1,-1));
			case "i_constant":
				return parseInt(expr.value);
			case "f_constant":
				return parseFloat(expr.value);
			default:
				throw new AppError("wrong expr.type format while analyzing semantics");
		}
	}

    visitCondExpr(expr){

	}

	visitContinue(cont){

	}

	visitCStmt(stmt){
		let symtable = new Symtable("compound statement", "stmt", this.symtableStack.peek());
		this.newScope(symtable, stmt);

		for(const construct of stmt.sequence){
			construct.accept(this);
		}

		this.closeScope();
	}

	visitDeclaration(declaration){
		const declKind = declaration.declarator.accept(this);

		let initKind = null;
		if(declaration.initializer){
			initKind = declaration.initializer.accept(this);

			if( ((declKind == DECLTYPE.ARR && initKind != INITTYPE.ARR) || (declKind != DECLTYPE.ARR && initKind == INITTYPE.ARR))
				&& (typeof initKind != "string" && declKind != DECLTYPE.ARR)){
				throw new SError(`Invalid initializer`, declaration.loc);
			}
		}

		this.addSymbol(SYMTYPE.OBJ, declaration.declarator, declaration.initializer, declaration.type.specifiers, declaration);
	}

	visitDeclarator(declarator){
		switch(declarator.kind){
			case DECLTYPE.PTR:
				return DECLTYPE.PTR;
			case DECLTYPE.ID:
				return DECLTYPE.ID;
			case DECLTYPE.ARR:
				return DECLTYPE.ARR;
			case DECLTYPE.FNC:
				return DECLTYPE.FNC;
			default:
				throw new AppError(`Unknown declarator kind (semantic): ${declarator.kind}`, declarator.loc);
		}
	}

    visitDesignator(designator){

	}

	visitDoWhileLoop(loop){
		let symtable = new Symtable("do-while loop", "stmt", this.symtableStack.peek());
		this.newScope(symtable, loop);

		// condition
		if(Array.isArray(loop.cond)){
			for(const subexpr of loop.cond){
				subexpr.accept(this);
			}
		}else{
			loop.cond.accept(this);
		}

		if(isclass(loop.body, "CStmt")){
			for(const construct of loop.body.sequence){
				construct.accept(this);
			}
		}

		this.closeScope();
	}

    visitEnum(enumerator){

	}

	visitFnc(fnc){
		//
		const fncName = this.addSymbol(SYMTYPE.FNC, fnc.declarator, fnc.body, fnc.returnType, fnc); // adds function to global symbol table

		//
		let symtableFnc = new Symtable(fncName, "function params", this.symtableStack.peek());
		this.newScope(symtableFnc, fnc);

		for(const param of fnc.declarator.fnc.parameters){
			if(param.type.specifiers.includes("void")) continue; // dont add void as parameter to symtable: int f(void){}

			this.addSymbol(SYMTYPE.OBJ, param.declarator, false, param.type.specifiers, param);
		}

		//
		let symtableBody = new Symtable(fncName, "body", this.symtableStack.peek());
		this.newScope(symtableBody, fnc.body);

		for(const construct of fnc.body.sequence){
			construct.accept(this);
		}

		//
		this.closeScope();
		this.closeScope();
	}


	visitFncCallExpr(fncCall){
		var fncName;
		var currSymtable;
		var fncSym;

		// https://en.cppreference.com/w/c/language/operator_other#Function_call
		// so I should first implicitly convert the expression (lvalue) and check if it is pointer-to-function type
		// 	-->	https://en.cppreference.com/w/c/language/conversion#Lvalue_conversions
		try{
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
				console.error("TODO SEMANTICS FUNCTION CALL");
			}
		}catch(e){
			throw new SError(e.details, fncCall.loc); // add loc information
		}


		if(!fncSym){
			throw new SError(`undeclared function ${fncName}`, fncCall.loc);
		}

		if(!fncSym.isFunction){
			throw new SError(`called object ${fncName} is not a function or function pointer`, fncCall.loc);
		}

		// semantic checks for each subtree of argument
		for(let arg of fncCall.arguments){
			arg.accept(this);
		}

		if(fncSym.isNative){
			return;
		}

		if(fncCall.arguments.length > fncSym.parameters.length){
			throw new SError(`too many arguments to function ${fncName}`, fncCall.loc);
		}else if(fncCall.arguments.length < fncSym.parameters.length){
			throw new SError(`too few arguments to function ${fncName}`, fncCall.loc);
		}

		// type checking
		for(let [arg, param] of fncCall.arguments.map((el, i) => [el, fncSym.parameters])){
			this.typeCheck(this.getParameterType(param), arg);
		}
	}

	visitForLoop(loop){
		let symtable = new Symtable("for loop", "stmt", this.symtableStack.peek());
		this.newScope(symtable, loop);

		// init
		if(Array.isArray(loop.init)){
			for(const subexpr of loop.init){
				subexpr.accept(this);
			}
		}else{
			loop.init.accept(this);
		}

		// condition
		if(Array.isArray(loop.cond)){
			for(const subexpr of loop.cond){
				subexpr.accept(this);
			}
		}else{
			loop.cond.accept(this);
		}

		// iteration expression
		if(Array.isArray(loop.itexpr)){
			for(const subexpr of loop.itexpr){
				subexpr.accept(this);
			}
		}else{
			loop.itexpr.accept(this);
		}

		if(isclass(loop.body, "CStmt")){
			for(const construct of loop.body.sequence){
				construct.accept(this);
			}
		}

		this.closeScope();
	}

	visitGoto(gt){

	}

    visitIStmt(stmt){

	}

	visitIdentifier(identifier){
		try{
			const name = this.symtableStack.peek().resolve(identifier.name);
		}catch(e){
			throw new SError(e.details, identifier.loc);
		}
	}

	visitIfStmt(stmt){
		if(Array.isArray(stmt.expr)){
			for(const subexpr of stmt.expr){
				subexpr.accept(this);
			}
		}else{
			stmt.expr.accept(this);
		}

		if(stmt.sfalse){ // null in case of no else
			stmt.sfalse.accept(this);
		}

		if(isclass(stmt.strue, "CStmt")){ // in case of brackets around statement (...if(true){...}...)
			stmt.strue.accept(this);
		}else{ // in case of no brackets (...if(true) printf()...)
			if(Array.isArray(stmt.strue)){
				for(const subexpr of stmt.strue){
					subexpr.accept(this);
				}
			}else{
				stmt.strue.accept(this);
			}
		}
	}

	visitInitializer(initializer){
		switch(initializer.kind){
			case INITTYPE.EXPR:
				return initializer.expr.accept(this);
			case INITTYPE.ARR:{
				const jsArr = initializer.toJSArray(this);

				function checkDimensions(arr, depth=0){
					if(!Array.isArray(arr) || typeof arr == "string"){ // end on primitive values
						return;
					}

					// check if all arrays at this level have the same length
					const size = arr.length;
					for(let i = 1; i < size; i++){
						if (!Array.isArray(arr[i])) {
							continue;
						}

						if(arr[i].length != arr[0].length){
							let expectedLen = arr[0].length;
							if(!arr[0].length) expectedLen = 1;
							throw new SError(`Dimension mismatch: Expected ${expectedLen} elements, but found ${arr[i].length}`, initializer.loc);
						}
					}

					// recursively check sub arrays
					for(let i = 0; i < size; i++){
						checkDimensions(arr[i], depth + 1);
					}
				}

				// throws SError
				checkDimensions(jsArr);
				return INITTYPE.ARR;
			}
			case INITTYPE.STRUCT:
				return INITTYPE.STRUCT;
			// no more nested, was taken care of while creating the AST
			default:
				throw new AppError(`Unknown initializer kind (semantic): ${initializer.kind}`, initializer.loc);
		}
	}

    visitJStmt(stmt){

	}

	visitLabelName(label){

	}

	visitLStmt(label){

	}

    visitMemberAccessExpr(expr){

	}

	visitNOP(nop){

	}

    visitPointer(ptr){

	}

    visitPtrMemberAccessExpr(expr){

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

    visitSStmt(stmt){

	}

    visitStruct(struct){

	}

    visitSubscriptExpr(expr){

	}

	visitSwitchStmt(stmt){

	}

    visitTagname(tagname){

	}

	visitTypedef(typedef){
		this.addSymbol(SYMTYPE.TYPEDEF, typedef.declarator, false, typedef.type.specifiers);
	}


    visitUExpr(expr){

	}

    visitUnion(union){

	}

	visitWhileLoop(loop){
		let symtable = new Symtable("while loop", "stmt", this.symtableStack.peek());
		this.newScope(symtable, loop);

		// condition
		if(Array.isArray(loop.cond)){
			for(const subexpr of loop.cond){
				subexpr.accept(this);
			}
		}else{
			loop.cond.accept(this);
		}

		if(isclass(loop.body, "CStmt")){
			for(const construct of loop.body.sequence){
				construct.accept(this);
			}
		}

		this.closeScope();
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
			0,						   // not an array so 0 size
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
		if(expression.cType == "CExpr") {
			switch(expression.type) {
				case "s_literal": return "char*";
				case "i_constant":
					if(expression.value.endsWith("LL")) return "int long long";  // Long long int
					if(expression.value.endsWith("L")) return "int long";        // Long int
					return "int";  // Default to int
				case "f_constant":
					if(expression.value.endsWith("f") || expression.value.endsWith("F")) return "float";
					return "double";  // Default to double
				default:
					throw new AppError(`Unknown expression type: ${expression.type}`);
			}
		}else if(expression.cType == "Identifier"){
			//TODO check variable type
			return "int";
		}

		console.error(expression);
		throw new AppError(`Invalid expression structure`, expression.loc);
	}
}
