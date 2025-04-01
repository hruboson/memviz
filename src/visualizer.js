/**
 * @file Memory visualizer
 * @author Ondřej Hruboš
 */

/**
 * Core of the maxGraph library
 * @global
 * @const
 * @ignore
 */
const mxg = window.mxg;

/**
 * @class VizCellValue
 * @description Symbol record of visualizer. Contains address of the symbol and pointer to cell (vertex) corresponding to the visualization. <-- refactor this description
 * @param {integer} address
 * @param {mxg.Cell} cell
 */
class VizCellValue {
	constructor(address, cell){
		this.address = address;
		this.cell = cell;
	}
}

/**
 * @class VizCellPointer
 * @description Pointer representation in visualizer. VizCellPointer will always points to VizCellValue
 * @param {integer} address
 * @param {mxg.Cell} cell
 */
class VizCellPointer {
	constructor(address, cell){
		this.address = address;
		this.cell = cell;
	}
}

/**
 * @class VizPointerPair
 * @description Adds convenient aliases to the Pair class.
 * @param {VizCellPointer} pointedFrom
 * @param {VizCellValue} pointedTo
 */
class VizPointerPair extends Pair {
	constructor(from, to){
		super(from, to);

		// aliases for better clarity
		this.from = this.first;
		this.to = this.second;
	}
}

/**
 * @class Memviz
 * @description Main visualization class, handles memory visualization. Basically visualizing the call stack and each of its stack frames (symbol tables).
 * @param {Memsim} memsim
 * @param {CallStack} callStack
 * @param {Element} container HTML element to print to - get it by doing document.getElementById
 */
class Memviz {
	
	constructor(memVizStyle, memsim, callStack, container){
		if(!(container instanceof Element)) throw new AppError(`Container must be a HTML element!`);

		this.memsim = memsim;
		this.callStack = callStack;
		this.container = container;
		this.memVizStyle = memVizStyle;

		this.#init();
	}

	/**
	 * Initializes all structures and sets graph options
	 * @private
	 */
	#init(){
		this.container.innerHTML = ""; // init output
		this.graph = new mxg.Graph(this.container);
		this.root = this.graph.getDefaultParent();

