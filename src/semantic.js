/**
 * @file Semantic analyzer
 * @author Ondřej Hruboš
 */

/**
 * @class StringRecord
 * @param {string} str
 * @note Uses the btoa function to encode a string (hash-like)
 */
class StringRecord{
	constructor(str){
		this.str = str;
		this.address = null;
		this.addresses = [];
		this.region = MEMREGION.DATA;
	}

	toCArray(){
		let arr = Array.from(this.str);
		arr.push('\0');
		arr = arr.map(function(c){
			return c.charCodeAt(0);
		});
		return arr;
	}
}

/**
 * @class StringTable
 * @note Uses the btoa function to encode a string (hash-like)
 */
class StringTable{
	constructor(){
		this.strings = new Map();
	}

	/**
	 * Adds new record to string table
	 * @param {StringRecord} sr
	 */
	add(sr){
		if(!this.has(sr)){
			this.strings.set(sr.str, sr);
		}
	}

	/**
	 * Check if table already has record about a string
	 * @param {StringRecord} sr
	 */
	has(sr){
		if(this.strings.has(sr.str)) return true;
		return false;
	}

	/**
	 * Retrieves record from the table based on its hash (btoa)
	 * @param {string} str
	 */
	get(str){
		return this.strings.get(str);
	}

    /**
     * Filters string records based on a predicate function (same as Array filter)
     * @param {function(StringRecord): boolean} predicate 
     * @returns {Iterable.<string, StringRecord>}
     */
    *filter(predicate) {
        for (const [key, stringRecord] of this.strings) {
            if (predicate(stringRecord)) {
                yield [key, stringRecord];
            }
        }
    }

	/**
	 * Iterator
	 */
	*[Symbol.iterator]() {
		for (const str of this.strings.entries()) {
			yield str; // yields [string, StringRecord]
		}
	}
}

/**
 * Semantic analyzer for interpreter
 * @description Acts as a visitor for AST structures.
 * @class Semantic
 * @param {Stack} symtableStack Stack of symbol tables (reference to Interpreter symtableStack)
 * @param {WarningSystem} warningSystem
 */
class Semantic {
	constructor(symtableStack, warningSystem){
		interfaces(this, ASTVISITORFUNCTIONS);

		this.symtableStack = symtableStack;
		this.warningSystem = warningSystem;
	}

	/**
	 * Introduces typedefs from parsing to semantic analysis
	 * @function
	 * @param {Map.<string, string>} userTypesMap
	 */
	attachUserTypesMap(userTypesMap){
		this.userTypesMap = userTypesMap;
	}

	/**
	 * First phase of semantic which checks every construct for semantic rules.
	 * @param {AST} ast
	 * @throws {SError}
	 */
	firstPhase(ast){
		this.calledFunctions = [];
		for(const construct of ast){
			construct.accept(this);
		}
	}

	/**
	 * List of called functions
	 * @type {Array.<Symbol>}
	 */
	calledFunctions = [];

	/**
	 * List of used labels, array of label names
	 * @type {Array.<string>}
	 */
	usedLabels = [];

	/**
	 * List of existing labels, array of label names
	 */
	existingLabels = [];

