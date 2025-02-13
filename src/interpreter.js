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
		console.log(construct);
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
		for(const construct of ast){
			construct.accept(this.#semanticAnalyzer);
		}
		
		const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");
		if(mainFnc){
			if(mainFnc.type != SYMTYPE.FNC){
				throw new SError("main is not a function");
			}
		}else{
			throw new SError("Undefined reference to main()")
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
		this.#breakstop = breakstop; // get breakstop from user (HTML)

		const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");

		if(breakstop > 0){
			this.pc = mainFnc.astPtr.body.sequence[0]; // get the first construct of the sequence statement
			mainFnc.astPtr.body.accept(this);
		}
		
		this.updateHTML();
		return this.#symtableGlobal.print();//TODO change this to return result of main()
	}

	/*******************************
	 *     VISITOR FUNCTIONS       *
	 *******************************/

	visitDeclaration(declaration){
		this.pc = declaration;

		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		declarator.accept(this);
	}

	visitDeclarator(declarator){

	}

	visitIdentifier(id){

	}

	visitCStmt(stmt){
		// this is kind of ugly but it works really well

		var iNum = 0;
		var construct = stmt.sequence[iNum];

		while(construct && this.#_instrNum <= this.#breakstop){ // construct can be null so that's the reason for while
			construct.accept(this);

			this.updateHTML();

			iNum++;
			construct = stmt.sequence[iNum];
		}
		
		// V-- changing scopes will be done in call stack
		//! this.#symtableStack.peek().children.pop() // removes child not longer used (scope went out of its life)
	}

	visitFnc(fnc){
		if(this.#_instrNum <= this.#breakstop){ // this is for the first call of main
			fnc.body.accept(this); // run body
		}
	}

	visitTypedef(typedef){

	}

	visitFncCallExpr(fncCall){
		//TODO create call stack!
		// but well this is the jist of it
		this.pc = fncCall;

		const fnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, fncCall.expr.name);
		fnc.astPtr.accept(this);
	}

	visitReturn(ret){

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
		document.getElementById("programCounter").innerHTML = "Step: " + this.#breakstop;
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print();
		document.getElementById("warnings").innerHTML = this.#warningSystem.print();

		unhighlight(); // global function, defined in index.html

		// create new marker
		if(this.pcloclast > 0){
			var rangeJI = new Range(this.pcloclast - 1, 0, this.pcloclast - 1, 1); // just interpreted 
			var markerJI = editor.getSession().addMarker(rangeJI, "rangeJI", "fullLine");
		}
		var rangeTBI = new Range(this.pcloc - 1, 0, this.pcloc - 1, 1); // to be interpreted
		var markerTBI = editor.getSession().addMarker(rangeTBI, "rangeTBI", "fullLine");
	}
}
