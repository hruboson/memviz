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
	get symtableGlobal(){
		return this.#symtableGlobal;
	}

	/**
	 * Symtable stack (mostly for printing reason)
	 */
	#symtableStack;
	get symtableStack(){
		return this.#symtableStack;
	}

	/**
	 * Call stack
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
	 */
	memsim;

	/**
	 * Memory visualizer
	 * @type {Memviz}
	 */
	memviz;

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

			this.#_pcloc = construct.loc.first_line;
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
		this.updateHTML();
		return this;
	}

	/**
	 * Semantic analysis of AST
	 * @throws {SError} Semantic error
	 * @param {AST} ast
	 */
	semantic(ast){
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
	 * @TODO catch what main returns (int)
	 * @return {integer} result of main function
	 */
	interpret(breakstop){
		this.resetHTML(); // resets console output

		this.#breakstop = breakstop; // get breakstop from user (HTML)

		const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");
		let result = new ReturnVoid();

		// initialize global variables
		for(const [name, symbol] of this.#symtableGlobal.objects){
			if(symbol.isFunction) continue;
			if(symbol.isNative) continue; // skip built-in functions
			symbol.astPtr.accept(this);
		}

		if(breakstop > 0){
			try{
				this.pc = mainFnc.astPtr;
				mainFnc.astPtr.accept(this, [1, 1]); //TODO args from UI
			}catch(ret){ // catch return value of main
				//TODO fix this, I don't think it actually does what it's supposed to, maybe it does but it definitely doesn't check errors
				result = ret;
			}
		}

		this.updateHTML();
		this.memviz.updateHTML();
		//this.memsim.printMemory();
		return result;
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

		console.log(lval, expr.op, rval);
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

		console.log(lval, expr.op, rval);
	}

    visitBCompExpr(expr){

	}

    visitBLogicExpr(expr){

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

	visitCStmt(stmt){
		let sf = new StackFrame(stmt.symtbptr, stmt, this.#callStack.getParentSF(stmt.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.push(sf);

		for(const construct of stmt.sequence){
			if(this.#_instrNum > this.#breakstop) return;
			this.pc = construct;
			construct.accept(this);

			this.updateHTML();
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
			if(initializer.kind == INITTYPE.EXPR && Array.isArray(value)){
				value = this.memsim.initializeArray(symbol.memtype, value, MEMREGION.DATA); // returns address
			}
		}

		symbol.interpreted = true;

		if(this.#callStack.top().symtable.scopeInfo.type == "global"){
			if(!initializer){
				this.memsim.setSymValue(symbol, value, MEMREGION.BSS);
			}else{
				this.memsim.setSymValue(symbol, value, MEMREGION.DATA);
			}
		}else{
			if(!initializer){
				this.memsim.setSymValue(symbol, value, MEMREGION.BSS);
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

    visitEStmt(stmt){

	}

    visitEnum(enumerator){

	}

    visitExpr(expr){

	}

	visitFnc(fnc, args){
		if(this.#_instrNum > this.#breakstop) return;

		let sfParams = new StackFrame(fnc.symtbptr, fnc, this.#callStack.getParentSF(fnc.symtbptr)); // StackFrame creates deep copy of symbol table

		// initialize symbols and assign addresses
		if(!sfParams.empty()){
			for(const [[name, sym], arg] of zip(sfParams.symtable.objects, args)){
				this.memsim.setSymValue(sym, arg.accept(this), MEMREGION.STACK);
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
		var callee = callExpr.expr.accept(this); // callee should in the end derive to (return) identifier or pointer to the function

		if(this.#_instrNum > this.#breakstop) return;

		if(!callee.name){
			throw new RTError("Callee is not an identifier", callExpr);
		}

		const fncPtr = this.#symtableGlobal.lookup(NAMESPACE.ORDS, callee.name);
		return fncPtr.astPtr.accept(this, callExpr.arguments);
	}

    visitIStmt(stmt){

	}

	visitIdentifier(id){
		let sym = this.symtableGlobal.lookup(NAMESPACE.ORDS, id.name);

		// lookup can return undefined, so check that first (x?.y)
		if(sym?.isFunction) return id;

		sym = this.#callStack.top().resolve(id.name);
		return this.memsim.readSymValue(sym);
	}

	visitInitializer(initializer){
		switch(initializer.kind){
			case INITTYPE.EXPR:
				return initializer.expr.accept(this);
			case INITTYPE.ARR:
				return initializer.toJSArray(this);
			case INITTYPE.STRUCT:
				break;
			// no more nested, was taken care of while creating the AST
			default:
				throw new AppError(`Unknown initializer kind (interpreter): ${initializer.kind}`);
		}
	}

    visitJStmt(stmt){

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
		// check if function has void signature if yes just to this (ignore return value) ---V the function should be on callstack -> DO THAT FIRST (I know it's a pain in the ass)
		if(expr == null) throw new ReturnThrow(ret.loc, new ReturnVoid()); // in case of empty return (void return)

		if(expr.length > 1){
			for(let i = 0; i < expr.length - 1; i++){
				if(this.#_instrNum > this.#breakstop) return;
				expr[i].accept(this);
			}

			expr = expr[expr.length - 1];
		}else if(expr.length == 1){
			expr = expr[expr.length - 1];
		}

		expr = expr.accept(this); // resolve the last expression

		if(this.#_instrNum > this.#breakstop) return;
		throw new ReturnThrow(expr);
	}

    visitSStmt(stmt){

	}

    visitStruct(struct){

	}

    visitSubscriptExpr(expr){

	}

    visitTagname(tagname){

	}

    visitTypedef(typedef){

	}

    visitUExpr(expr){

	}

    visitUnion(union){

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
		const otherArgs = args.slice(1)
			.map(arg => arg.accept(this))
			.filter(arg => arg !== undefined && !Number.isNaN(arg)); // this is probably fault in interpreter (maybe throw an error)

		let i = 0;

		let output = formatString.replace(/%[dsf]/g, match => { // currently supported: %d, %s, %f
			if (i >= otherArgs.length) {
				throw new RTError("Not enough arguments for printf");
			}
			return match === "%d" ? parseInt(otherArgs[i++]) :
				match === "%f" ? parseFloat(otherArgs[i++]) :
					match === "%s" ? String(otherArgs[i++]) :
						match;
		});

		output = output.replace(/\\n/g, "<br>"); // replace \n for <br>, maybe add tab and other special characters in the future :-) would be nice, complete list is in jisonlex ES
		output = output.replace(/\\\\/g, "\\"); // replace \\ for \

		// TODO make some nicer interface for console and visualizer output
		document.getElementById("console-output").innerHTML += output;
		return 0; // printf in C returns 0 by default
	}

	/************************************
	 *          Helper functions        *
	 ***********************************/

	/**
	 * Determines and returns size of a type in bytes
	 * @! CURRENTLY NOT USED!!!
	 */
	sizeof(str){
		switch(str){
			case "int":
				return INTSIZE; // defined in memory.js
			default:
				return CHARSIZE;
		}
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
	 * @todo If needed, pass the element (HTML) ids as arguments
	 */
	updateHTML(){
		JSONEDITeditorAST.set(JSON.parse(JSON.stringify(this.#ast))); // due to symtable now being attached to nodes, I cannot print it because of recursive references
		JSONEDITeditorTYPEDEFS.set(this.userTypes.concat(this.userEnums));
		//document.getElementById("ast").innerHTML = JSON.stringify(this.#ast, null, 2); // old way of printing AST
		//document.getElementById("typedefs").innerHTML = JSON.stringify(this.userTypes.concat(this.userEnums), null, 2); // old way of printing typedefs
		document.getElementById("programCounter").innerHTML = "Step: " + (this.#breakstop == Infinity ? "end" : this.#breakstop);
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print();
		document.getElementById("warnings").innerHTML = this.#warningSystem.print();

		unhighlight(); // global function, defined in index.html

		// create new marker
		/*if(this.pcloclast > 0){
			let rangeJI = new Range(this.pcloclast - 1, 0, this.pcloclast - 1, 1); // just interpreted
			let markerJI = editor.getSession().addMarker(rangeJI, "rangeJI", "fullLine");
		}*/
		let rangeTBI = new Range(this.pcloc - 1, 0, this.pcloc - 1, 1); // Just interpreted
		let markerTBI = editor.getSession().addMarker(rangeTBI, "rangeJI", "fullLine");
	}

	resetHTML(){
		document.getElementById("console-output").innerHTML = "";
	}
}

class ReturnThrow {
	constructor(construct){
		this.loc = construct.loc;
		this.value = construct;
	}
}

class ReturnVoid {
	// this could maybe be the NOP class from expr.js?
}