	/**
	 * Second phase of semantic which checks declarations of functions.
	 * @throws {SError}
	 */
	secondPhase(){
		for(const symbol of this.calledFunctions){
			if(symbol.isFunction && !symbol.initialized){
				throw new SError(`Function '${symbol.name}' declared but never defined`, symbol.astPtr.loc);
			}
		}

		used: for(const gotoLabel of this.usedLabels){
			existing: for(const existingLabel of this.existingLabels){
				if(gotoLabel == existingLabel){
					break used;
				}
			}
			throw new SError(`Label ${gotoLabel} does not exist`);
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
		var dimensionBrackets = 0;
		var size = [];
		var parameters = null;
		var isFunction = false;
		var namespace = NAMESPACE.ORDS;
		var initialized = initializer ? true : false;
		var indirection = 0;

		// handle typedef aliases
		specifiers = specifiers.flatMap(spec => {
			if(this.userTypesMap?.has(spec)){
				const typedef = this.userTypesMap.get(spec);
				let declCopy = declarator;
				let typedefWithoutID = typedef.declarator;

				let typedefDeclCopy = typedef.declarator;
				let idLevel = 0;
				while(typedefDeclCopy.kind != DECLTYPE.ID){
					idLevel++;
					typedefDeclCopy = typedefDeclCopy.child;
				}

				let typedefWithoutIDChild = typedefWithoutID;
				for(let i = 0; i <= idLevel; i++){
					if(i == idLevel){
						typedefWithoutIDChild.child = null;
						break;
					}
					typedefWithoutIDChild = typedefWithoutIDChild.child;
				}

				declChild = typedefWithoutID;
				declChild.child = declCopy;

				return this.userTypesMap.get(spec).type.specifiers; // expand typedef to real specifiers
			}
			return spec;
		});

		if(isclass(initializer, "Initializer")){
			if(isFunction){
				//? check this
				if(!declPtr){
					throw new SError(`Function ${symbolName} initialized like a variable`, initializer.loc);
				}
			}
		}

		let declCopy = declChild;
		let fncDeclarator;
		do{
			switch(declCopy.kind){
				case DECLTYPE.ID: 
					break;
				case DECLTYPE.FNC:
					fncDeclarator = declCopy; // get the function declarator (for params)
					break;
				case DECLTYPE.PTR:
				case DECLTYPE.STRUCT:
				case DECLTYPE.NESTED:
					break;
				case DECLTYPE.ARR:
					dimensionBrackets += 1; // calculate number of brackets from declarator (x[][] = 2, x[][][] = 3, ...)
					break;
			}
			declCopy = declCopy.child;
		}while(declCopy != null);

		do{
			try {
				if(declChild.kind == DECLTYPE.ID){
					//TODO refactor this, its ugly as heck
					if(isclass(initializer, "Initializer") && dimension > 0 && size.length < 1){ // is an array and size was not determined from declarator (int[3] = ...);
						const jsArray = initializer.toJSArray(this);
						size = getArraySizes(jsArray);
					}

					const currSymtable = this.symtableStack.peek();
					currSymtable.insertORD(namespace, declMainType, initialized, declChild.identifier.name, specifiers, declPtr, dimension, size, indirection, parameters, isFunction, astPtr);
					symbolName = declChild.identifier.name;
				}
				if(declChild.kind == DECLTYPE.FNC){
					isFunction = true;
					parameters = [];
					for(const param of fncDeclarator.fnc.parameters){
						if(param.type.specifiers.includes("void")) continue; // don't add void parameter
						parameters.push(param);
					}
				}
				if(declChild.kind == DECLTYPE.PTR){
					let ptr = declChild.ptr;
					do{
						indirection += 1;
						ptr = ptr.child;
					}while(ptr != null);
					declPtr = true;
				}
				if(declChild.kind == DECLTYPE.ARR){
					if(declChild.arrSizeExp){ // get size from expression in brackets
						const expr = declChild.arrSizeExp.accept(this);
						if(!expr.isConstant){
							throw new NSError(`variable array size (VLA)`, declarator.loc);
						}
						if(expr.value < 0){
							throw new SError(`Invalid array size`, declarator.loc);
						}

						size[dimension] = expr.value; // should always be constant expression
					}else{ // calculate (only for the outer-most array)
						if(dimension != dimensionBrackets - 1) throw new SError(`Array type has incomplete element type '${specifiers}[]'`, declarator.loc);
						if(initializer != null){
							if(initializer.arr){
								size[dimension] = initializer.arr.length;
							}else{
								// automatic size of array from string
								if(initializer.expr?.type == "s_literal"){
									size[dimension] = initializer.expr.value.length - 1;
								}
							}
						}else{
							throw new SError(`Array size missing`, declarator.loc);
						}
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

	addEnum(name, values){
		const currSymtable = this.symtableStack.peek();
		currSymtable.insertTAG(NAMESPACE.TAGS, name, values);
	}

	addLabel(name, astPtr){
		const currSymtable = this.symtableStack.peek();

		// find the function symtable and its name
		let fncSymtable = this.symtableStack.peek();
		let fncName = undefined;
		do{
			if(fncSymtable.scopeInfo.type == "body"){
				fncName = fncSymtable.scopeInfo.name;
				break;
			}else{
				fncSymtable = fncSymtable.parent;
			}
		}while(fncName == undefined);
		
		currSymtable.insertLABEL(NAMESPACE.LABELS, name, fncName, astPtr);
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

	/**
	 * Stores information about string literals
	 * @type {StringTable}
	 */
	stringTable = new StringTable();


	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitArr(arr){
		return arr;
	}

	visitBAssignExpr(expr){
		let lval;
		let rval;
		let symbol;
		const currSymtable = this.symtableStack.peek();

		// check rval type
		if(Array.isArray(expr.left)){
			for(const subexpr of expr.left){
				if(isclass(subexpr, "Identifier")){
					symbol = currSymtable.resolve(subexpr.name);
				}
				lval = subexpr.accept(this);
			}
		}else{
			if(isclass(expr.left, "Identifier")){
				symbol = currSymtable.resolve(expr.left.name);
			}
			lval = expr.left.accept(this);
		}

		// check lval type
		if(symbol?.isFunction){
			throw new SError("Cannot assign function to a variable", expr.loc);
		}
		
		rval = this.evaluateExprArray(expr.right);
		if(symbol){
			lval = new SValue(symbol.memtype, symbol.indirection, symbol.dimension, false, null, null); // todo fix for structs
		}

		this.sValueCompatibility(lval, rval, expr.loc);

		switch(expr.op){
			case '=': {
				if(lval?.size?.length > 0 && rval?.size?.length > 0){
					throw new SError(`Assignment to expression with array type`, expr.loc);
				}
				break;
			}
			default:
				break;
		}

		return lval;
	}

	visitBArithExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);

		if(lval.dimension > 0){
			lval.indirection = 0;
			if(rval.isConstant){
				rval.type = lval.type;
				rval.indirection = lval.indirection;
			}
		}
		if(rval.dimension > 0){
			rval.indirection = 0;
			if(lval.isConstant){
				lval.type = rval.type;
				lval.indirection = rval.indirection;
			}
		}

		if(lval.indirection > 0 && rval.isConstant){
			rval.type = lval.type;
			rval.indirection = lval.indirection;
		}

		if(rval.indirection > 0 && lval.isConstant){
			lval.type = rval.type;
			lval.indirection = rval.indirection;
		}

		this.sValueCompatibility(lval, rval, expr.loc);
		return new SValue(lval.type, lval.indirection, lval.dimension, null, false, null, null);
	}

    visitBCompExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);
		this.sValueCompatibility(lval, rval, expr.loc);
		return new SValue(lval.type, lval.indirection, lval.dimension, null, false, null, null);
	}

    visitBLogicExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);
		this.sValueCompatibility(lval, rval);
		return new SValue(lval.type, lval.indirection, lval.dimension, null, false, null, null);
	}

	visitBreak(br){

	}

    visitCastExpr(expr){
		const operand = this.evaluateExprArray(expr.expr);
		const type = determineMemtype(expr.type);
		return new SValue(type, operand.indirection, operand.dimension, null, null);
	}

	visitCExpr(expr){
		switch(expr.type){
			case "s_literal":
				const sr = new StringRecord(expr.value.slice(1, -1));
				this.stringTable.add(sr);
				return new SValue(DATATYPE.char, 1, 1, null, true, sr.str, null);
			case "i_constant":
				let value;
				let indirection = 0;
				if(expr.value == "NULL"){
					value = 0;
					indirection = 1;
				}
				if(expr.value.startsWith("0b")) value = parseInt(expr.value.slice(2), 2);
				if(expr.value.startsWith("'") && expr.value.endsWith("'") && expr.value.length == 3) value = expr.value.charCodeAt(1);
				if(expr.value == "'\\0'") value = 0;
				if(!value) value = parseInt(expr.value);
				return new SValue(DATATYPE.int, indirection, 0, null, true, value, null);
			case "f_constant":
				return new SValue(DATATYPE.float, 0, 0, null, true, parseFloat(expr.value), null);
			default:
				throw new AppError("wrong expr.type format while analyzing semantics");
		}
	}

    visitCondExpr(expr){
		this.evaluateExprArray(expr.condition);
		this.evaluateExprArray(expr.texpr);
		this.evaluateExprArray(expr.fexpr);

		return expr;
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

	visitCaseStmt(stmt){
		stmt.attachSymtable(this.symtableStack.peek());
		const caseValue = this.evaluateExprArray(stmt.expr);

		// TODO add enum check
		if(caseValue && !Number.isInteger(caseValue.value)) throw new SError(`Case label does not reduce to an integer constant`, stmt.loc);

		if(Array.isArray(stmt.stmt)){
			for(const construct of stmt.stmt){
				construct.accept(this);
			}
		}else{
			stmt.stmt.accept(this);
		}
	}

	visitDeclaration(declaration){
		const declKind = declaration.declarator.accept(this);

		let init;
		let expr;
		if(declaration.initializer){
			init = declaration.initializer.accept(this);
			expr = init.expr;

			if( ((declKind == DECLTYPE.ARR && init.kind != INITTYPE.ARR) || (declKind != DECLTYPE.ARR && init.kind == INITTYPE.ARR))
				&& (typeof init.kind != "string" && declKind != DECLTYPE.ARR)){
				throw new SError(`Invalid initializer`, declaration.loc);
			}
		}

		// change string location
		if(declaration.initializer && declaration.initializer.kind == INITTYPE.EXPR){
			if(declaration.declarator.kind == DECLTYPE.ARR){
				// string allocated on stack
				if(typeof init.expr == "string"){
					let sr = this.stringTable.get(init.expr);
					sr.region = MEMREGION.STACK;
				}
			}
		}

		if(isclass(declaration.type.specifiers[0], "Struct")) throw new NSError("structs", declaration.loc);
		if(isclass(declaration.type.specifiers[0], "Union")) throw new NSError("unions", declaration.loc);

		const name = this.addSymbol(SYMTYPE.OBJ, declaration.declarator, declaration.initializer, declaration.type.specifiers, declaration);
		const symbol = this.symtableStack.peek().resolve(name);
		
		const type = symbol.pointsToMemtype && symbol.indirection > 0 ? symbol.pointsToMemtype : symbol.memtype;
		const lval = new SValue(type, symbol.indirection, symbol.dimension, false, null, null);
		if(declaration.initializer && symbol.type != SYMTYPE.FNC && expr != undefined && symbol.size.length < 1){
			const rval = new SValue(expr.type, expr.indirection, expr.dimension, expr.isConstant, expr.value, expr.object);
			if(rval.dimension > 0){
				rval.indirection += 1;
			}
			this.sValueCompatibility(lval, rval, declaration.loc);
		}

		return lval;
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
		return designator;
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

    visitEnum(enm){
		throw new NSError("enums", enm.loc);
		const name = enm.tagname;
		let list = [];
		let i = 0;
		for(const element of enm.enumerator_list){
			const value = element.constantExpression?.accept(this) ? element.constantExpression.accept(this) : i;
			let p = new Pair(element.identifier.name, value)
			list.push(p);
			i = value + 1;
		}
		this.addEnum(name, list);
	}

	visitEnumerator(enumerator){
		throw new NSError("enumerators", enm.loc);
	}

	visitFnc(fnc){
		if(fnc.isNative) return; // skip built-in functions, will be handled separately
		//
		const fncName = this.addSymbol(SYMTYPE.FNC, fnc.declarator, fnc.body, fnc.returnType, fnc); // adds function to global symbol table

		let declCopy = fnc.declarator;
		let fncDeclarator;
		do{
			switch(declCopy.kind){
				case DECLTYPE.ID: 
					break;
				case DECLTYPE.FNC:
					fncDeclarator = declCopy; // get the function declarator (for params)
					break;
				case DECLTYPE.PTR:
				case DECLTYPE.STRUCT:
				case DECLTYPE.NESTED:
				case DECLTYPE.ARR:
					break;
			}
			declCopy = declCopy.child;
		}while(declCopy != null);

		//
		let symtableFnc = new Symtable(fncName, "function params", this.symtableStack.peek());
		this.newScope(symtableFnc, fnc);

		for(const param of fncDeclarator.fnc.parameters){
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
			throw new SError(`Undeclared function ${fncName}`, fncCall.loc);
		}

		if(!fncSym.isFunction){
			throw new SError(`Called object ${fncName} is not a function or function pointer`, fncCall.loc);
		}

		// semantic checks for each subtree of argument
		const args = [];
		for(let arg of fncCall.arguments){
			args.push(arg.accept(this));
		}

		if(fncSym.isNative){
			return fncSym.astPtr.accept(this, args);
		}

		if(fncCall.arguments.length > fncSym.parameters.length){
			throw new SError(`Too many arguments to function ${fncName}`, fncCall.loc);
		}else if(fncCall.arguments.length < fncSym.parameters.length){
			throw new SError(`Too few arguments to function ${fncName}`, fncCall.loc);
		}

		// type checking
		for(let [arg, param] of fncCall.arguments.map((arg, i) => [arg, fncSym.parameters[i]])){
			if(param.declarator && (param.declarator.kind == DECLTYPE.PTR || param.declarator.kind == DECLTYPE.ARR)){ // !fix params of pointer and array types
				continue;
			}
			this.typeCheck(this.getParameterType(param), arg);
		}

		this.calledFunctions.push(fncSym);

		return new SValue(fncSym.memtype, fncSym.indirection, 0, fncSym.returnType, false, null, null);
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
		}else{
			this.evaluateExprArray(loop.body);
		}

		this.closeScope();
	}

	visitGoto(gt){
		if(!gt.label) throw new SError(`No label specified for goto`, gt.loc);

		this.usedLabels.push(gt.label.name);
	}

    visitIStmt(stmt){

	}

	visitIdentifier(identifier){
		let symbol;
		try{
			symbol = this.symtableStack.peek().resolve(identifier.name);
		}catch(e){
			throw new SError(e.details, identifier.loc);
		}

		const type = symbol.pointsToMemtype && symbol.indirection > 0 ? symbol.pointsToMemtype : symbol.memtype;
		return new SValue(type, symbol.indirection, symbol.dimension, false, null, null);
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
				return { kind: INITTYPE.EXPR, expr: initializer.expr.accept(this) };
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
							// this is wrong if there are designators in there (for now skip this check):
							//throw new SError(`Dimension mismatch: Expected ${expectedLen} elements, but found ${arr[i].length}`, initializer.loc);
						}
					}

					// recursively check sub arrays
					for(let i = 0; i < size; i++){
						checkDimensions(arr[i], depth + 1);
					}
				}

