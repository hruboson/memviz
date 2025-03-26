/**
 * @file Interpreter file
 * @author Ondřej Hruboš
 */

/**
 * Interpreter class, acts as a Visitor for AST
 * @description We are pretending to be "compiling" to target machine code. The interpreter first analyses the code using the Semantic analyzer and either throws
 * 				an error or allows for further interpretation of AST.
 * @class Interpreter
 */
class Interpreter {

	constructor(){
		this.#symtableGlobal = new Symtable("global", "global");
		this.#symtableStack = new Stack(); // only for semantic analyzer
		this.#symtableStack.push(this.#symtableGlobal);

		this.#warningSystem = new WarningSystem();
		this.#semanticAnalyzer = new Semantic(this.#symtableStack, this.#warningSystem);
		this.#callStack = new CallStack();
		this.memsim = new Memsim(this.#warningSystem);
		this.memviz = new Memviz(this.memsim, this.#callStack, document.getElementById("output")); // TODO pass the element id as string parameter for interpreter
	}

	/* ATTRIBUTES */
	/**
	 * Parser instance
	 * @private
	 */
	#parser = c_parser;

	/**
	 * AST
	 * @private
	 * @type {AST}
	 */
	#ast;
	get ast(){
		return this.#ast;
	}

	/**
	 * Top-most (global) symbol table
	 * @private
	 * @type {Symtable}
	 */
	#symtableGlobal;

	/**
	 * Symtable stack (mostly for printing reason)
	 * @private
	 * @type {Stack}
	 */
	#symtableStack;

	/**
	 * Call stack
	 * @private
	 * @type {CallStack}
	 */
	#callStack;

	/**
	 * Semantic analyzer
	 * @private
	 * @type {Semantic}
	 */
	#semanticAnalyzer;

	/**
	 * Memory simulator
	 * @type {Memsim}
	 * @public
	 */
	memsim;

	/**
	 * Memory visualizer
	 * @type {Memviz}
	 * @public
	 */
	memviz;

	/**
	 * Interpreter output (console)
	 * @type {string}
	 * @public
	 */
	output = "";

	/**
	 * Warning system
	 * @private
	 * @type {WarningSystem}
	 */
	#warningSystem;

	/**
	 * Program counter
	 * @description Currently interpreted statement
	 * @private
	 * @type {Construct}
	 */
	#_pc = 0;
	get pc(){
		return this.#_pc;
	}

	/**
	 * Sets the program counter to point at current construct being interpreted and also sets the pcloc/pcloclast which are used for visualizing program state
	 * PC should be mostly only set in statements (and most of that in CStmt)
	 * @public
	 * @param {Construct} Construct which just got interpreted
	 */
	set pc(construct){
		this.#_pc = construct;
		this.#_instrNum++;
		if(construct){
			if(this.#_pcloc > 0){
				this.#_pcloclast = this.#_pcloc;
			}

			// never set these values outside of this function
			this.#_pcloc = construct.loc.first_line;
			this.#_pclocColStart = construct.loc.first_column;
			this.#_pclocColEnd = construct.loc.last_column;
		}
	}

	/**
	 * Instruction number
	 * @description Counts the number of constructs interpreted
	 * @private
	 * @type {integer}
	 */
	#_instrNum = 0;

	/**
	 * Program counter line of code TO BE INTERPRETED
	 * @private
	 * @type {integer}
	 * @see {pc}
	 */
	#_pcloc = 0;
	get pcloc(){
		return this.#_pcloc;
	}
	set pcloc(integer){
		// NEVER SET IT MANUALLY, you've been warned
		console.warning("NEVER SET PCLOC or PCLOCLAST MANUALLY!!!");
	}

	/**
	 * Program counter column corresponding to currently interpreted construct in code.
	 * @private
	 * @type {integer}
	 * @see {pc}
	 */
	#_pclocColStart = 0;
	get pclocColStart(){
		return this.#_pclocColStart;
	}
	set pclocColStart(integer){
		// NEVER SET IT MANUALLY, you've been warned
		console.warning("NEVER SET PCLOCCOLSTART or PCLOCCOLEND MANUALLY!!!");
	}

	/**
	 * Program counter column corresponding to currently interpreted construct in code.
	 * @private
	 * @type {integer}
	 * @see {pc}
	 */
	#_pclocColEnd = 0;
	get pclocColEnd(){
		return this.#_pclocColEnd;
	}
	set pclocColEnd(integer){
		// NEVER SET IT MANUALLY, you've been warned
		console.warning("NEVER SET PCLOCCOLSTART or PCLOCCOLEND MANUALLY!!!");
	}

	/**
	 * Program counter line of code JUST INTERPRETED
	 * @private
	 * @type {integer}
	 * @see {pc}
	 */
	#_pcloclast = 0;
	get pcloclast(){
		return this.#_pcloclast;
	}
	set pcloc(integer){
		// NEVER SET IT MANUALLY, you've been warned
		console.warning("NEVER SET PCLOC or PCLOCLAST MANUALLY!!!");
	}

	/**
	 * Breakstop
	 * @description How far the code should be interpreted (will be set in HTML)
	 * @detail As user steps through code it keeps adding one to this
	 * @type {integer}
	 */
	#breakstop = 0;

	/**
	 * Returns types defined by user (typedefs)
	 * @return {Array.<string>} User-defined types
	 */
	get userTypes(){
		return this.#parser.Parser.prototype.yy.lastSymbols.types;
	}

	/**
	 * Returns enums declared by user (enums)
	 * @return {Array.<string>} User-defined enums
	 */
	get userEnums(){
		return this.#parser.Parser.prototype.yy.lastSymbols.enums;
	}

	/*******************
	 *    FUNCTIONS    *
	 ******************/

	/**
	* Parses user input
	* @descriptions Sets the #ast attribute of interpreter
	* @param {string} text User input
	* @return {Interpreter} Interpreter
	*/
	parse(text){
		this.#refreshSymbols();
		this.#ast = this.#parser.parse(text);
		return this;
	}

	/**
	 * Semantic analysis of AST
	 * @throws {SError} Semantic error
	 * @param {AST} ast
	 */
	semantic(ast){
		try{
			// add native functions to global symtable (global scope)
			this.#semanticAnalyzer.addNativeFunctions(this.#symtableGlobal);

			// first phase
			this.#semanticAnalyzer.firstPhase(ast);

			// second phase
			this.#semanticAnalyzer.secondPhase(); // additional semantic checks after creating symbol table

			const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");
			if(mainFnc){
				if(mainFnc.type != SYMTYPE.FNC){
					throw new SError("main is not a function");
				}
			}else{
				throw new SError("undefined reference to main()")
			}
		}catch(err){
			this.updateHTML(err);
			throw err;
		}

		this.#callStack.push(new StackFrame(this.#symtableGlobal), null, null); // add global symtable to call stack
	}

	/**
	 * Single function that prepares ("""compiles""") the C code
	 * @param {string} code Code to be "compiled"
	 * @throws {AppError|RTError}
	 */
	compile(code){
		this.parse(code).semantic(this.#ast);
	}

	/**
	 * Interprets ast (for now, maybe do IC later -- like much much later)
	 * @throws {RTError|AppError|InternalError} Runtime error
	 * @param {AST} ast
	 * @return {integer} result of main function
	 */
	interpret(breakstop){
		this.resetHTML(); // resets console output

		this.#breakstop = breakstop; // get breakstop from user (HTML)

		const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");
		let result;

		// initialize global variables
		for(const [name, symbol] of this.#symtableGlobal.objects){
			if(symbol.isFunction) continue; // skip functions
			if(symbol.isNative) continue; // skip built-in functions
			if(symbol.type == "TYPEDEF") continue; // skip typedefs
			symbol.astPtr.accept(this);
		}

		if(breakstop > 0){
			try{
				this.pc = mainFnc.astPtr;
				result = mainFnc.astPtr.accept(this, [1, 1]); //TODO args from UI
			}catch(ret){ // catch return value of main
				result = ret;
			}
		}

		this.updateHTML(result);
		this.memviz.updateHTML();
		//this.memsim.printMemory();
		return result;
	}

	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitArr(arr){
		console.log("array", arr);
	}

    visitBAssignExpr(expr){
		let lval; // lval should always derive to value of symbol on left side
		let rval; // rval should always derive to constant
		let symbol; // symbol to store the value to

		rval = this.evaluateExprArray(expr.right);
		lval = this.evaluateExprArray(expr.left);

		if(has(lval, "address")){
			symbol = lval;
			lval = this.memsim.readSymValue(lval); // get the value
		}

		if(has(rval, "address")){
			rval = this.memsim.readSymValue(rval); // get the value
		}

		// concrete operations
		switch(expr.op){
			case '=':
				this.memsim.setSymValue(symbol, rval, MEMREGION.STACK);
				break;
			case '+=':
				this.memsim.setSymValue(symbol, lval + rval, MEMREGION.STACK);
				break;
			case '-=':
				this.memsim.setSymValue(symbol, lval - rval, MEMREGION.STACK);
				break;
			case '*=':
				this.memsim.setSymValue(symbol, lval * rval, MEMREGION.STACK);
				break;
			case '/=':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				this.memsim.setSymValue(symbol, lval / rval, MEMREGION.STACK);
				break;
			case '%=':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				this.memsim.setSymValue(symbol, lval % rval, MEMREGION.STACK);
				break;
			case '&=':
				this.memsim.setSymValue(symbol, lval & rval, MEMREGION.STACK);
				break;
			case '|=':
				this.memsim.setSymValue(symbol, lval | rval, MEMREGION.STACK);
				break;
			case '^=':
				this.memsim.setSymValue(symbol, lval ^ rval, MEMREGION.STACK);
				break;
			case '<<=':
				this.memsim.setSymValue(symbol, lval << rval, MEMREGION.STACK);
				break;
			case '>>=':
				this.memsim.setSymValue(symbol, lval >> rval, MEMREGION.STACK);
				break;

			default:
				throw new AppError(`Unknown operator of expression: ${expr}`, expr.loc);
		}

		return this.memsim.readSymValue(symbol);
	}

    visitBArithExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);

		if(has(lval, "address")){
			lval = this.memsim.readSymValue(lval); // get the value
		}

		if(has(rval, "address")){
			rval = this.memsim.readSymValue(rval); // get the value
		}

		// concrete operations
		switch(expr.op){
			case '+':
				return lval + rval;
			case '-':
				return lval - rval;
			case '*':
				return lval * rval;
			case '/':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				return Math.floor(lval / rval);
			case '%':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				return lval % rval;
			case '&':
				return lval & rval;
			case '|':
				return lval | rval;
			case '^':
				return lval ^ rval;
			case '<<':
				return lval << rval;
			case '>>':
				return lval >> rval;

			default:
				throw new AppError(`Unknown operator of expression: ${expr.op}`, expr.loc);
		}
	}

    visitBCompExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);

