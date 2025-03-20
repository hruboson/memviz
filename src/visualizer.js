/**
 * @file Memory visualizer
 * @author Ondřej Hruboš
 */

/**
 * @class Memviz
 * @description Main visualization class, handles mostly memory visualization
 * Basically visualizing the call stack and each of its stack frames (symbol tables)
 */

/**
 * @global
 */
const mxg = window.mxg; // core of the MaxGraph library

/**
 * @class Memviz
 * @param {CallStack} callStack
 * @param {Element} container HTML element to print to - get it by doing document.getElementById
 */
class Memviz {
	
	constructor(memsim, callStack, container){
		if(!(container instanceof Element)) throw new Error(`Container must be a HTML element!`);

		this.memsim = memsim;
		this.callStack = callStack;
		this.container = container;

		this.graph = new mxg.Graph(this.container); // main "canvas"
		this.root = this.graph.getDefaultParent(); // default parent

		this.clear();
	}

	clear(){
		//this.graph.model.clear();
		this.container.innerHTML = ""; // clear output
		this.graph = new mxg.Graph(this.container);
		this.root = this.graph.getDefaultParent();
	}

	setGraphOptions(){
		this.graph.setEnabled(false);
		mxg.InternalEvent.disableContextMenu(this.container);
	}

	updateHTML(){
		this.vizCallStack();
	}

	#callStack;

	/**
	 * Map of addresses and their visual representation instances
	 * @type {Map.<Integer, Object>}
	 */
	symbols = new Map();

	/**
	 * Height and width of one memory unit (square)
	 * @static
	 */
	static get squareXYlen(){
		return 70;
	}

	/**
	 * Height and width of pointer circle (inside of memory unit)
	 * @static
	 */
	static get circleXYlen(){
		return 20;
	}

	/**
	 * Starting X position of first element in stack frame
	 * @static
	 */
	static get squareX(){
		return 30;
	}
	
	/**
	 * Starting Y position of the first element in stack frame
	 * @static
	 */
	static get rowY(){
		return 30;
	}

	/**
	 * Starting X position of the first stack frame (global)
	 * @static
	 */
	static get sfX(){
		return 30;
	}

	/**
	 * Starting Y position of the first stack frame (global)
	 * @static
	 */
	static get sfY(){
		return 30;
	}

	/**
	 * Height of label above and below of memory unit
	 * @static
	 */
	static get labelHeight(){
		return Memviz.squareXYlen/3;
	}

	static get fontFamily(){
		return "FiraCode";
	}

	static get fontColor(){
		return "white";
	}

	/**********************
	 * CORE VIZ FUNCTIONS *
	 **********************/

	vizCallStack(){
		this.clear();
		this.vizMemregions();

		let nextY = 10;
		for(const sf of this.callStack){
			nextY = this.vizStackFrame(sf, nextY);
		}
	}

	vizMemregions(){
		//TODO this will be on top of the whole visualization, it will show what color each region has
	}

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

		const root = this.root;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if(filteredObjects.length > 0){
			height += 20; // inner padding for each row inside sf
			height *= filteredObjects.length;
		}
		height += 20; // bottom padding

		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height

		let sfY = y + Memviz.labelHeight + 10;

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

	vizSym(sym, parent, y){
		//TODO only a demo, add switch for types of symbol (array, pointer, structure, primitive)

		if(!sym.address) console.warn(sym);
		const style = this.getStyleFromMEMREGION(this.memsim.getMemoryRegion(sym.address));

		if(sym.dimension > 0){ // array
			return this.vizArrayValue(sym, parent, style, y);
		}else if(sym.pointer){
			return this.vizPointerValue(sym, parent, style, y);
		}else {
			return this.vizPrimitiveValue(sym, parent, style, y);
		}

		/*const ptrSquare = this.graph.insertVertex({
			parent: parent,
			position: [Memviz.squareX, symY], // Square position
			size: [Memviz.squareXYlen, Memviz.squareXYlen], // Square size
			value: this.memsim.readSymValue(sym),
			style: {
				// label style
				labelPosition: "center",
				verticalAlign: "bottom",
				verticalLabelPosition: "top",
				align: "left",
				spacingBottom: 5,

				// vertex style
				fillColor: "#1BA1E2", // blue
				strokeColor: "#006EAF", // darker blue
				shape: "rectangle", // Explicitly defining it as a square

				// font style
				fontSize: 14,
				fontColor: "white",
				fontFamily: "FiraCode",
			},
		});*/

		//value style (green square)
		/*
			style: {
				fontSize: 30,
				fillColor: "#60A917",
				strokeColor: "#2D7600",
				fontColor: "white",
				fontFamily: "FiraCode",
			},
		*/
	}