				// throws SError
				checkDimensions(jsArr);
				return { kind: INITTYPE.ARR, expr: jsArr};
			}
			case INITTYPE.STRUCT:
				throw new NSError("struct", initializer.loc);
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
		// SYMTYPE.LABEL
		this.addLabel(label.name, label);
		this.existingLabels.push(label.name);

		if(Array.isArray(label.stmt)){
			for(let stmt of label.stmt){
				stmt.accept(this);
			}
		}else{
			label.stmt.accept(this);
		}
	}

    visitMemberAccessExpr(expr){
		return expr;
	}

	visitNOP(nop){
		return nop;
	}

    visitPointer(ptr){
		return ptr;
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
				this.warningSystem.add(`Return with a value, in function returning void`, WTYPE.RETURNTYPE, ret.loc);
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
			throw e;
		}
	}

	visitSizeOfExpr(call){
		const e = this.evaluateExprArray(call.expr);
		return new SValue(DATATYPE.int, 0, 0, null, false, null, null);
	}

    visitSStmt(stmt){

	}

    visitStruct(struct){
		throw new NSError("structs", struct.loc);
	}

    visitSubscriptExpr(expr){
		let value;

		let exprCopy = expr.pointer;
		while(exprCopy != null){
			if(exprCopy.expr){
				value = this.evaluateExprArray(exprCopy.expr);
			}else{  // last in the chain is identifier
				value = this.evaluateExprArray(exprCopy);
				break;
			}

			exprCopy = exprCopy.pointer;
		};

		return new SValue(value.type, value.indirection, 0, null, false, null, null);
	}

	visitSwitchStmt(stmt){
		let symtable = new Symtable("switch statement", "stmt", this.symtableStack.peek());
		this.newScope(symtable, stmt);

		this.evaluateExprArray(stmt.expr);
		for(const construct of stmt.body.sequence){
			construct.accept(this);
		}

		this.closeScope();
	}

    visitTagname(tagname){
		return tagname;
	}

	visitType(type){
		if(typeof type.specifiers[0] == "string"){
			return;
		}
		throw new NSError("structs and unions", type.loc);

		return type;
	}

	visitTypedef(typedef){
		if(isclass(typedef.type.specifiers[0], "Struct")) throw new NSError("structs", typedef.loc);
		if(isclass(typedef.type.specifiers[0], "Union")) throw new NSError("unions", typedef.loc);

		this.addSymbol(SYMTYPE.TYPEDEF, typedef.declarator, false, typedef.type.specifiers);
		return typedef;
	}


    visitUExpr(expr){
		let val;
		switch(expr.op){
			case '+':
			case '-':
			case '++':
			case '--':
			case '!':
			case '~':
				val = this.evaluateExprArray(expr.expr);
				return new SValue(val.type, val.indirection, val.dimension, null, null, null);
			case '*':
				val = this.evaluateExprArray(expr.expr);
				return new SValue(val.type, val.indirection-1, 0, null, null, null);
			case '&': {
				val = this.evaluateExprArray(expr.expr);
				if(isclass(val, "Sym") && val.isFunction) throw new NSError(`function pointers`, expr.loc);
				//if(!isclass(expr.expr, "Identifier")) throw new SError("value (object, variable, ...) required for '&' operand", expr.loc);
				return new SValue(val.type, val.indirection+1, val.dimension, val.returnType, false, null, val.object);
			} 
			default:
				throw new AppError(`Uknown operator ${expr.op} in semantic UExpr`);
		}
	}

    visitUnion(union){
		throw new NSError("unions", union.loc);
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

	visitPrintF(printf, formatstr){
		return new SValue(null, 0, 0, DATATYPE.int, false, null, null)
	}

	visitMalloc(malloc, arg){
		if(arg.length != 1) throw new SError(`Wrong number of arguments to function malloc`);
		const s = this.evaluateExprArray(arg[0]); // size to allocate
		if(!s) throw new SError(`Argument size must be an integer (malloc)`);
		return new SValue(null, 1, 0, DATATYPE.void, false, null, null);
	}

	visitCalloc(calloc, args){
		if(args.length != 2) throw new SError(`Wrong number of arguments to function calloc`);
		const num = this.evaluateExprArray(args[0]);
		if(!num) throw new SError(`Argument num must be an integer (calloc)`);
		const size = this.evaluateExprArray(args[1]);
		if(!size) throw new SError(`Argument size must be an integer (calloc)`);
		return new SValue(null, 1, 0, DATATYPE.void, false, null, null);
	}

	visitFree(free, arg){
		return new SValue(null, 0, 0, DATATYPE.void, false, null, null);
	}

	/**********************
	 *  HELPER FUNCTIONS  *
	 *********************/

	/**
	 * All expression could be returned as an array, that is by design of the C language.
	 * This function exists to make it easier to evaluate any expression.
	 * @param {Array.<Expr>} expr
	 * @return {}
	 */
	evaluateExprArray(expr){
		let ret;
		if(Array.isArray(expr)){
			for(const subexpr of expr){
				if(subexpr instanceof Construct){
					ret = subexpr.accept(this);
				}else{
					ret = subexpr;
				}
			}
		}else{
			if(expr instanceof Construct){
				ret = expr.accept(this);
			}else{
				ret = expr;
			}
		}

		return ret;
	}

	/**
	 * Adds built-in (native) functions to the global symbol table.
	 * Currently, only `printf` is added, but more functions can be implemented in `nativefuncs.js`.
	 * @todo Add more built-in functions
	 *
	 * @see {@link nativefuncs.js}
	 * @param {Symtable} symtableGlobal - The global symbol table where native functions are registered.
	 */
	addNativeFunctions(symtableGlobal){
		symtableGlobal.insertORD(
			NAMESPACE.ORDS,
			SYMTYPE.FNC,
			true,                      // initialized
			"printf",                  // function name
			["int"],                   // return type (C's printf returns int)
			false,                     // not a pointer
			0,                         // not an array
			0,						   // not an array so 0 size
			0,						   // not a pointer so 0 indirection
			[new Declarator(DECLTYPE.ID, null, {name: "formatstr"})],
			true,                      // isFunction
			new NATIVE_printf(),       // no AST, built-in function pointer
			true                       // isNative
		);

		symtableGlobal.insertORD(
			NAMESPACE.ORDS,
			SYMTYPE.FNC,
			true,                      // initialized
			"malloc",                  // function name
			["void*"],                   // return type
			true,
			0,                         // not an array
			0,						   // not an array so 0 size
			1,
			[new Declarator(DECLTYPE.ID, null, {name: "size"})],
			true,                      // isFunction
			new NATIVE_malloc(),       // no AST, built-in function pointer
			true                       // isNative
		);

		symtableGlobal.insertORD(
			NAMESPACE.ORDS,
			SYMTYPE.FNC,
			true,                      // initialized
			"calloc",                  // function name
			["void*"],                   // return type
			true,
			0,                         // not an array
			0,						   // not an array so 0 size
			1,
			[new Declarator(DECLTYPE.ID, null, {name: "size"})],
			true,                      // isFunction
			new NATIVE_calloc(),       // no AST, built-in function pointer
			true                       // isNative
		);

		symtableGlobal.insertORD(
			NAMESPACE.ORDS,
			SYMTYPE.FNC,
			true,                      // initialized
			"free",                  // function name
			["void"],                   // return type
			false,
			0,                         // not an array
			0,						   // not an array so 0 size
			0,
			[new Declarator(DECLTYPE.ID, null, {name: "address"})],
			true,                      // isFunction
			new NATIVE_free(),       // no AST, built-in function pointer
			true                       // isNative
		);
	}

	/**
	 * Returns the type of declared parameter
	 * @param {Declarator} declarator
	 * @return {string} specifiers
	 */
	getParameterType(declaration){
		// not sure but for params it should not be longer than 1
		return declaration.type.specifiers;
	}

	/**
	 * Checks if the declared type matches the inferred type of the expression.
	 * @param {Array<string>} specifiers The list of type specifiers from the declaration
	 * @param {Object} expression The expression to be type-checked
	 * @throws {Error} Throws an error if there is a type mismatch
	 */
	typeCheck(specifiers, expression) {
		// determine the expression type
		let declType = this.normalizeType(specifiers);
		let exprType = this.inferType(expression);

		// check if the types match
		if(!this.typesAreCompatible(declType, exprType)){
			throw new SError(`Type mismatch: expected ${declType}, but got ${exprType}`, expression.loc);
		}
	}

	/**
	 * Returns normalized specifier list (main type will be first)
	 * @param {Array<string>} specifiers
	 * @return {Arr}
	 */
	normalizeType(specifiers){
		let specs = [...specifiers];

		// Remove "signed" (default) and redundant qualifiers
		specs = specs.filter(s => s !== "signed");

		// Unify basic types
		if(specs.includes("_Bool") || specs.includes("char")){
			return "int";  // char and _Bool behave as int in expressions
		}

		// Handle floating points
		if(specs.includes("float")) return "float";
		if(specs.includes("double")) return "double";

		// Default: sort specifiers alphabetically for consistency
		return specs.sort().join(" ");
	}


	/**
	 * Infers the type of an expression.
	 * @param {Object} expression The expression object to analyze
	 * @returns {string} The inferred C type of the expression
	 * @throws {AppError} Throws an error if the expression type is unknown
	 */
	inferType(expression) {
		if(expression.cType == "CExpr"){
			switch(expression.type){
				case "s_literal": return "char*";
				case "i_constant":
					if(expression.value.endsWith("LL")) return "int long long";  // Long long int
					if(expression.value.endsWith("L")) return "int long";        // Long int
					return "int";  // Default to int
				case "f_constant":
					if(expression.value.endsWith("f") || expression.value.endsWith("F")) return "float";
					return "float";  // Default to double
				default:
					throw new AppError(`Unknown expression type: ${expression.type}`);
			}
		}else if(expression.cType == "Identifier"){
			return this.symtableStack.top().resolve(expression.name).specifiers;
		}else{
			//TODO other expressions
			return "int";
		}
	}

	/**
	 * Compares two normalized types for compatibility.
	 * @param {string} declType
	 * @param {string} exprType
	 * @return {boolean}
	 */
	typesAreCompatible(declType, exprType) {
		if (declType == exprType) return true;

		const intTypes = ["int", "long", "long long", "short", "char", "_Bool"];
		if (intTypes.includes(declType) && intTypes.includes(exprType)) return true;

		const floatTypes = ["float", "double"];
		if (floatTypes.includes(declType) && floatTypes.includes(exprType)) return true;

		return false;
	}

	/**
	 * Compares operands of binary expression
	 * @param {SValue} lval
	 * @param {SValue} rval
	 * @param {Object} loc Line of code object
	 * @throws {SError}
	 */
	sValueCompatibility(lval, rval, loc){
		/*if(lval.indirection > 0 || rval.indirection > 0){
			if(lval.indirection != rval.indirection || lval.type != rval.type && (!lval.isConstant && !rval.isConstant && !lval.returnType && !rval.returnType)){
				this.warningSystem.new(`Initialization of '${lval.type}${"*".repeat(lval.indirection)}' from '${rval.type}${"*".repeat(rval.indirection)}' without cast`, WTYPE.CONVERSION, loc);
			}
		} man this is more difficult than I thought*/
		if(lval.type == DATATYPE.void || rval.type == DATATYPE.void) throw new SError(`Variable declared void`, loc);
	}
}

