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
		this.#symtableStack = new Stack();
		this.#symtableStack.push(this.#symtableGlobal);

		this.#warningSystem = new WarningSystem();
		this.#semanticAnalyzer = new Semantic(this.#symtableStack, this.#warningSystem);
		this.#callStack = new CallStack();
		this.#memsim = new Memsim();
		this.#memviz = new Memviz();
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
	 * @private
	 * @type {Memsim}
	 */
	#memsim;

	/**
	 * Memory visualizer
	 * @private
	 * @type {Memviz}
	 */
	#memviz;

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
		return this;
	}

	/**
	 * Semantic analysis of AST
	 * @throws {SError} Semantic error
	 * @param {AST} ast
	 */
	semantic(ast){
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
	}

	/**
	 * Single function that prepares ("""compiles""") the C code
	 * @param {string} code Code to be "compiled"
	 * @throws {Error}
	 */
	compile(code){
		this.parse(code).semantic(this.#ast);
	}

	/**
	 * Interprets ast (for now, maybe do IC later -- like much much later)
	 * @throws {RTError} Runtime error
	 * @param {AST} ast
	 * @TODO catch what main returns (int)
	 * @return {integer} result of main function
	 */
	interpret(breakstop){
		console.log("=========================================");
		this.#breakstop = breakstop; // get breakstop from user (HTML)

		const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");
		let result = new ReturnVoid();

		if(breakstop > 0){
			this.pc = mainFnc.astPtr.body.sequence[0]; // get the first construct of the sequence statement (for visualization)
			try{
				mainFnc.astPtr.body.accept(this);
			}catch(ret){ // catch return value of main
				result = ret;
			}
		}
		
		this.updateHTML();
		console.log("=========================================");
		return result;
	}

	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		this.pc = declaration;

		const declarator = declaration.declarator;
		const initializer = declaration.initializer;
	}

	visitDeclarator(declarator){

	}

	visitTypedef(typedef){

	}

	visitIdentifier(id){
		return id;
	}

	visitCStmt(stmt){
		for(const construct of stmt.sequence){
			if(this.#_instrNum > this.#breakstop) return;
			construct.accept(this);

			this.updateHTML();
		}

		// V-- changing scopes will be done in call stack
		//! this.#symtableStack.peek().children.pop() // removes child not longer used (scope went out of its life)
	}

	visitFnc(fnc){
		if(this.#_instrNum > this.#breakstop) return; // this is for the first call of main

		try{
			fnc.body.accept(this); // run body
		}catch(ret){ // catch return
			if(isclass(ret.value, "ReturnVoid")){ // maybe change the void to some struct
				return null;
			}
			return ret.value;
		}
	}

	visitFncCallExpr(callExpr){
		var callee = callExpr.expr.accept(this); // callee should in the end return identifier or pointer to the function

		if(this.#_instrNum > this.#breakstop) return;
		this.pc = callExpr;

		if(!callee.name){
			throw new RTError("Callee is not an identifier", callExpr);
		}

		const fncPtr = this.#symtableGlobal.lookup(NAMESPACE.ORDS, callee.name);
		return fncPtr.astPtr.accept(this);
	}

	visitReturn(ret){
		if(this.#_instrNum > this.#breakstop) return;
		this.pc = ret;

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

	visitCExpr(expr){
		this.pc = expr; // remove this later
		return expr;
	}
















	/************************************
	 *          Helper functions        *
	 ***********************************/

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
		JSONEDITeditorAST.set(this.#ast);
		JSONEDITeditorTYPEDEFS.set(this.userTypes.concat(this.userEnums));
		//document.getElementById("ast").innerHTML = JSON.stringify(this.#ast, null, 2); // old way of printing AST
		//document.getElementById("typedefs").innerHTML = JSON.stringify(this.userTypes.concat(this.userEnums), null, 2); // old way of printing typedefs
		document.getElementById("programCounter").innerHTML = "Step: " + (this.#breakstop == Infinity ? "end" : this.#breakstop);
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print();
		document.getElementById("warnings").innerHTML = this.#warningSystem.print();

		unhighlight(); // global function, defined in index.html

		// create new marker
		if(this.pcloclast > 0){
			let rangeJI = new Range(this.pcloclast - 1, 0, this.pcloclast - 1, 1); // just interpreted 
			let markerJI = editor.getSession().addMarker(rangeJI, "rangeJI", "fullLine");
		}
		let rangeTBI = new Range(this.pcloc - 1, 0, this.pcloc - 1, 1); // to be interpreted
		let markerTBI = editor.getSession().addMarker(rangeTBI, "rangeTBI", "fullLine");
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