	vizPrimitiveValue(sym, parent, style, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight*2;

		let value;
		if(sym.address){
			value = this.memsim.readSymValue(sym);
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
			value: sym.name,
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
			value: sym.specifiers.join(' '),
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

		this.symbols.set(sym.address, valueBox);

		return y + height;
	}

	vizPointerValue(sym, parent, style, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight*2;
		let pointingTo;
		if(sym.address){
			pointingTo = this.memsim.readSymValue(sym);
		}
		console.log(sym);

		const valueBox = this.graph.insertVertex({
			parent: parent,
			position: [Memviz.squareX, y],
			size: [Memviz.squareXYlen, Memviz.squareXYlen],
			style: style,
		});

		const circle = this.graph.insertVertex({
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

		const labelAbove = this.graph.insertVertex({
			parent: parent, 
			position: [Memviz.squareX, y - Memviz.labelHeight],
			size: [Memviz.squareXYlen, Memviz.labelHeight],
			value: sym.name,
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

		const edge = this.graph.insertEdge({
			parent: parent,
			source: circle,
			target: this.symbols.get(pointingTo),
			style: {
				edgeStyle: "straightEdgeStyle", // Straight edge
				strokeColor: "white",
				rounded: true,
				entryX: 0, // Left side of value vertex
				entryY: 0, // Top side of value vertex
			},
		});

		this.symbols.set(sym.address, valueBox);

		return y + height;
	}

	vizArrayValue(sym, parent, style, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight*2;


	}

	/********************
	 * HELPER FUNCTIONS *
	 ********************/

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

	
	// Disables the built-in context menu
	/*mxg.InternalEvent.disableContextMenu(container);

	const graph = new mxg.Graph(container);
	graph.setEnabled(false); // Disable all interaction

	// Gets the default parent for inserting new cells. This
	// is normally the first child of the root (ie. layer 0).
	const parent = graph.getDefaultParent();

	const squareX = 30, rowY = 30;
	const squareXYlen = 70;
	const circleXYlen = 20;
	const nHorizontal = 2; // max number of horizontal elements -- might need some recalculation (e.g. how long an array is)
	const nVertical = 3; // number of objects inside of a stack frame

	const sfX = 30, sfY = 30;
	const labelHeight = squareXYlen/3;

	const groupRectangle = graph.insertVertex({
		parent,
		position: [sfX, sfY],
		value: "main",
		size: [(squareXYlen * 1.6 + squareX) * nHorizontal, (squareXYlen + labelHeight*2 + 20) * nVertical], // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
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
        	fontColor: "white",

			fontFamily: "FiraCode",
		},
	});

	// Create the inner circle inside the square
	const circle = graph.insertVertex({
		parent: square, // The square is the parent
		position: [(squareXYlen/2)-(circleXYlen/2), (squareXYlen/2)-(circleXYlen/2)], // Position relative to the square
		size: [circleXYlen, circleXYlen], // Circle size (adjust for best fit)
		style: {
			fillColor: "white",
			strokeColor: "white",
			fontSize: 14,
			labelPosition: "center",
			shape: "ellipse", // Makes it a circle
		},
	});

	const labelAbovePtr = graph.insertVertex({
		parent: groupRectangle, 
		position: [squareX, rowY - labelHeight],
		size: [squareXYlen, labelHeight],
		value: "ptr",
		style: {
			fillColor: "transparent",
			strokeColor: "transparent",
			labelPosition: "center",
			verticalLabelPosition: "middle",
			align: "left",

			// font style
			fontSize: 14,
        	fontColor: "white",
			fontFamily: "FiraCode",
		},
	});

	const labelBelowPtr = graph.insertVertex({
		parent: groupRectangle, 
		position: [squareX, rowY + squareXYlen], // Position below the square
		size: [squareXYlen, labelHeight], // Label size
		value: "int*",
		style: {
			fillColor: "transparent", // Transparent background
			strokeColor: "transparent", // No border
			labelPosition: "center",
			verticalLabelPosition: "middle",
			align: "right",

			// font style
			fontSize: 14,
        	fontColor: "white",
			fontFamily: "FiraCode",
		},
	});

	const value = graph.insertVertex({
		parent: groupRectangle,
		position: [squareX + squareXYlen*2 + 10, rowY],
		size: [squareXYlen, squareXYlen],
		value: "42",
		style: {
			fontSize: 30,
			fillColor: "#60A917",
			strokeColor: "#2D7600",
			fontColor: "white",
			fontFamily: "FiraCode",
		},
	});

	const labelBelowValue = graph.insertVertex({
		parent: groupRectangle, 
		position: [squareX + squareXYlen*2 + 10, rowY + squareXYlen], // Position below the square
		size: [squareXYlen, labelHeight], // Label size
		value: "int",
		style: {
			fillColor: "transparent", // Transparent background
			strokeColor: "transparent", // No border
			labelPosition: "center",
			verticalLabelPosition: "middle",
			align: "right",

			// font style
			fontSize: 14,
        	fontColor: "white",
			fontFamily: "FiraCode",
		},
	});

	const labelAboveValue = graph.insertVertex({
		parent: groupRectangle, 
		position: [squareX + squareXYlen*2 + 10, rowY - labelHeight],
		size: [squareXYlen, labelHeight],
		value: "a",
		style: {
			fillColor: "transparent",
			strokeColor: "transparent",
			labelPosition: "center",
			verticalLabelPosition: "middle",
			align: "left",

			// font style
			fontSize: 14,
        	fontColor: "white",
			fontFamily: "FiraCode",
		},
	});

	const edge = graph.insertEdge({
		parent: groupRectangle,
		source: circle,
		target: value,
		style: {
			edgeStyle: "straightEdgeStyle", // Straight edge
			strokeColor: "white",
			rounded: true,
			entryX: 0, // Left side of value vertex
			entryY: 0, // Top side of value vertex
		},
	});
	*/
}