		//this.graph.getStylesheet().styles.set("smoothCurveEdge", smoothCurveEdge); TODO different edge style
		this.#setGraphOptions();
	}

	/**
	 * Sets graph options
	 * @private
	 */
	#setGraphOptions(){
		this.graph.setEnabled(false);
		mxg.InternalEvent.disableContextMenu(this.container);
	}

	/**
	 * Starts visualization. Outputs to container.
	 * @public
	 */
	updateHTML(){
		console.log(this.memVizStyle);
		this.vizMemoryRecords();
	}

	/**
	 * Call stack acquired from interpreter.
	 * @type {CallStack}
	 */
	callStack;

	/**
	 * Map of addresses and their visual representation instances
	 * @type {Map.<Integer, VizCellValue>}
	 */
	symbols = new Map();

	/**
	 * Pairs of symbols pointing to each other
	 * @type {Array.<VizPointerPair.<VizCellPointer, VizCellValue>>}
	 */
	pointerPairs = [];

	/**********************
	 * STYLING AND SIZING *
	 **********************/

	/**
	 * Height and width of one memory unit (square)
	 * @returns {Number}
	 * @static
	 */
	static get squareXYlen(){
		return 70;
	}

	/**
	 * Height and width of pointer circle (inside of memory unit)
	 * @returns {Number}
	 * @static
	 */
	static get circleXYlen(){
		return 20;
	}

	/**
	 * Starting X position of first element in stack frame
	 * @returns {Number}
	 * @static
	 */
	static get squareX(){
		return 30;
	}
	
	/**
	 * Starting Y position of the first element in stack frame
	 * @returns {Number}
	 * @static
	 */
	static get rowY(){
		return 30;
	}

	/**
	 * Starting X position of the first stack frame (global)
	 * @returns {Number}
	 * @static
	 */
	static get sfX(){
		return 30;
	}

	/**
	 * Starting Y position of the first stack frame (global)
	 * @returns {Number}
	 * @static
	 */
	static get sfY(){
		return 30;
	}

	/**
	 * Height of label above and below of memory unit
	 * @returns {Number}
	 * @static
	 */
	static get labelHeight(){
		return Memviz.squareXYlen/3;
	}

	/**
	 * Font family. Is set to all visualized elements.
	 * @returns {string}
	 * @static
	 */
	static get fontFamily(){
		return "FiraCode";
	}

	/**
	 * Font color. Is set to all visualized elements.
	 * @returns {string}
	 * @static
	 */
	static get fontColor(){
		return "white";
	}

	/**********************
	 * CORE VIZ FUNCTIONS *
	 **********************/

	/**
	 * Visualizes the whole call stack.
	 * @function
	 */
	vizMemoryRecords(){
		this.#init();
		this.vizMemregions();

		let nextY = 10;
		const hf = this.callStack.hFrame;
		const df = this.callStack.dFrame;

		nextY = this.vizHeapFrame(hf, nextY);
		nextY = this.vizDataFrame(df, nextY);

		for(const sf of this.callStack){
			nextY = this.vizStackFrame(sf, nextY);
		}

		this.vizPointers();
	}

	vizHeapFrame(hf, y){
		return y;
	}

	vizDataFrame(df, y){
		const nHorizontal = df.records.length;
		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
		let sfY = y + Memviz.labelHeight + 10;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if(df.records.length > 0){
			height += 20; // inner padding for each row inside sf
			height *= df.records.length;
		}
		height += 20; // bottom padding

		const root = this.root;
		const dataFrameRectangle = this.graph.insertVertex({
			root,
			position: [Memviz.sfX, sfY],
			height: height,
			width: width,
			style: {
				// label style
				labelPosition: "center",
				verticalAlign: "bottom",
				verticalLabelPosition: "top",
				spacingBottom: 5,
				align: "left",

				strokeColor: "grey",
				fillColor: "transparent",
				shape: "rectangle",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,

				fontFamily: Memviz.fontFamily,
			},
		});

		let nextY = 30; // first top padding

		for(const dataObject of df.records){
			nextY = this.vizSym(dataObject, dataFrameRectangle, nextY);
		}

		return sfY + height;
	}

	/**
	 * Visualizes one stack frame.
	 * @function
	 * @param {StackFrame} sf
	 * @param {Number} y Y coordinate to visualize the stack frame.
	 * @returns {Number} newY Used to calculate the position of next stack frame.
	 */
	vizStackFrame(sf, y){
		if(sf.empty()){ // in case of no names in symtable
			return y;
		}

		if(sf.symtable.scopeInfo.type == "stmt"){ // in case of compound statement (... {...} ...) keep the function name
			sf.symtable.scopeInfo.name = sf.parent.symtable.scopeInfo.name + " > " + sf.symtable.scopeInfo.name;
		}

		if(sf.symtable.scopeInfo.type == "function params"){
			sf.symtable.scopeInfo.name = sf.symtable.scopeInfo.name + " > parameters";
		}

		const filteredObjects = Array.from(sf.symtable.objects.entries()).filter(([name, sym]) => sym.type !== "FNC" && sym.interpreted);

		//TODO determine nVertical from largest array size
		const nHorizontal = 3;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if(filteredObjects.length > 0){
			height += 20; // inner padding for each row inside sf
			height *= filteredObjects.length;
		}
		height += 20; // bottom padding

		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height

		let sfY = y + Memviz.labelHeight + 10;

		const root = this.root;
		const stackFrameRectangle = this.graph.insertVertex({
			root,
			position: [Memviz.sfX, sfY],
			value: sf.symtable.scopeInfo.name,
			height: height,
			width: width,
			style: {
				// label style
				labelPosition: "center",
				verticalAlign: "bottom",
				verticalLabelPosition: "top",
				spacingBottom: 5,
				align: "left",

				strokeColor: "grey",
				fillColor: "transparent",
				shape: "rectangle",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,

				fontFamily: Memviz.fontFamily,
			},
		});

		let nextY = 30; // first top padding
		for(const [name, sym] of filteredObjects){
			nextY = this.vizSym(sym, stackFrameRectangle, nextY);
		}

		return sfY + height;
	}

	/**
	 * Visualizes single symbol from stack frame.
	 * @param {Symbol} sym
	 * @param {Cell} parent This will be the symbols stack frame.
	 * @param {Number} y
	 */
	vizSym(sym, parent, y){
		//TODO only a demo, add switch for types of symbol (array, pointer, structure, primitive)

		if(!sym.address) console.warn(sym);
		const style = this.getStyleFromMEMREGION(this.memsim.getMemoryRegion(sym.address));

		if(sym.size.length > 0){ // array
			return this.vizArrayValue(sym, parent, style, y);
		}else if(sym.indirection > 0){
			return this.vizPointerValue(sym, parent, style, y);
		}else{
			return this.vizPrimitiveValue(sym, parent, style, y);
		}
	}

	/**
	 * Visualizes primitive value.
	 * @param {Symbol} sym
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizPrimitiveValue(sym, parent, style, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight*2;

		let value;
		if(sym.address){
			value = this.memsim.readRecordValue(sym);
		}

		const valueBox = this.graph.insertVertex({
			parent: parent,
			position: [Memviz.squareX, y],
			size: [Memviz.squareXYlen, Memviz.squareXYlen],
			value: value,
			style: style,
		});

		const labelAbove = this.graph.insertVertex({
			parent: parent, 
			position: [Memviz.squareX, y - Memviz.labelHeight],
			size: [Memviz.squareXYlen, Memviz.labelHeight],
			value: sym.name ? sym.name : "",
			style: {
				fillColor: "transparent",
				strokeColor: "transparent",
				labelPosition: "center",
				verticalLabelPosition: "middle",
				align: "left",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,
				fontFamily: Memviz.fontFamily,
			},
		});

		const labelBelow = this.graph.insertVertex({
			parent: parent, 
			position: [Memviz.squareX, y + Memviz.squareXYlen], // Position below the square
			size: [Memviz.squareXYlen, Memviz.labelHeight],
			value: sym.specifiers ? sym.specifiers.join(' ') : sym.memtype,
			style: {
				fillColor: "transparent", // Transparent background
				strokeColor: "transparent", // No border
				labelPosition: "center",
				verticalLabelPosition: "middle",
				align: "right",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,
				fontFamily: Memviz.fontFamily,
			},
		});

		this.symbols.set(sym.address, new VizCellValue(sym.address, valueBox));

		return y + height;
	}

	/**
	 * Visualizes pointer value.
	 * @param {Symbol} sym
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizPointerValue(sym, parent, style, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight*2;
		let pointingTo;
		if(sym.address){
			pointingTo = this.memsim.readRecordValue(sym);
		}

		const valueBox = this.graph.insertVertex({
			parent: parent,
			position: [Memviz.squareX, y],
			size: [Memviz.squareXYlen, Memviz.squareXYlen],
			style: style,
		});

		let circle;
		if(pointingTo){
			circle = this.graph.insertVertex({
				parent: valueBox, // The square is the parent
				position: [(Memviz.squareXYlen/2)-(Memviz.circleXYlen/2), (Memviz.squareXYlen/2)-(Memviz.circleXYlen/2)], // Position relative to the square
				size: [Memviz.circleXYlen, Memviz.circleXYlen], // Circle size (adjust for best fit)
				style: {
					fillColor: "white",
					strokeColor: "white",
					fontSize: 14,
					labelPosition: "center",
					shape: "ellipse", // Makes it a circle
				},
			});
		}

		const labelAbove = this.graph.insertVertex({
			parent: parent, 
			position: [Memviz.squareX, y - Memviz.labelHeight],
			size: [Memviz.squareXYlen, Memviz.labelHeight],
			value: sym.name ? sym.name : "",
			style: {
				fillColor: "transparent",
				strokeColor: "transparent",
				labelPosition: "center",
				verticalLabelPosition: "middle",
				align: "left",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,
				fontFamily: Memviz.fontFamily,
			},
		});

		const labelBelow = this.graph.insertVertex({
			parent: parent, 
			position: [Memviz.squareX, y + Memviz.squareXYlen], // Position below the square
			size: [Memviz.squareXYlen, Memviz.labelHeight],
			value: '*'.repeat(sym.indirection) + sym.specifiers.join(' '),
			style: {
				fillColor: "transparent", // Transparent background
				strokeColor: "transparent", // No border
				labelPosition: "center",
				verticalLabelPosition: "middle",
				align: "right",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,
				fontFamily: Memviz.fontFamily,
			},
		});

		if(pointingTo){
			this.pointerPairs.push(
				new VizPointerPair(
					new VizCellPointer(sym.address, circle),
					new VizCellValue(pointingTo, null) // will be determined at the end of call stack visualization
				)
			);
		}

		this.symbols.set(sym.address, new VizCellValue(sym.address, valueBox));

		return y + height;
	}

	/**
	 * Visualizes array.
	 * @param {Symbol} sym
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizArrayValue(sym, parent, style, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight*2;

		let value;
		if(sym.address){
			value = this.memsim.readRecordValue(sym);
		}

		this.vizArrayRecursive(sym, parent, style, y, 0, value);

		return y + height;
	}

	/**
	 * Recursively visualizes each element of an array.
	 * @param {Symbol} sym
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 * @param {integer} numberOfElements
	 * @param {Array} arr
	 */
	vizArrayRecursive(sym, parent, style, y, numberOfElements, arr){
		let n = numberOfElements;
		for (var i = 0; i < arr.length; i++){
			if (Array.isArray(arr[i])){
				n = this.vizArrayRecursive(sym, parent, style, y, n, arr[i]);
			}else{
				let valueBox;
				if(sym.indirection > 0){
					let pointingTo = arr[i];

					const valueBox = this.graph.insertVertex({
						parent: parent,
						position: [Memviz.squareX + ((Memviz.squareXYlen * n)), y],
						size: [Memviz.squareXYlen, Memviz.squareXYlen],
						style: style,
					});

					let circle;
					if(pointingTo){
						circle = this.graph.insertVertex({
							parent: valueBox, // The square is the parent
							position: [(Memviz.squareXYlen/2)-(Memviz.circleXYlen/2), (Memviz.squareXYlen/2)-(Memviz.circleXYlen/2)], // Position relative to the square
							size: [Memviz.circleXYlen, Memviz.circleXYlen], // Circle size (adjust for best fit)
							style: {
								fillColor: "white",
								strokeColor: "white",
								fontSize: 14,
								labelPosition: "center",
								shape: "ellipse", // Makes it a circle
							},
						});
					}

					const indices = flatIndexToDimensionalIndices(n, sym.size);
					const name = sym.name ? sym.name : ""
					const labelText = name + indices.map(idx => `[${idx}]`).join('');
					const labelAbove = this.graph.insertVertex({
						parent: parent, 
						position: [Memviz.squareX + ((Memviz.squareXYlen * n)), y - Memviz.labelHeight],
						size: [Memviz.squareXYlen, Memviz.labelHeight],
						value: labelText,
						style: {
							fillColor: "transparent",
							strokeColor: "transparent",
							labelPosition: "center",
							verticalLabelPosition: "middle",
							align: "left",

							// font style
							fontSize: 14,
							fontColor: Memviz.fontColor,
							fontFamily: Memviz.fontFamily,
						},
					});

					const belowValue = sym.specifiers ? '*'.repeat(sym.indirection) + sym.specifiers.join(' ') : '*'.repeat(sym.indirection) + sym.memtype;
					const labelBelow = this.graph.insertVertex({
						parent: parent, 
						position: [Memviz.squareX + ((Memviz.squareXYlen * n)), y + Memviz.squareXYlen], // Position below the square
						size: [Memviz.squareXYlen, Memviz.labelHeight],
						value: belowValue,
						style: {
							fillColor: "transparent", // Transparent background
							strokeColor: "transparent", // No border
							labelPosition: "center",
							verticalLabelPosition: "middle",
							align: "right",

							// font style
							fontSize: 14,
							fontColor: Memviz.fontColor,
							fontFamily: Memviz.fontFamily,
						},
					});

					if(pointingTo){
						this.pointerPairs.push(
							new VizPointerPair(
								new VizCellPointer(sym.addresses[n], circle),
								new VizCellValue(pointingTo, null) // will be determined at the end of call stack visualization
							)
						);
					}

					this.symbols.set(sym.addresses[n], new VizCellValue(sym.addresses[n], valueBox));
				}else{
					valueBox = this.graph.insertVertex({
						parent: parent,
						position: [Memviz.squareX + ((Memviz.squareXYlen * n)), y],
						size: [Memviz.squareXYlen, Memviz.squareXYlen],
						value: sym.memtype == DATATYPE.char || sym.memtype == DATATYPE.uchar ? CCharToJsString(arr[i]) : arr[i],
						style: style,
					});

					const indices = flatIndexToDimensionalIndices(n, sym.size);
					const name = sym.name ? sym.name : ""
					const labelText = name + indices.map(idx => `[${idx}]`).join('');

					const labelAbove = this.graph.insertVertex({
						parent: parent, 
						position: [Memviz.squareX + ((Memviz.squareXYlen * n)), y - Memviz.labelHeight],
						size: [Memviz.squareXYlen, Memviz.labelHeight],
						value: labelText,
						style: {
							fillColor: "transparent",
							strokeColor: "transparent",
							labelPosition: "center",
							verticalLabelPosition: "middle",
							align: "left",

							// font style
							fontSize: 10,
							fontColor: Memviz.fontColor,
							fontFamily: Memviz.fontFamily,
						},
					});

					const labelBelow = this.graph.insertVertex({
						parent: parent, 
						position: [Memviz.squareX + ((Memviz.squareXYlen * n)), y + Memviz.squareXYlen], // Position below the square
						size: [Memviz.squareXYlen, Memviz.labelHeight],
						value: sym.specifiers ? sym.specifiers.join(' ') : sym.memtype,
						style: {
							fillColor: "transparent", // Transparent background
							strokeColor: "transparent", // No border
							labelPosition: "center",
							verticalLabelPosition: "middle",
							align: "right",

							// font style
							fontSize: 14,
							fontColor: Memviz.fontColor,
							fontFamily: Memviz.fontFamily,
						},
					});

					// don't forget to add the address to global array for visualization
					this.symbols.set(sym.addresses[n], new VizCellValue(sym.addresses[n], valueBox));
				}

				n++;
			}
		}
		return n;
	}

	/**
	 * Visualizes the hint at top of visualizer. This visualizes the memory regions and their colors
	 * @todo implement
	 */
	vizMemregions(){
		//TODO this will be on top of the whole visualization, it will show what color each region has
	}

	/**
	 * Creates edges of pointers pointing to values.
	 * @function
	 */
	vizPointers(){
		const root = this.root;
		for(let pair of this.pointerPairs){
			// first determine where to point
			const targetCellValue = this.symbols.get(pair.to.address);
			if(!targetCellValue){ console.warn(`Cannot visualize pointer from ${pair.from.address} to ${pair.to.address}`); return; };
			pair.to.cell = targetCellValue.cell;

			const edge = this.graph.insertEdge({
				parent: root,
				source: pair.from.cell,
				target: pair.to.cell,
				style: {
					edgeStyle: "smoothCurveEdge",
					strokeColor: "white",
					rounded: true,
					entryX: 0, // Left side of value vertex
					entryY: 0, // Top side of value vertex
					exitX: 0.5,  // Middle of the source cell
					exitY: 0.5,    // Top of the source cell
				},
			});

			this.graph.refresh();
		}
	}

	/********************
	 * HELPER FUNCTIONS *
	 ********************/

	/**
	 * Returns style based on memregion.
	 * @param {MEMREGION} memregion
	 * @return {Object} style Can be used while inserting vertex to the graph.
	 */
	getStyleFromMEMREGION(memregion){
		const fontSize = 30;
		const fontColor = Memviz.fontColor;
		const fontFamily = Memviz.fontFamily;

		switch(memregion){
			case MEMREGION.STACK:
				return {
					// vertex style
					fillColor: "#1BA1E2", // blue
					strokeColor: "#006EAF", // darker blue
					shape: "rectangle", // Explicitly defining it as a square

					// font style
					fontSize: fontSize,
					fontColor: fontColor,
					fontFamily: fontFamily,
				}
			case MEMREGION.HEAP:
				return {
					// vertex style
					fillColor: "#A20025", // red
					strokeColor: "#750004", // darker red
					shape: "rectangle", // Explicitly defining it as a square

					// font style
					fontSize: fontSize,
					fontColor: fontColor,
					fontFamily: fontFamily,
				}
			case MEMREGION.BSS:
				return {
					// vertex style
					fillColor: "#F0A30A", // yellow
					strokeColor: "#D68905", // darker yellow
					shape: "rectangle", // Explicitly defining it as a square

					// font style
					fontSize: fontSize,
					fontColor: fontColor,
					fontFamily: fontFamily,
				}
			case MEMREGION.DATA:
				return {
					// vertex style
					fillColor: "#60A917", // green
					strokeColor: "#2D7600", // darker green
					shape: "rectangle", // Explicitly defining it as a square

					// font style
					fontSize: fontSize,
					fontColor: fontColor,
					fontFamily: fontFamily,
				}
			default:
				throw new AppError(`Unknown memory region: ${memregion}, cannot deduce vertex style`);
		}
	}
}