		if(has(lval, "address")){
			lval = this.memsim.readSymValue(lval); // get the value
		}

		if(has(rval, "address")){
			rval = this.memsim.readSymValue(rval); // get the value
		}

		// concrete operations
		switch(expr.op){
			case '==':
				return lval == rval;
			case '!=':
				return lval != rval;
			case '<':
				return lval < rval;
			case '>':
				return lval > rval;
			case '<=':
				return lval <= rval;
			case '>=':
				return lval >= rval;

			default:
				throw new AppError(`Unknown operator of expression: ${expr.op}`, expr.loc);
		}

	}

    visitBLogicExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);

		if(has(lval, "address")){
			lval = this.memsim.readSymValue(lval); // get the value
		}

		if(has(rval, "address")){
			rval = this.memsim.readSymValue(rval); // get the value
		}

		// concrete operations
		switch(expr.op){
			case '||':
				return lval || rval;
			case '&&':
				return lval && rval;

			default:
				throw new AppError(`Unknown operator of expression: ${expr.op}`, expr.loc);
		}
	}

	visitBreak(br){

	}

    visitCastExpr(expr){

	}

	visitCExpr(expr){
		switch(expr.type){
			case "s_literal":
				const ret = Array.from(expr.value.slice(1, -1));
				ret.push('\0');
				return ret;
			case "i_constant":
				return parseInt(expr.value);
			case "f_constant":
				return parseFloat(expr.value);
			default:
				throw new AppError("wrong expr.type format while interpreting");
		}
	}

    visitCondExpr(expr){

	}

	visitContinue(cont){

	}

	visitCStmt(stmt){
		let sf = new StackFrame(stmt.symtbptr, stmt, this.#callStack.getParentSF(stmt.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.push(sf);

		for(const construct of stmt.sequence){
			if(this.#_instrNum > this.#breakstop) return;
			this.pc = construct;
			construct.accept(this);
		}

		if(this.#_instrNum > this.#breakstop) return;
		this.#callStack.pop();
	}

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		const symbol = declarator.accept(this);

		let value = null;
		if(initializer){
			value = initializer.accept(this);
		}

		symbol.interpreted = true;

		if(this.#callStack.top().symtable.scopeInfo.type == "global"){
			if(!initializer){
				this.memsim.setSymValue(symbol, 0, MEMREGION.BSS);
			}else{
				this.memsim.setSymValue(symbol, value, MEMREGION.DATA);
			}
		}else{
			if(!initializer){
				this.memsim.setSymValue(symbol, null, MEMREGION.BSS);
			}else{
				this.memsim.setSymValue(symbol, value, MEMREGION.STACK);
			}
		}
	}

	visitDeclarator(declarator){
		// finds the symbol and returns it
		// honestly dont remember what I wanted to do with the kind information... maybe its just useless and all I need is the symbol object
		// ! be careful, the symbol value returned from callstack is object without functions (but that shouldn't be a problem)
		switch(declarator.kind){
			case DECLTYPE.PTR:{
				while(declarator.kind != DECLTYPE.ID){
					declarator = declarator.child;
				}
				return this.#callStack.top().lookup(NAMESPACE.ORDS, declarator.identifier.name);
			}

			case DECLTYPE.ID:
				return this.#callStack.top().lookup(NAMESPACE.ORDS, declarator.identifier.name);

			case DECLTYPE.ARR:{
				while(declarator.kind != DECLTYPE.ID){
					declarator = declarator.child;
				}
				return this.#callStack.top().lookup(NAMESPACE.ORDS, declarator.identifier.name);
			}
		}
	}

    visitDesignator(designator){

	}

    visitDoWhileLoop(loop){
		let sf = new StackFrame(loop.symtbptr, loop, this.#callStack.getParentSF(loop.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.push(sf);

		let condition = true;
		loop: for(;;){ // the for loop is there only as a label
			if(condition){
				if(this.#_instrNum > this.#breakstop) return;
				if(isclass(loop.body, "CStmt")){
					for(const construct of loop.body.sequence){
						if(this.#_instrNum > this.#breakstop) return;
						this.pc = construct;
						construct.accept(this);
					}
				}else{
					if(this.#_instrNum > this.#breakstop) return;
					this.pc = loop.body;
					loop.body.accept(this);
				}

				// check if iteration expression should be interpreted
				// evaluate at the end of every new body run
				if(this.#_instrNum > this.#breakstop) return;
				if(Array.isArray(loop.cond)){
					this.pc = loop.cond[0];
				}else{
					this.pc = loop.cond;
				}
				condition = this.evaluateExprArray(loop.cond);
				if(!condition) break;

				continue loop;
			}else{
				break;
			}
		}

		this.#callStack.pop();
	}

    visitEnum(enumerator){

	}

	visitFnc(fnc, args){
		if(this.#_instrNum > this.#breakstop) return;

		let sfParams = new StackFrame(fnc.symtbptr, fnc, this.#callStack.getParentSF(fnc.symtbptr)); // StackFrame creates deep copy of symbol table

		// initialize symbols and assign addresses
		if(!sfParams.empty()){
			for(const [[name, sym], arg] of zip(sfParams.symtable.objects, args)){
				let val = this.evaluateExprArray(arg);
				if(has(val, "address")) val = this.memsim.readSymValue(val);
				this.memsim.setSymValue(sym, val, MEMREGION.STACK);
				sym.interpreted = true;
			}
		}

		this.#callStack.push(sfParams);

		try{
			fnc.body.accept(this); // run body
		}catch(ret){ // catch return
			if(ret instanceof Error){ // in case of too much recursion, run-time errors, ...
				throw ret;
			}

			// TODO fix function returning pointer to void function e.g. void (*getFunction())(void)
			//if(this.#_instrNum > this.#breakstop) return;
			//if(fnc.returnType.includes("void")) return null; // force return void on functions with specifier void

			if(isclass(ret.value, "ReturnVoid")){
				if(this.#_instrNum > this.#breakstop) return;
				this.#callStack.pop(); // pop param symtable
				return null;
			}

			if(this.#_instrNum > this.#breakstop) return;
			this.#callStack.pop(); // pop param symtable
			return ret.value;
		}

		if(this.#_instrNum > this.#breakstop) return;
		this.#callStack.pop(); // pop param symtable
	}

	visitFncCallExpr(callExpr){
		let callee = callExpr.expr.accept(this); // callee should in the end derive to (return) identifier or pointer to the function

		if(!callee) return; // this can happen if the code returns because of breakstops (and this is probably the easiest fix I found)
		if(!callee.name){
			throw new RTError("Callee is not an identifier", callExpr);
		}

		const fncPtr = this.#symtableGlobal.lookup(NAMESPACE.ORDS, callee.name);
		return fncPtr.astPtr.accept(this, callExpr.arguments);
	}

	visitForLoop(loop){
		let sf = new StackFrame(loop.symtbptr, loop, this.#callStack.getParentSF(loop.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.push(sf);

		// init
		this.evaluateExprArray(loop.init);

		let condition;
		loop: for(;;){ // the for loop is there only as a label
			// evaluate at the beginning of every new loop run
			if(this.#_instrNum > this.#breakstop) return; //?? same ??
			this.pc = loop; //?? question - should this be stopped and shown the interpretation of for head separately ??
			condition = this.evaluateExprArray(loop.cond);

			if(condition){
				if(this.#_instrNum > this.#breakstop) return;
				if(isclass(loop.body, "CStmt")){
					for(const construct of loop.body.sequence){
						if(this.#_instrNum > this.#breakstop) return;
						this.pc = construct;
						construct.accept(this);
					}
				}else{
					if(this.#_instrNum > this.#breakstop) return;
					this.pc = loop.body;
					loop.body.accept(this);
				}

				// check if iteration expression should be interpreted
				condition = this.evaluateExprArray(loop.cond);
				if(!condition) break;

				// iteration expression
				if(this.#_instrNum > this.#breakstop) return;
				this.evaluateExprArray(loop.itexpr);

				continue loop;
			}else{
				break;
			}
		}

		this.#callStack.pop();
	}

	visitGoto(gt){

	}

    visitIStmt(stmt){

	}

	visitIdentifier(id){
		let sym = this.#symtableGlobal.lookup(NAMESPACE.ORDS, id.name);

		// lookup can return undefined, so check that first (x?.y)
		if(sym?.isFunction) return id;

		sym = this.#callStack.top().resolve(id.name);
		return sym;
	}

	visitIfStmt(stmt){
		let decision = this.evaluateExprArray(stmt.expr);
		if(decision == false){
			if(stmt.sfalse){ // it can be null in case of no else
				stmt.sfalse.accept(this);
			}
		}else{
			if(isclass(stmt.strue, "CStmt")){ // in case of brackets around statement (...if(true){...}...)
				stmt.strue.accept(this);
			}else{ // in case of no brackets (...if(true) printf()...)
				this.evaluateExprArray(stmt.strue);
			}
		}
	}

	visitInitializer(initializer){
		switch(initializer.kind){
			case INITTYPE.EXPR:
				let val = this.evaluateExprArray(initializer.expr);
				if(has(val, "address")) val = this.memsim.readSymValue(val);
				return val;
			case INITTYPE.ARR:
				const arr = initializer.toJSArray(this);
				console.log(arr);
				for(let val of arr){
					if(has(val, "address")) val = this.memsim.readSymValue(val);
				}
				return arr;
			case INITTYPE.STRUCT:
				break;
			// no more nested, was taken care of while creating the AST
			default:
				throw new AppError(`Unknown initializer kind (interpreter): ${initializer.kind}`, initializer.loc);
		}
	}

    visitJStmt(stmt){

	}

	visitLabelName(label){

	}

	visitLStmt(stmt){

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
		if(this.#_instrNum > this.#breakstop) return;

		// return only most right-hand expression, evaluate rest
		// when expression is returned get the right-most operand to return and evaluate the left-hand operand
		var expr = ret.expr;
		// check if function has void signature if yes just to this (ignore return value)
		if(expr == null) throw new ReturnThrow(new ReturnVoid(ret.loc)); // in case of empty return (void return)

		expr = this.evaluateExprArray(expr); // resolve the expression (last is returned)
		if(has(expr, "address")) expr = this.memsim.readSymValue(expr);

		// this breakstop is causing some weird behavior at the end of main, maybe remove it
		if(this.#_instrNum > this.#breakstop) return;
		this.pc = ret;

		throw new ReturnThrow(expr);
	}

    visitSStmt(stmt){

	}

    visitStruct(struct){

	}

    visitSubscriptExpr(expr){
		let indices = [this.evaluateExprArray(expr.expr)];
		let exprCopy = expr.pointer;
		let symbol;

		while(exprCopy != null){
			let val;
			if(exprCopy.expr){
				val = this.evaluateExprArray(exprCopy.expr);
			}else{  // last in the chain is identifier
				val = this.evaluateExprArray(exprCopy);
				if(has(val, "address")) symbol = val;
				break;
			}

			indices.push(val);
			exprCopy = exprCopy.pointer;
		};

		const flatIndex = indices.reduce((res, item) => res *= (item + 1), 1) - 1;

		const dummySym = structuredClone(symbol);
		dummySym.dimension = 0;
		dummySym.address = symbol.addresses[flatIndex];

		return dummySym;
	}

	visitSwitchStmt(stmt){

	}

    visitTagname(tagname){

	}

    visitTypedef(typedef){

	}

    visitUExpr(expr){
		//TODO POSTFIX AND PREFIX DIFFERENTIATION
		let symbol = this.evaluateExprArray(expr.expr);

		switch(expr.op){
			case '+':
				return this.memsim.readSymValue(symbol);
			case '-':
				return -this.memsim.readSymValue(symbol);
			case '++':
				this.memsim.setSymValue(symbol, this.memsim.readSymValue(symbol) + 1, MEMREGION.STACK);
				break;
			case '--':
				this.memsim.setSymValue(symbol, this.memsim.readSymValue(symbol) - 1, MEMREGION.STACK);
				break;
			case '!':
				return !this.memsim.readSymValue(symbol);
			case '~':
				return ~this.memsim.readSymValue(symbol);
			case '*': {
				if(has(symbol, "address")){
					/* Hmmm, this kind of works, but I think having
					 * separate readValueAtAddress(memsize) function
					 * would be nicer tbh */
					const dummySym = {
						memtype: symbol.memtype,
						address: this.memsim.readSymValue(symbol)
					}
					return this.memsim.readPrimitiveValue(dummySym);
				}
				throw new RTError(`Value ${symbol} does not have an address`, expr.loc);
			}
			case '&': {
				if(has(symbol, "address")) return symbol.address;
				throw new RTError(`Value ${symbol} does not have an address`, expr.loc);
			} 
			default:
				throw new AppError(`Unknown operator of UExpr: ${expr.op}`, expr.loc);
		}
	}

    visitUnion(union){

	}

	visitWhileLoop(loop){
		let sf = new StackFrame(loop.symtbptr, loop, this.#callStack.getParentSF(loop.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.push(sf);

		let condition;
		loop: for(;;){ // the for loop is there only as a label
			// evaluate at the beginning of every new loop run
			if(this.#_instrNum > this.#breakstop) return;
			this.pc = loop;
			condition = this.evaluateExprArray(loop.cond);

			if(condition){
				if(this.#_instrNum > this.#breakstop) return;
				if(isclass(loop.body, "CStmt")){
					for(const construct of loop.body.sequence){
						if(this.#_instrNum > this.#breakstop) return;
						this.pc = construct;
						construct.accept(this);
					}
				}else{
					if(this.#_instrNum > this.#breakstop) return;
					this.pc = loop.body;
					loop.body.accept(this);
				}

				// check if iteration expression should be interpreted
				condition = this.evaluateExprArray(loop.cond);
				if(!condition) break;

				continue loop;
			}else{
				break;
			}
		}

		this.#callStack.pop();
	}

	/******************************
	 * Built-in visitor funcitons *
	 *****************************/
	visitPrintF(printF, args){
		if(args.length < 1){
			throw new RTError("printf requires at least one argument (format string)");
		}

		let formatString = args[0].accept(this);  // Resolve format argument (CExpr will return value)
		formatString = formatString.slice(0, -1).join('') // string is returned as an array
		let otherArgs = args.slice(1).map(arg => arg.accept(this));
		otherArgs = otherArgs.map(arg => has(arg, "address") ? this.memsim.readSymValue(arg) : arg);

		let i = 0;

		let output = formatString.replace(/%[dfsp]/g, match => { // currently supported: %d, %s, %f, %p
			if (i >= otherArgs.length) {
				throw new RTError("Not enough arguments for printf");
			}
			return  match === "%d" ? parseInt(otherArgs[i++]) :
					match === "%f" ? parseFloat(otherArgs[i++]) :
					match === "%s" ? String(otherArgs[i++]) :
					match === "%p" ? "0x" + otherArgs[i++].toString(16) :
					match;
		});

		output = output.replace(/\\n/g, "<br>"); // replace \n for <br>, maybe add tab and other special characters in the future :-) would be nice, complete list is in jisonlex ES
		output = output.replace(/\\\\/g, "\\"); // replace \\ for \

		this.output += output;
		return 0; // printf in C returns 0 by default
	}

	/************************************
	 *          Helper functions        *
	 ***********************************/

	/**
	 * All expression could be returned as an array, that is by design of the C language.
	 * This function exists to make it easier to evaluate any expression in interpreter.
	 * @param {Array.<Expr>} expr
	 * @return {}
	 */
	evaluateExprArray(expr){
		let ret;
		if(Array.isArray(expr)){
			for(const subexpr of expr){
				ret = subexpr.accept(this);
			}
		}else{
			ret = expr.accept(this);
		}

		return ret;
	}

	/**
	 * Determines and returns size of a type in bytes
	 * @param {DATATYPE} datatype
	 * @return {integer}
	 */
	sizeof(datatype){
		return MEMSIZES[datatype];
	}

	/**
	 * Refreshes cached symbols stored in parser
	 * @private
	 */
	#refreshSymbols(){
		this.#parser.Parser.prototype.yy.symbols = { types: [], enums: [] }; //? make this a class perhaps
	}

	/**
	 * Updates HTML to display interpreter output and generated structure
	 * @param {Object|integer|string} result Result of main
	 * @todo If needed, pass the element (HTML) ids as arguments
	 */
	updateHTML(result){
		if(JSONEDITeditorAST && JSONEDITeditorTYPEDEFS){
			JSONEDITeditorAST.set(JSON.parse(JSON.stringify(this.#ast))); // due to symtable now being attached to nodes, I cannot print it because of recursive references
			JSONEDITeditorTYPEDEFS.set(this.userTypes.concat(this.userEnums));
		}
		//document.getElementById("ast").innerHTML = JSON.stringify(this.#ast, null, 2); // old way of printing AST
		//document.getElementById("typedefs").innerHTML = JSON.stringify(this.userTypes.concat(this.userEnums), null, 2); // old way of printing typedefs
		document.getElementById("programCounter").innerHTML = "Step: " + (this.#breakstop == Infinity ? "end" : this.#breakstop);
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print();
		document.getElementById("warnings").innerHTML = this.#warningSystem.print();
		document.getElementById("console-output").innerHTML = this.output;

		const resultDiv = document.getElementById("result");

		// reset result element
		resultDiv.innerHTML = "";
		const classes = resultDiv.classList;
		const classesToRemove = Array.from(classes).filter(className => className.startsWith("bg-"));
		classesToRemove.forEach(className => resultDiv.classList.remove(className))
		
		// add result/error depending on type returned from main (result arg)
		if(result != undefined && result != null){;
			resultDiv.innerHTML = "Result: \n";
			if(isclass(result, "ReturnVoid")){
				resultDiv.innerHTML += "void";
				resultDiv.classList.add("bg-success");
			}else if(isclass(result, "SError") || isclass(result, "RTError")){
				// make text "on line x" bold
				const regex = /on line \d+/g;
				const formattedText = result.message.replace(regex, (match) => {
					return `<kbd class="fw-bolder">${match}</kbd>`;
				});
				resultDiv.innerHTML += formattedText;
				resultDiv.classList.add("bg-danger");
			}else if(isclass(result, "AppError") || result instanceof Error){
				resultDiv.classList.add("bg-secondary");
				resultDiv.innerHTML += "App Error. Who shot himself in the foot? The developer.\nTry sending him this message: \n<kbd>" + result + "</kbd>";
			}else{
				resultDiv.innerHTML += result;
				resultDiv.classList.add("bg-success");
			}
		}

		// create new marker
		/*if(this.pcloclast > 0){
			let rangeJI = new Range(this.pcloclast - 1, 0, this.pcloclast - 1, 1); // just interpreted
			let markerJI = editor.getSession().addMarker(rangeJI, "rangeJI", "fullLine");
		}*/
		let rangeTBI = new Range(this.pcloc - 1, this.pclocColStart, this.pcloc - 1, this.pclocColEnd); // Just interpreted
		let markerTBI = editor.getSession().addMarker(rangeTBI, "rangeJI", "fullLine"); // "fullLine"/"text" last arg for whole line/part of line being highlighted
	}

	/**
	 * Resets the HTML content to empty string.
	 * @public
	 * @todo If needed, pass the element (HTML) ids as arguments
	 */
	resetHTML(){
		if(document.getElementById("console-output")){
			document.getElementById("console-output").innerHTML = "";
		}
	}
}

/**
 * @class ReturnThrow
 * @description Class which can be thrown to return a value from function. Use in visitReturn.
 * @param {Construct} construct
 */
class ReturnThrow {
	constructor(construct){
		this.loc = construct.loc;
		this.value = construct;
	}
}

/**
 * @class ReturnThrow
 * @description Class which can be thrown to return a value from function. Use in visitReturn.
 * @param {Object} loc
 */
class ReturnVoid {
	constructor(loc){
		this.loc = loc;
	}
	// this could maybe be the NOP class from expr.js?
}
