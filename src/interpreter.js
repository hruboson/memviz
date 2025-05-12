/**
 * @file Interpreter file
 * @author Ondřej Hruboš
 */

/**
 * Global array of visitor functions, will aply to interpreter and semantic analyzer
 * @global
 * @const
 */
const ASTVISITORFUNCTIONS = [
	"visitArr",
	"visitBAssignExpr",
	"visitBArithExpr",
	"visitBCompExpr",
	"visitBLogicExpr",
	"visitBreak",
	"visitCExpr",
	"visitCStmt",
	"visitCaseStmt",
	"visitCastExpr",
	"visitCondExpr",
	"visitContinue",
	"visitDeclarator",
	"visitDeclaration",
	"visitDesignator",
	"visitDoWhileLoop",
	"visitEnum",
	"visitEnumerator",
	"visitFnc",
	"visitFncCallExpr",
	"visitForLoop",
	"visitGoto",
	"visitIStmt",
	"visitIdentifier",
	"visitIfStmt",
	"visitInitializer",
	"visitJStmt",
	"visitLabelName",
	"visitLStmt",
	"visitMemberAccessExpr",
	"visitNOP",
	"visitPtrMemberAccessExpr",
	"visitPointer",
	"visitReturn",
	"visitSizeOfExpr",
	"visitSStmt",
	"visitStruct",
	"visitSubscriptExpr",
	"visitSwitchStmt",
	"visitTagname",
	"visitTypedef",
	"visitUExpr",
	"visitUnion",
	"visitWhileLoop",
];

/**
 * Interpreter class, acts as a Visitor for AST
 * @description We are pretending to be "compiling" to target machine code. The interpreter first analyses the code using the Semantic analyzer and either throws
 * 				an error or allows for further interpretation of AST.
 * @class Interpreter
 */
class Interpreter {

	constructor(){ // todo move memviz to updateHTML only, I dont want any parameters here
		interfaces(this, ASTVISITORFUNCTIONS);

		this.#symtableGlobal = new Symtable("global", "global");
		this.#symtableStack = new Stack(); // only for semantic analyzer
		this.#symtableStack.push(this.#symtableGlobal);

		this.#warningSystem = new WarningSystem();
		this.#semanticAnalyzer = new Semantic(this.#symtableStack, this.#warningSystem);
		this.#memsim = new Memsim(this.#warningSystem);
		this.#callStack = new CallStack(this.#memsim);
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
	 * @private
	 */
	#memsim;

	/**
	 * Memory dump before final free
	 * @type {string}
	 * @public
	 */
	memdump_pre;

	/**
	 * Memory dump at the end of program (after final free)
	 * @type {string}
	 * @public
	 */
	memdump_end;

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
	 * Map of user typedefs
	 * @type {Map.<string, string>}
	 * @public
	 */
	userTypesMap;

	/**
	 * Flag symbolising whether the interpreter is looking for a label
	 * @type {boolean}
	 * @private
	 */
	#lookingForLabel = false;

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
		try{
			this.#refreshSymbols();
			this.#ast = this.#parser.parse(text);
		}catch(e){
			throw new PError(e.message);
		}
		this.userTypesMap = this.#parser.Parser.prototype.yy.userTypesMap;
		this.#semanticAnalyzer.attachUserTypesMap(this.userTypesMap);
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

		this.#callStack.pushSFrame(new StackFrame(this.#symtableGlobal), null, null); // add global symtable to call stack
	}