class SValue {
	/**
	 * @type {DATATYPE}
	 */
	type;

	/**
	 * @type integer
	 */
	indirection;

	/**
	 * @type integer
	 */
	dimension;

	/**
	 * @type {DATATYPE}
	 */
	returnType;

	/**
	 * @type {Object}
	 */
	object;

	/**
	 * @type {boolean}
	 */
	isConstant;

	/**
	 * @type {Object|integer|string}
	 */
	value;

	/**
	 * @param {DATATYPE} type - The data type of the value
	 * @param {integer} indirection - The level of indirection (pointer depth)
	 * @param {integer} dimension - The array dimension (0 for non-arrays)
	 * @param {DATATYPE} [returnType=DATATYPE.void] - The return type for functions
	 * @param {boolean} isConstant
	 * @param {Object|integer|string} value - In case of constant
	 * @param {Object} [object=null] - Whether this is an object, if yes set it here
	 */
	constructor(type, indirection=0, dimension=0, returnType=DATATYPE.void, isConstant=false, value, object=null){
		this.type = type;
		this.indirection = indirection;
		this.dimension = dimension;
		this.returnType = returnType;
		this.isConstant = isConstant;
		this.value = value;
		this.object = object;
	}
}

/**
 * Determines the memory type based on the specifiers
 * @return {DATATYPE}
 * @note Determined in constructor
 */
function determineMemtype(specifiers){
	let specArr = specifiers;
	if(!Array.isArray(specifiers)){
		console.warn("Wrong type of Semantic.specifiers, expected Array, got ", getclass(specifiers));
		specArr = specifiers.split(',').filter(s => s.length > 0); 
	}

	let specSet = new Set(specArr);

	// Default type is 'int' if unspecified - but this should never happen
	if(specSet.size === 0) return DATATYPE.int;

	if(specSet.has("void")){ 
		return DATATYPE.void;
	}

	if(specSet.has("_Bool")) return DATATYPE.bool;
	if(specSet.has("char")) return specSet.has("unsigned") ? DATATYPE.uchar : DATATYPE.char;
	if(specSet.has("short")) return specSet.has("unsigned") ? DATATYPE.ushort : DATATYPE.short;
	if(specSet.has("int")) return specSet.has("unsigned") ? DATATYPE.uint : DATATYPE.int;

	// Floating-point types
	if(specSet.has("float")) return DATATYPE.float;
	if(specSet.has("double")) return specSet.has("long") ? DATATYPE.longdouble : DATATYPE.double;

	// Handling 'long', 'long long', and unsigned variations
	if(specSet.has("long")){
		let longCount = 0;
		if(specSet.has("long")) longCount = specArr.filter(x => x === "long").length;

		if(longCount == 2){
			return specSet.has("unsigned") ? DATATYPE.ulonglong : DATATYPE.longlong;
		}
		if(longCount == 1){
			return specSet.has("unsigned") ? DATATYPE.ulong : DATATYPE.long;
		}
	}

	// Default to int
	return DATATYPE.int;
};