	/**
	 * Single function that prepares ("""compiles""") the C code
	 * @param {string} code Code to be "compiled"
	 * @throws {AppError|RTError}
	 */
	compile(code){
		try{
			this.parse(code).semantic(this.#ast);
		}catch(e){
			return e;
		}
	}

	/**
	 * Interprets ast (for now, maybe do IC later -- like much much later)
	 * @throws {RTError|AppError|InternalError} Runtime error
	 * @param {AST} ast
	 * @return {integer} result of main function
	 */
	interpret(breakstop){
		this.#breakstop = breakstop; // get breakstop from user (HTML)

		const mainFnc = this.#symtableGlobal.lookup(NAMESPACE.ORDS, "main");
		let result;

		// initialize global variables
		for(const [_, record] of this.#symtableGlobal.objects){
			if(record.isFunction) continue; // skip functions
			if(record.isNative) continue; // skip built-in functions
			if(record.type == "TYPEDEF") continue; // skip typedefs
			record.astPtr.accept(this);
		}

		// initialize strings
		for(const [_, stringRecord] of this.#semanticAnalyzer.stringTable){
			const record = new MemoryRecord();
			record.size = [stringRecord.toCArray().length];
			record.memtype = DATATYPE.uchar;
			record.determineSize();
			record.specifiers = ["char"];

			this.#memsim.setRecordValue(record, stringRecord.toCArray(), MEMREGION.DATA);

			this.#callStack.dFrame.add(record);

			// also set string address so we can find it in memory in visitCExpr
			stringRecord.address = record.address;
			stringRecord.addresses = record.addresses;
		}

		if(breakstop > 0){
			try{
				this.pc = mainFnc.astPtr;
				result = mainFnc.astPtr.accept(this, [1, 1]); //TODO args from UI

				/**
				 * free all remaining automatic storage memory
				 */

				// globals
				this.#callStack.popSFrame();

				// .data
				for(const record of [...this.#callStack.dFrame]){
					this.#memsim.free(record.address, record.memsize, record.region);
					this.#callStack.dFrame.remove(record);
				}
			}catch(ret){ // catch return value of main
				result = ret;
			}
		}

		this.memdump = this.#memsim.printMemory();
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
		let record; // record to store the value to

		rval = this.evaluateExprArray(expr.right);
		lval = this.evaluateExprArray(expr.left);


		if(isclass(lval, "PointerValue")){
			lval = this.#callStack.findMemoryRecord(lval.value);
		}

		if(has(lval, "address")){
			if(lval.memregion == MEMREGION.DATA){
				throw new RTError(`Bad permissions for mapped region at address ${lval.address}`, expr.loc);
			}
			record = lval;
			lval = this.#memsim.readRecordValue(lval); // get the value
			if(lval == undefined) lval = 0;
		}

		if(isclass(rval, "PointerValue")){
			rval = rval.value;
		}

		if(has(rval, "address")){
			if(rval.size.length < 1){
				rval = this.#memsim.readRecordValue(rval); // get the value
			}else{ // arrays
				rval = rval.address;
			}
		}

		let newMemregion = record.memregion;
		if(record.memregion == MEMREGION.BSS){
			newMemregion = MEMREGION.DATA;
			this.#memsim.free(record.address, record.memsize);
			record.address = null;
		}
		record.initialized = true;
		
		if(rval == undefined || rval == null){
			// this should maybe be in semantic analyzer
			throw new RTError(`Trying to assign uninitialized value`, expr.loc);
		}

		// concrete operations
		switch(expr.op){
			case '=':
				this.#memsim.setRecordValue(record, rval, newMemregion);
				break;
			case '+=':
				this.#memsim.setRecordValue(record, lval + rval, newMemregion);
				break;
			case '-=':
				this.#memsim.setRecordValue(record, lval - rval, newMemregion);
				break;
			case '*=':
				this.#memsim.setRecordValue(record, lval * rval, newMemregion);
				break;
			case '/=':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				this.#memsim.setRecordValue(record, lval / rval, newMemregion);
				break;
			case '%=':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				this.#memsim.setRecordValue(record, lval % rval, newMemregion);
				break;
			case '&=':
				this.#memsim.setRecordValue(record, lval & rval, newMemregion);
				break;
			case '|=':
				this.#memsim.setRecordValue(record, lval | rval, newMemregion);
				break;
			case '^=':
				this.#memsim.setRecordValue(record, lval ^ rval, newMemregion);
				break;
			case '<<=':
				this.#memsim.setRecordValue(record, lval << rval, newMemregion);
				break;
			case '>>=':
				this.#memsim.setRecordValue(record, lval >> rval, newMemregion);
				break;

			default:
				throw new AppError(`Unknown operator of expression: ${expr}`, expr.loc);
		}

		return this.#memsim.readRecordValue(record);
	}

    visitBArithExpr(expr){
		let rval = this.evaluateExprArray(expr.right);
		let lval = this.evaluateExprArray(expr.left);
		let coeVar = 1; // for pointer arithmetic
		let coeSide = "left";
		let isFloatOperation = false;

		isFloatOperation = 
			(typeof lval == "number" && !Number.isInteger(lval)) || 
			(typeof rval == "number" && !Number.isInteger(rval));

		if(has(lval, "address")){
			if(lval.indirection > 0){
				coeVar = MEMSIZES[lval.pointsToMemtype];
			}
			if(lval.size.length > 0){
				coeVar = MEMSIZES[lval.memtype];
				lval = lval.address;
			}else{
				if(lval.memtype == DATATYPE.double || lval.memtype == DATATYPE.float || lval.memtype == DATATYPE.longdouble ||
				   lval.casttype == DATATYPE.double || lval.casttype == DATATYPE.float || lval.casttype == DATATYPE.longdouble) isFloatOperation = true;
				lval = this.#memsim.readRecordValue(lval); // get the value
			}
		}

		if(has(rval, "address")){
			if(rval.indirection > 0){
				coeVar = MEMSIZES[rval.pointsToMemtype];
			}
			if(rval.size.length > 0){
				coeVar = MEMSIZES[rval.memtype];
				coeSide = "right";
				rval = rval.address;
			}else{
				if(rval.memtype == DATATYPE.double || rval.memtype == DATATYPE.float || rval.memtype == DATATYPE.longdouble ||
				   rval.casttype == DATATYPE.double || rval.casttype == DATATYPE.float || rval.casttype == DATATYPE.longdouble) isFloatOperation = true;

				rval = this.#memsim.readRecordValue(rval); // get the value
			}
		}

		// concrete operations
		switch(expr.op){
			case '+':
				if(Array.isArray(lval)) return lval[rval];
				if(coeSide == "left"){
					return lval + rval*coeVar;
				}else{
					return lval*coeVar + rval;
				}
			case '-':
				if(coeSide == "left"){
					return lval - rval*coeVar;
				}else{
					return lval*coeVar - rval;
				}
			case '*':
				return lval * rval;
			case '/':
				if(rval == 0) throw new RTError("Division by zero is undefined", expr.loc);
				if(isFloatOperation) return lval / rval;
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
			lval = this.#memsim.readRecordValue(lval); // get the value
		}

		if(isclass(lval, "PointerValue")){
			lval = lval.value;
		}

		if(has(rval, "address")){
			rval = this.#memsim.readRecordValue(rval); // get the value
		}

		if(isclass(rval, "PointerValue")){
			rval = rval.value;
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
			lval = this.#memsim.readRecordValue(lval); // get the value
		}

		if(isclass(lval, "PointerValue")){
			lval = lval.value;
		}

		if(has(rval, "address")){
			rval = this.#memsim.readRecordValue(rval); // get the value
		}

		if(isclass(rval, "PointerValue")){
			rval = rval.value;
		}

		// concrete operations
		switch(expr.op){
			case '||':
				return Boolean(lval || rval);
			case '&&':
				return Boolean(lval && rval);

			default:
				throw new AppError(`Unknown operator of expression: ${expr.op}`, expr.loc);
		}
	}

	visitBreak(br){
		/*if(this.#_instrNum > this.#breakstop) throw new StopFlag();
		this.pc = br; <-- this doesn't look too great on the visualization */
		throw new BreakThrow(br);
	}

    visitCastExpr(expr){
		const value = this.evaluateExprArray(expr.expr);
		const type = this.evaluateExprArray(expr.type);
		if(isclass(value, "PointerValue")){
			const record = this.#callStack.findMemoryRecord(value.value);
			if(record){
				record.beingPointedToBy = DATATYPE[type];
			}else{
				throw new RTError(`Trying to get a value of uninitialized memory`, expr.loc);
			}
		}
		if(has(value, "address")){
			const record = this.#callStack.findMemoryRecord(this.#memsim.readRecordValue(value));
			if(record) record.beingPointedToBy = DATATYPE[type]; // switch view (type punning)
			value.casttype = DATATYPE[type];
		}
		return value;
	}

	visitCExpr(expr){
		switch(expr.type){
			case "s_literal":
				const str = expr.value.slice(1, -1);
				const addr = this.#semanticAnalyzer.stringTable.get(str).address;
				const record = this.#callStack.dFrame.get(addr);
				return record;
			case "i_constant":
				if(expr.value == "NULL") return 0;
				if(expr.value.startsWith("0b")) return parseInt(expr.value.slice(2), 2);
				if(expr.value.startsWith("'") && expr.value.endsWith("'") && expr.value.length == 3) return expr.value.charCodeAt(1);
				if(expr.value == "'\\0'") return 0;
				return parseInt(expr.value);
			case "f_constant":
				return parseFloat(expr.value);
			default:
				throw new AppError("wrong expr.type format while interpreting");
		}
	}

    visitCondExpr(expr){
		const condition = this.evaluateExprArray(expr.condition);
		if(condition){
			return this.evaluateExprArray(expr.texpr);
		}else{
			return this.evaluateExprArray(expr.fexpr);
		}
	}

	visitContinue(cont){
		throw new ContinueThrow(cont);
	}

	visitCStmt(stmt){
		if(this.#lookingForLabel){ // goto block
			/**
			 * Now a bit of info on this goto shenanigans... as we all know goto in
			 * tree-walking interpret is super whacky. My solution is also kind of
			 * whacky but it works for small examples.
			 *
			 * How I solved this is I basically search every statement from top of
			 * function. If the label is found, the code continues from there.
			 * The global var #lookingForLabel is set when goto is first encountered
			 * and GotoThrow is thrown (which is handled in function body).
			 *
			 * This solution gets very slow with complex code structure, but that's
			 * not what this tool is for.
			 */
			for(const construct of stmt.sequence){
				try{
					if(isclass(construct, "LStmt")){
						if(construct.name != this.#lookingForLabel.name) continue;
						this.#lookingForLabel = false;

						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = construct;
						construct.accept(this);
					}else{
						if(this.#lookingForLabel){
							if(isclass(construct, "Stmt")
							|| isclass(construct, "CStmt")
							|| isclass(construct, "CaseStmt")
							|| isclass(construct, "SStmt")
							|| isclass(construct, "IfStmt")
							|| isclass(construct, "SwitchStmt")
							|| isclass(construct, "IStmt")
							|| isclass(construct, "ForLoop")
							|| isclass(construct, "WhileLoop")
							|| isclass(construct, "DoWhileLoop")){
								construct.accept(this);
							}
						}else{
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}
				}catch(t){
					throw t;
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

		let sf = new StackFrame(stmt.symtbptr, stmt, this.#callStack.getParentSF(stmt.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.pushSFrame(sf);

		for(const construct of stmt.sequence){
			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.pc = construct;

			try{
				construct.accept(this);
			}catch(t){ // construct can return prematurely
				if(isclass(t, "StopFlag")) throw t; // if it is just stop flag, throw it immediately, otherwise pop frame and throw result
				if(isclass(t, "GotoThrow")) throw t; // will be handled in fnc
				this.#callStack.popSFrame();
				throw t;
			}
		}

		if(this.#_instrNum > this.#breakstop) throw new StopFlag();
		this.#callStack.popSFrame();
	}

	visitCaseStmt(stmt){
		if(this.#lookingForLabel){ // goto if
			for(const construct of stmt.stmt){
				try{
					if(isclass(construct, "LStmt")){
						if(construct.name != this.#lookingForLabel.name) continue;
						this.#lookingForLabel = false;

						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = construct;
						construct.accept(this);
					}else{
						if(this.#lookingForLabel){
							if(isclass(construct, "Stmt")
							|| isclass(construct, "CStmt")
							|| isclass(construct, "CaseStmt")
							|| isclass(construct, "SStmt")
							|| isclass(construct, "IfStmt")
							|| isclass(construct, "SwitchStmt")
							|| isclass(construct, "IStmt")
							|| isclass(construct, "ForLoop")
							|| isclass(construct, "WhileLoop")
							|| isclass(construct, "DoWhileLoop")){
								construct.accept(this);
							}
						}else{
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}
				}catch(t){
					throw t;
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

		if(Array.isArray(stmt.stmt)){
			for(const construct of stmt.stmt){
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
				this.pc = construct;
				construct.accept(this);
			}
		}else{
			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.pc = stmt.stmt;
			stmt.stmt.accept(this);
		}
	}

	visitDeclaration(declaration){
		const declarator = declaration.declarator;
		const initializer = declaration.initializer;

		const symbol = declarator.accept(this);

		let value = null;
		let breakstop = false;
		if(initializer){
			let record;
			value = initializer.accept(this);

			// there could be a better way... tbh I have no idea why this is even allowed
			if(symbol.indirection < 1 && symbol.size.length > 0 && !Array.isArray(value)){ // non pointer arrays initialized with string (char hello[] = "Hello world";)
				record = this.#callStack.findMemoryRecord(value);
				if(record){
					value = this.#memsim.readRecordValue(record);
				}
			}else if(symbol.indirection > 0){
				record = this.#callStack.findMemoryRecord(value);
				if(record){
					record.beingPointedToBy = symbol.pointsToMemtype;
				}
			}

			const fncInitializer = initializer.expr?.expr?.name;
			if(fncInitializer){
				if(initializer.expr?.cType == "FncCallExpr" && !this.#symtableGlobal.lookup(NAMESPACE.ORDS, fncInitializer).isNative){
					breakstop = true;
				}
			}
		}

		symbol.interpreted = true;

		if(this.#callStack.topSFrame().symtable.scopeInfo.type == "global"){
			if(!initializer){
				this.#memsim.setRecordValue(symbol, 0, MEMREGION.BSS);
			}else{
				this.#memsim.setRecordValue(symbol, value, MEMREGION.DATA);
			}
		}else{
			if(!initializer){
				this.#memsim.setRecordValue(symbol, null, MEMREGION.STACK);
			}else{
				this.#memsim.setRecordValue(symbol, value, MEMREGION.STACK);
			}
		}

		if(breakstop){
			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.pc = declaration;
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
				return this.#callStack.topSFrame().lookup(NAMESPACE.ORDS, declarator.identifier.name);
			}

			case DECLTYPE.ID:
				return this.#callStack.topSFrame().lookup(NAMESPACE.ORDS, declarator.identifier.name);

			case DECLTYPE.ARR:{
				while(declarator.kind != DECLTYPE.ID){
					declarator = declarator.child;
				}
				return this.#callStack.topSFrame().lookup(NAMESPACE.ORDS, declarator.identifier.name);
			}
		}
	}

    visitDesignator(designator){

	}

    visitDoWhileLoop(loop){
		if(this.#lookingForLabel){ // goto block
			for(const construct of loop.body.sequence){
				try{
					if(isclass(construct, "LStmt")){
						if(construct.name != this.#lookingForLabel.name) continue;
						this.#lookingForLabel = false;

						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = construct;
						construct.accept(this);
					}else{
						if(this.#lookingForLabel){
							if(isclass(construct, "Stmt")
							|| isclass(construct, "CStmt")
							|| isclass(construct, "CaseStmt")
							|| isclass(construct, "SStmt")
							|| isclass(construct, "IfStmt")
							|| isclass(construct, "SwitchStmt")
							|| isclass(construct, "IStmt")
							|| isclass(construct, "ForLoop")
							|| isclass(construct, "WhileLoop")
							|| isclass(construct, "DoWhileLoop")){
								construct.accept(this);
							}
						}else{
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}
				}catch(t){
					throw t;
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

		let sf = new StackFrame(loop.symtbptr, loop, this.#callStack.getParentSF(loop.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.pushSFrame(sf);

		let condition = true;
		loop: for(;;){ // the for loop is there only as a label
			if(condition){
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
				try{
					if(isclass(loop.body, "CStmt")){
						for(const construct of loop.body.sequence){
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}else{
						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = loop.body;
						loop.body.accept(this);
					}
				}catch(t){
					if(isclass(t, "StopFlag")) throw t;
					if(isclass(t, "BreakThrow")) break;
					if(isclass(t, "ContinueThrow")) continue;
					throw t;
				}

				// check if iteration expression should be interpreted
				// evaluate at the end of every new body run
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
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

		this.#callStack.popSFrame();
	}

    visitEnum(enumerator){
	}

	visitEnumerator(enumerator){

	}

	visitFnc(fnc, args){
		if(this.#_instrNum > this.#breakstop) throw new StopFlag();

		let sfParams = new StackFrame(fnc.symtbptr, fnc, this.#callStack.getParentSF(fnc.symtbptr)); // StackFrame creates deep copy of symbol table

		// initialize symbols and assign addresses
		if(!sfParams.empty()){
			for(const [[name, sym], arg] of zip(sfParams.symtable.objects, args)){
				let val = arg;
				if(isclass(arg, "PointerValue")) val = arg.value;
				if(has(arg, "address")){ 
					if(arg.size.length < 1){
						val = this.#memsim.readRecordValue(arg);
					}else{ // arrays
						// array to pointer
						sym.indirection += 1;
						sym.dimension = 0;
						sym.pointer = true;
						sym.pointsToMemtype = arg.memtype;
						val = arg.address;
					}
				}
				this.#memsim.setRecordValue(sym, val, MEMREGION.STACK);
				sym.interpreted = true;
			}
		}

		this.#callStack.pushSFrame(sfParams);

		try{
			fnc.body.accept(this); // run body
			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame(); // pop param symtable
			return null;
		}catch(ret){ // catch return or goto
			let gtRet = undefined;
			do{
				if(isclass(ret, "GotoThrow")){
					try{
						fnc.body.accept(this);
					}catch(t){
						gtRet = t;
					}
				}
			}while(isclass(gtRet, "GotoThrow"));

			if(gtRet) ret = gtRet;

			if(ret instanceof Error){ // in case of too much recursion, run-time errors, ...
				throw ret;
			}


			// TODO fix function returning pointer to void function e.g. void (*getFunction())(void)
			//if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			//if(fnc.returnType.includes("void")) return null; // force return void on functions with specifier void

			if(isclass(ret.value, "ReturnVoid")){
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
				this.#callStack.popSFrame(); // pop param symtable
				return null;
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame(); // pop param symtable
			return ret.value;
		}
	}

	visitFncCallExpr(callExpr){
		let callee = callExpr.expr.accept(this); // callee should in the end derive to (return) identifier or pointer to the function

		if(!callee) return; // this can happen if the code returns because of breakstops (and this is probably the easiest fix I found)
		if(!callee.name){
			throw new RTError("Callee is not an identifier", callExpr);
		}

		const fncPtr = this.#symtableGlobal.lookup(NAMESPACE.ORDS, callee.name);
		let args = [];
		for(let arg of callExpr.arguments){
			let value = this.evaluateExprArray(arg);
			args.push(value);
		}

		const ret = fncPtr.astPtr.accept(this, args);

		return ret;
	}

	visitForLoop(loop){
		if(this.#lookingForLabel){ // goto block
			for(const construct of loop.body.sequence){
				try{
					if(isclass(construct, "LStmt")){
						if(construct.name != this.#lookingForLabel.name) continue;
						this.#lookingForLabel = false;

						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = construct;
						construct.accept(this);
					}else{
						if(this.#lookingForLabel){
							if(isclass(construct, "Stmt")
							|| isclass(construct, "CStmt")
							|| isclass(construct, "CaseStmt")
							|| isclass(construct, "SStmt")
							|| isclass(construct, "IfStmt")
							|| isclass(construct, "SwitchStmt")
							|| isclass(construct, "IStmt")
							|| isclass(construct, "ForLoop")
							|| isclass(construct, "WhileLoop")
							|| isclass(construct, "DoWhileLoop")){
								construct.accept(this);
							}
						}else{
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}
				}catch(t){
					throw t;
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

		let sf = new StackFrame(loop.symtbptr, loop, this.#callStack.getParentSF(loop.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.pushSFrame(sf);

		// init
		this.evaluateExprArray(loop.init);

		let condition;
		loop: for(;;){ // the for loop is there only as a label
			// evaluate at the beginning of every new loop run
			if(this.#_instrNum > this.#breakstop) throw new StopFlag(); //?? same ??
			this.pc = loop; //?? question - should this be stopped and shown the interpretation of for head separately ??
			condition = this.evaluateExprArray(loop.cond);

			if(condition){
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
				try{
					if(isclass(loop.body, "CStmt")){
						for(const construct of loop.body.sequence){
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}else{
						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						if(Array.isArray(loop.body)){ // short-hand for loop (without brackets)
							this.evaluateExprArray(loop.body);
						}else{
							this.pc = loop.body;
							loop.body.accept(this);
						}
					}
				}catch(t){
					if(isclass(t, "StopFlag")) throw t;
					if(isclass(t, "BreakThrow")) break;
					if(isclass(t, "ContinueThrow")) continue;
					throw t;
				}

				// check if iteration expression should be interpreted
				condition = this.evaluateExprArray(loop.cond);
				if(!condition) break;

				// iteration expression
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
				this.evaluateExprArray(loop.itexpr);

				continue loop;
			}else{
				break;
			}
		}

		this.#callStack.popSFrame();
	}

	visitGoto(gt){
		const label = gt.label.accept(this);
		this.#lookingForLabel = label;

		throw new GotoThrow(label);
	}

    visitIStmt(stmt){

	}

	visitIdentifier(id){
		let sym = this.#symtableGlobal.lookup(NAMESPACE.ORDS, id.name);

		// lookup can return undefined, so check that first (x?.y)
		if(sym?.isFunction) return id;

		sym = this.#callStack.topSFrame().resolve(id.name);

		return sym;
	}

	visitIfStmt(stmt){
		if(this.#lookingForLabel){ // this whole if is for goto
			if(isclass(stmt.sfalse, "CStmt")){
				for(const construct of stmt.sfalse.sequence){
					try{
						if(isclass(construct, "LStmt")){
							if(construct.name != this.#lookingForLabel.name) continue;
							this.#lookingForLabel = false;

							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}else{
							if(this.#lookingForLabel){
								if(isclass(construct, "Stmt")
									|| isclass(construct, "CStmt")
									|| isclass(construct, "CaseStmt")
									|| isclass(construct, "SStmt")
									|| isclass(construct, "IfStmt")
									|| isclass(construct, "SwitchStmt")
									|| isclass(construct, "IStmt")
									|| isclass(construct, "ForLoop")
									|| isclass(construct, "WhileLoop")
									|| isclass(construct, "DoWhileLoop")){
									construct.accept(this);
								}
							}else{
								if(this.#_instrNum > this.#breakstop) throw new StopFlag();
								this.pc = construct;
								construct.accept(this);
							}
						}
					}catch(t){
						throw t;
					}
				}
			}

			if(isclass(stmt.strue, "CStmt")){ // in case of brackets around statement (...if(true){...}...)
				for(const construct of stmt.strue.sequence){
					try{
						if(isclass(construct, "LStmt")){
							if(construct.name != this.#lookingForLabel.name) continue;
							this.#lookingForLabel = false;

							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}else{
							if(this.#lookingForLabel){
								if(isclass(construct, "Stmt")
									|| isclass(construct, "CStmt")
									|| isclass(construct, "CaseStmt")
									|| isclass(construct, "SStmt")
									|| isclass(construct, "IfStmt")
									|| isclass(construct, "SwitchStmt")
									|| isclass(construct, "IStmt")
									|| isclass(construct, "ForLoop")
									|| isclass(construct, "WhileLoop")
									|| isclass(construct, "DoWhileLoop")){
									construct.accept(this);
								}
							}else{
								if(this.#_instrNum > this.#breakstop) throw new StopFlag();
								this.pc = construct;
								construct.accept(this);
							}
						}
					}catch(t){
						throw t;
					}
				}
			}else{ // in case of no brackets (...if(true) printf()...)
				findingLabel:{
					try{
						if(isclass(stmt.strue, "LStmt")){
							if(stmt.strue.name != this.#lookingForLabel.name) break findingLabel;
							this.#lookingForLabel = false;

							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = stmt.strue;
							stmt.strue.accept(this);
						}else{
							if(this.#lookingForLabel){
								if(isclass(stmt.strue, "Stmt")
									|| isclass(stmt.strue, "CStmt")
									|| isclass(stmt.strue, "CaseStmt")
									|| isclass(stmt.strue, "SStmt")
									|| isclass(stmt.strue, "IfStmt")
									|| isclass(stmt.strue, "SwitchStmt")
									|| isclass(stmt.strue, "IStmt")
									|| isclass(stmt.strue, "ForLoop")
									|| isclass(stmt.strue, "WhileLoop")
									|| isclass(stmt.strue, "DoWhileLoop")){
									stmt.strue.accept(this);
								}
							}else{
								if(this.#_instrNum > this.#breakstop) throw new StopFlag();
								this.pc = stmt.strue;
								stmt.strue.accept(this);
							}
						}
					}catch(t){
						throw t;
					}
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

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
		let val;
		switch(initializer.kind){
			case INITTYPE.EXPR:
				val = this.evaluateExprArray(initializer.expr);
				if(initializer.expr.cType == "CExpr" && initializer.expr.type == "s_literal") return val.address;

				if(isclass(val, "PointerValue")) return val.value;
				if(has(val, "address")){
					if(val.size.length > 0){
						return val.address;
					}
					return this.#memsim.readRecordValue(val);
				}
				return val;
			case INITTYPE.ARR:
				let arr = [];
				for(const item of initializer.arr){
					arr.push(item.accept(this));
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

	visitLStmt(label){
		if(Array.isArray(label.stmt)){
			for(let stmt of label.stmt){
				try{
					if(this.#_instrNum > this.#breakstop) throw new StopFlag();
					this.pc = stmt;
					stmt.accept(this);
				}catch(t){ // construct can return prematurely
					if(isclass(t, "StopFlag")) throw t; // if it is just stop flag, throw it immediately, otherwise pop frame and throw result
					throw t;
				}
			}
		}else{
			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.pc = label.stmt;
			label.stmt.accept(this);
		}
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
		// return only most right-hand expression, evaluate rest
		// when expression is returned get the right-most operand to return and evaluate the left-hand operand
		var expr = ret.expr;
		// check if function has void signature if yes just to this (ignore return value)
		if(expr == null) throw new ReturnThrow(new ReturnVoid(ret.loc)); // in case of empty return (void return)

		expr = this.evaluateExprArray(expr); // resolve the expression (last is returned)
		if(isclass(expr, "PointerValue")) expr = this.#memsim.readRecordValue(this.#callStack.findMemoryRecord(expr.value));
		if(has(expr, "address")) expr = this.#memsim.readRecordValue(expr);

		// this breakstop is causing some weird behavior at the end of main, maybe remove it
		/*if(this.#_instrNum > this.#breakstop) throw new StopFlag();
		this.pc = ret;*/

		throw new ReturnThrow(expr);
	}

	visitSizeOfExpr(call){
		const e = this.evaluateExprArray(call.expr);
		if(has(e, "address")){
			return e.memsize;
		}
		return MEMSIZES[e];
	}

    visitSStmt(stmt){

	}

    visitStruct(struct){

	}

    visitSubscriptExpr(expr){
		let indicesRaw = [this.evaluateExprArray(expr.expr)];
		let indices = [];
		let exprCopy = expr.pointer;
		let record;

		for(const element of indicesRaw){
			if(has(element, "address")){
				indices.push(this.#memsim.readRecordValue(element));
			}else{
				indices.push(element);
			}
		}

		while(exprCopy != null){
			let val;
			if(exprCopy.expr){
				val = this.evaluateExprArray(exprCopy.expr);
			}else{  // last in the chain is identifier
				val = this.evaluateExprArray(exprCopy);
				if(isclass(val, "PointerValue")) record = val;
				if(has(val, "address")){ 
					record = val;
					if(record.indirection > 0 && record.size.length < 1){
						record = new PointerValue(this.#memsim.readRecordValue(record), record.pointsToMemtype); // the second parameter is correct?
					}
				}
				break;
			}

			indices.push(val);
			exprCopy = exprCopy.pointer;
		};

		indices = indices.map(value => {
			return has(value, "address") ? this.#memsim.readRecordValue(value) : value;
		});

		let flatIndex = (record.size?.length > 0)
		? this.getFlatIndex(indices, record.size)
		: (indices.length > 0 ? indices.reduce((res, item) => res * (Number(item) + 1), 1) - 1 : 1);

		if(isclass(record, "PointerValue")){ // is this correct? I think it is... probably
			return this.#callStack.findMemoryRecord(record.value + MEMSIZES[record.memtype]*(flatIndex), false);
			return new PointerValue(record.value + MEMSIZES[record.memtype]*(flatIndex), record.memtype);
		}

		const dummyRecord = new MemoryRecord();
		dummyRecord.dimension = 0;
		dummyRecord.address = record.address + MEMSIZES[record.memtype]*(flatIndex);
		dummyRecord.indirection = record.indirection;
		dummyRecord.memtype = record.memtype;
		dummyRecord.size = [];
		dummyRecord.memregion = record.memregion;
		dummyRecord.memsize = MEMSIZES[record.memtype];

		return dummyRecord;
	}

	visitSwitchStmt(stmt){
		if(this.#lookingForLabel){ // goto block
			for(const construct of stmt.body.sequence){
				try{
					if(isclass(construct, "LStmt")){
						if(construct.name != this.#lookingForLabel.name) continue;
						this.#lookingForLabel = false;

						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = construct;
						construct.accept(this);
					}else{
						if(this.#lookingForLabel){
							if(isclass(construct, "Stmt")
							|| isclass(construct, "CStmt")
							|| isclass(construct, "CaseStmt")
							|| isclass(construct, "SStmt")
							|| isclass(construct, "IfStmt")
							|| isclass(construct, "SwitchStmt")
							|| isclass(construct, "IStmt")
							|| isclass(construct, "ForLoop")
							|| isclass(construct, "WhileLoop")
							|| isclass(construct, "DoWhileLoop")){
								construct.accept(this);
							}
						}else{
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}
				}catch(t){
					throw t;
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

		let switchValue = this.evaluateExprArray(stmt.expr);
		if(isclass(switchValue, "PointerValue")) switchValue = switchValue.value;
		if(has(switchValue, "address")) switchValue = this.#memsim.readRecordValue(switchValue);

		let foundCase = false;

		let sf = new StackFrame(stmt.symtbptr, stmt, this.#callStack.getParentSF(stmt.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.pushSFrame(sf);

		for(const construct of stmt.body.sequence){
			if(!foundCase){
				// check for matching case or default
				if(isclass(construct, "CaseStmt")){
					let caseExpr = construct.expr;

					if(caseExpr == null){
						// default:
						foundCase = true;
					}else{
						const caseValue = this.evaluateExprArray(caseExpr);
						if(switchValue == caseValue){
							foundCase = true;
						}else{
							continue; // not matched yet, skip this CaseStmt
						}
					}
				}else if(!isclass(construct, "Declaration")){
					continue;
				}
			}

			// After matching: execute all statements/declarations until break
			if (this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.pc = construct;
			try {
				construct.accept(this);
			} catch (t) {
				if (isclass(t, "StopFlag")) throw t;
				if (isclass(t, "BreakThrow")) break;
				this.#callStack.popSFrame();
				throw t;
			}
		}

		if(this.#_instrNum > this.#breakstop) throw new StopFlag();
		this.#callStack.popSFrame();
	}

	// these three are mostly correct, on their own they don't do anything
    visitTagname(tagname){

	}

	visitType(type){

	}

    visitTypedef(typedef){

	}

    visitUExpr(expr){
		let value = this.evaluateExprArray(expr.expr);

		if(isclass(value, "PointerValue")){
			value = value.value;
		}

		switch(expr.op){
			case '+':
				if(has(value, "address")) return this.#memsim.readRecordValue(value);
				return value;
			case '-':
				if(has(value, "address")) return -this.#memsim.readRecordValue(value);
				return -value;
			case '++':
				if(has(value, "address")){
					const currValue = this.#memsim.readRecordValue(value);
					let newMemregion = value.memregion;
					if(value.memregion == MEMREGION.BSS){
						newMemregion = MEMREGION.DATA;
						this.#memsim.free(value.address, value.memsize);
						value.address = null;
					}

					const result = value.indirection > 0 ? currValue + 1*value.memsize : currValue + 1;
					this.#memsim.setRecordValue(value, result, newMemregion);
					return result;
				}
				return value + 1;
			case '--':
				if(has(value, "address")){
					const currValue = this.#memsim.readRecordValue(value);
					let newMemregion = value.memregion;
					if(value.memregion == MEMREGION.BSS){
						newMemregion = MEMREGION.DATA;
						this.#memsim.free(value.address, value.memsize);
						value.address = null;
					}

					const result = value.indirection > 0 ? currValue - 1*value.memsize : currValue - 1;
					this.#memsim.setRecordValue(value, result, newMemregion);
					return result;
				}
				return value - 1;
			case '!':
				if(has(value, "address")) return !this.#memsim.readRecordValue(value);
				return !value;
			case '~':
				if(has(value, "address")) return ~this.#memsim.readRecordValue(value);
				return ~value;
			case '*': {
				if(has(value, "address")){
					const pointsToAddress = this.#memsim.readRecordValue(value);
					const record = this.#callStack.findMemoryRecord(pointsToAddress);
					if(record == undefined){
						throw new RTError(`Invalid read or write of address ${pointsToAddress}`, expr.loc);
					}
					record.beingPointedToBy = value.pointsToMemtype;

					return record;
				}else if(this.#callStack.findMemoryRecord(value)){
					let record = this.#callStack.findMemoryRecord(value);
					if(record == undefined){
						throw new RTError(`Invalid read or write`, expr.loc);
					}

					return record;
				}else{
					console.error(value);
					throw new RTError(`Address ${value} is not a valid address`, expr.loc);
				}
			}
			case '&': {
				if(has(value, "address")){
					return new PointerValue(value.address, value.memtype);
				}else if(this.#callStack.findMemoryRecord(value)){
					return this.#callStack.findMemoryRecord(value);
				}else{
					throw new RTError(`Address ${value} does not have an address`, expr.loc);
				}
			} 
			default:
				throw new AppError(`Unknown operator of UExpr: ${expr.op}`, expr.loc);
		}
	}

    visitUnion(union){

	}

	visitWhileLoop(loop){
		if(this.#lookingForLabel){ // goto block
			for(const construct of loop.body.sequence){
				try{
					if(isclass(construct, "LStmt")){
						if(construct.name != this.#lookingForLabel.name) continue;
						this.#lookingForLabel = false;

						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = construct;
						construct.accept(this);
					}else{
						if(this.#lookingForLabel){
							if(isclass(construct, "Stmt")
							|| isclass(construct, "CStmt")
							|| isclass(construct, "CaseStmt")
							|| isclass(construct, "SStmt")
							|| isclass(construct, "IfStmt")
							|| isclass(construct, "SwitchStmt")
							|| isclass(construct, "IStmt")
							|| isclass(construct, "ForLoop")
							|| isclass(construct, "WhileLoop")
							|| isclass(construct, "DoWhileLoop")){
								construct.accept(this);
							}
						}else{
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}
				}catch(t){
					throw t;
				}
			}

			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.#callStack.popSFrame();
			return;
		}

		let sf = new StackFrame(loop.symtbptr, loop, this.#callStack.getParentSF(loop.symtbptr)); // StackFrame creates deep copy of symbol table
		this.#callStack.pushSFrame(sf);

		let condition;
		loop: for(;;){ // the for loop is there only as a label
			// evaluate at the beginning of every new loop run
			if(this.#_instrNum > this.#breakstop) throw new StopFlag();
			this.pc = loop;
			condition = this.evaluateExprArray(loop.cond);

			if(condition){
				if(this.#_instrNum > this.#breakstop) throw new StopFlag();
				try{
					if(isclass(loop.body, "CStmt")){
						for(const construct of loop.body.sequence){
							if(this.#_instrNum > this.#breakstop) throw new StopFlag();
							this.pc = construct;
							construct.accept(this);
						}
					}else{
						if(this.#_instrNum > this.#breakstop) throw new StopFlag();
						this.pc = loop.body;
						loop.body.accept(this);
					}
				}catch(t){
					if(isclass(t, "StopFlag")) throw t;
					if(isclass(t, "BreakThrow")) break;
					if(isclass(t, "ContinueThrow")) continue;
					throw t;
				}

				// check if iteration expression should be interpreted
				condition = this.evaluateExprArray(loop.cond);
				if(!condition) break;

				continue loop;
			}else{
				break;
			}
		}

		this.#callStack.popSFrame();
	}

	/******************************
	 * Built-in visitor funcitons *
	 *****************************/
	visitPrintF(printF, args){
		if(args.length < 1){
			throw new RTError("printf requires at least one argument (format string)");
		}

		let formatString = this.#memsim.readRecordValue(args[0]);
		formatString = CArrayToJsString(formatString);
		let otherArgs = args.slice(1);
		let i = 0;

		let output = formatString.replace(/%[dfsp]/g, match => { // currently supported: %d, %s, %f, %p
			if(i >= otherArgs.length){
				throw new RTError("Not enough arguments for printf");
			}

			if(match == "%d"){
				let value;
				value = otherArgs[i];
				if(isclass(value, "PointerValue")){
					const record = this.#callStack.findMemoryRecord(value.value);
					value = record;
				}
				if(has(value, "address")) value = this.#memsim.readRecordValue(value);
				i++;

				if(isNaN(value) && !Array.isArray(value)) return Math.floor(Math.random() * 900000000000000) + 100000000000000; // simulating random memory

				return parseInt(value);
			}

			if(match == "%f"){
				let value;
				value = otherArgs[i];
				if(isclass(value, "PointerValue")) value = this.#memsim.readRecordValue(this.#callStack.findMemoryRecord(value.value));
				if(has(value, "address")) value = this.#memsim.readRecordValue(value);
				i++;

				if(isNaN(value) && !Array.isArray(value)) return Math.floor(Math.random() * 900000000000000) + 100000000000000; // simulating random memory

				return parseFloat(value);
			}

			if(match == "%s"){
				let value;
				value = otherArgs[i];
				if(isclass(value, "PointerValue")) value = this.#memsim.readRecordValue(this.#callStack.findMemoryRecord(value.value));
				if(has(value, "address")) value = this.#memsim.readRecordValue(value);
				if(!isNaN(value)){
					const record = this.#callStack.findMemoryRecord(value);
					if(!record) throw new RTError("Argument passed to 'printf' is not a string");
					value = this.#memsim.readRecordValue(record);
				}
				i++;
				return CArrayToJsString(value);
			}

			if(match == "%p"){
				let value;
				value = otherArgs[i];
				if(isclass(otherArgs[i], "PointerValue")) value = otherArgs[i].value;
				if(has(otherArgs[i], "address")) value = otherArgs[i].address;
				i++;

				if(isNaN(value)) return Math.floor(Math.random() * 900000000000000) + 100000000000000; // simulating random memory
				return "0x" + value.toString(16);
			}

			return match;
		});

		output = output.replace(/\\n/g, "<br>"); // replace \n for <br>, maybe add tab and other special characters in the future :-) would be nice, complete list is in jisonlex ES
		output = output.replace(/\\\\/g, "\\"); // replace \\ for \

		this.output += output;
		return 0; // printf in C returns 0 by default
	}

	visitMalloc(malloc, arg){
		const s = this.evaluateExprArray(arg); // size to allocate
		if(isNaN(s)) throw new RTError(`Wrong argument to malloc function`); // this should be in semantic
		const record = new MemoryRecord();
		record.memsize = s;
		record.memtype = DATATYPE.void;
		record.region = MEMREGION.HEAP;

		this.#memsim.setRecordValue(record, null, MEMREGION.HEAP);

		this.#callStack.hFrame.add(record);
		return new PointerValue(record.address, DATATYPE.void);
	}

	visitCalloc(calloc, args){
		const s = this.evaluateExprArray(args[0]) * this.evaluateExprArray(args[1]); // size to allocate
		if(isNaN(s)) throw new RTError(`Wrong argument to calloc function`); // this should be in semantic
		const record = new MemoryRecord();
		record.memsize = s;
		record.memtype = DATATYPE.void;
		record.region = MEMREGION.HEAP;

		this.#memsim.setRecordValue(record, null, MEMREGION.HEAP);
		this.#callStack.hFrame.add(record);
		
		for(let i = 0; i < s; i++){
			this.#memsim.setRecordValue(this.#callStack.findMemoryRecord(record.address+i), 0, MEMREGION.HEAP);
		}

		return new PointerValue(record.address, DATATYPE.void);
	}

	visitFree(free, arg){
		let addressToFree;
		const expr = this.evaluateExprArray(arg);

		addressToFree = expr;
		if(has(expr, "address")) addressToFree = this.#memsim.readRecordValue(expr);
		if(isclass(expr, "PointerValue")) addressToFree = expr.value;

		const memoryToFree = this.#callStack.findMemoryRecord(addressToFree);
		if(!memoryToFree) throw new RTError(`Invalid free`);
		this.#memsim.free(addressToFree, memoryToFree.memsize);
		this.#callStack.hFrame.remove(memoryToFree);
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
	 * Determines and returns size of a type in bytes
	 * @param {DATATYPE} datatype
	 * @return {integer}
	 */
	sizeof(datatype){
		return MEMSIZES[datatype];
	}

	getFlatIndex(indices, sizes){
		let flatIndex = 0;
		let stride = 1;

		for(let i = 0; i < sizes.length; i++){
			flatIndex += indices[i] * stride;
			stride *= sizes[i];
		}

		return flatIndex;
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
	updateHTML(result, resultElement, vizElement, editor, vizOptions){
		const resultDiv = resultElement;

		// reset result element
		resultDiv.innerHTML = "";
		const classes = resultDiv.classList;
		const classesToRemove = Array.from(classes).filter(className => className.startsWith("bg-"));
		classesToRemove.forEach(className => resultDiv.classList.remove(className))
		let lineNumber;

		// add result/error depending on type returned from main (result arg)
		if(result != undefined && result != null && !isclass(result, "StopFlag")){;
			resultDiv.innerHTML = "Result: \n";
			// make text "on line x" bold
			const regex = /on line (\d+)/;
			const formattedText = result.message ? result.message.replace(regex, (match) => {
				return `<kbd class="fw-bolder">${match}</kbd>`;
			}) : "";
			const match = result.message ? result.message.match(regex) : null;
			lineNumber = match ? parseInt(match[1], 10) : null;
			if(isclass(result, "ReturnVoid")){
				resultDiv.innerHTML += "void";
				resultDiv.classList.add("bg-success");
			}else if(isclass(result, "SError") || isclass(result, "RTError") || isclass(result, "PError")){
				resultDiv.innerHTML += formattedText;
				resultDiv.classList.add("bg-danger");
			}else if(isclass(result, "NSError")){
				resultDiv.classList.add("bg-secondary");
				resultDiv.innerHTML = formattedText;

			}else if(isclass(result, "AppError") || result instanceof Error){
				resultDiv.classList.add("bg-secondary");
				resultDiv.innerHTML += "Application error. This is not your fault.\n<kbd>" + result + "</kbd>";
			}else{
				resultDiv.innerHTML += +result;
				resultDiv.classList.add("bg-success");
			}
		}

		// memory visualization
		this.memviz = new Memviz(this.#memsim, this.#callStack, vizElement, vizOptions); // TODO pass the element id as string parameter for interpreter
		this.memviz.updateHTML();

		// other elements
		if(this.#ast && this.userEnums){
			if(JSONEDITeditorAST && JSONEDITeditorTYPEDEFS){
				JSONEDITeditorAST.set(JSON.parse(JSON.stringify(this.#ast))); // due to symtable now being attached to nodes, I cannot print it because of recursive references
				JSONEDITeditorTYPEDEFS.set(this.userTypes.concat(this.userEnums));
			}
		}
		//document.getElementById("ast").innerHTML = JSON.stringify(this.#ast, null, 2); // old way of printing AST
		//document.getElementById("typedefs").innerHTML = JSON.stringify(this.userTypes.concat(this.userEnums), null, 2); // old way of printing typedefs
		document.getElementById("programCounter").innerHTML = "Step: " + (this.#breakstop == Infinity ? "end" : this.#breakstop);
		document.getElementById("symtable").innerHTML = this.#symtableGlobal.print();
		document.getElementById("memdump").innerHTML = this.memdump;
		document.getElementById("warnings").innerHTML = this.#warningSystem.print();
		document.getElementById("console-output").innerHTML = this.output;

		// create new marker
		/*if(this.pcloclast > 0){
			let rangeJI = new Range(this.pcloclast - 1, 0, this.pcloclast - 1, 1); // just interpreted
			let markerJI = editor.getSession().addMarker(rangeJI, "rangeJI", "fullLine");
		}*/
		if(editor){
			let rangeTBI = new Range(this.pcloc - 1, this.pclocColStart, this.pcloc - 1, this.pclocColEnd); // Just interpreted
			let markerTBI = editor.getSession().addMarker(rangeTBI, "rangeJI", "fullLine"); // "fullLine"/"text" last arg for whole line/part of line being highlighted
			if(!isNaN(lineNumber)){
				let errorRange = new Range(lineNumber - 1, 0, lineNumber - 1, 1);
				let errorMarker = editor.getSession().addMarker(errorRange, "rangeErr", "fullLine");
			}
		}
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
 * @class BreakThrow
 * @description Class which can be thrown to break statement (loop, switch, ...)
 * @param {Construct} construct
 */
class BreakThrow {
	constructor(construct){
		this.loc = construct.loc;
		this.value = construct;
	}
}

/**
 * @class ContinueThrow
 * @description Class which can be thrown to continue a loop
 * @param {Construct} construct
 */
class ContinueThrow {
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

/**
 * @class GotoThrow
 * @description Will be thrown in goto and handled in function body CStmt
 * @param {Label} label
 */
class GotoThrow {
	constructor(label){
		this.label = label;
	}
}

/**
 * @class StopFlag
 * @description Will be thrown if the interpreter should no longer interpret (single-stepping)
 */
class StopFlag {
	constructor(){

	}
}

/**
 * @class PointerValue
 * @description Class representing pointer, used for pointer arithmetics. Is created when '&' operator is used.
 */
class PointerValue {
	constructor(value, memtype){
		this.value = value;
		this.memtype = memtype;
	}
}
