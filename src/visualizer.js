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
	
	constructor(callStack, container){
		if(!(container instanceof Element)) throw new Error(`Container must be a HTML element!`);

		container.innerHTML = ""; // clear output

		this.#callStack = callStack;
		this.container = container;

		this.graph = new mxg.Graph(this.container); // main "canvas"

		this.root = this.graph.getDefaultParent(); // default parent
	}

	setGraphOptions(){
		this.graph.setEnabled(false);
	}

	updateHTML(){
		console.log(Memviz.squareX, Memviz.rowY, Memviz.labelHeight);
		this.vizCallStack();
	}

	#callStack;

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

	vizCallStack(){
		for(const sf of this.#callStack){
			if(sf.scopeInfo.name == "global")
			this.vizStackFrame(sf);
		}
	}

	vizStackFrame(stackFrame){
		const root = this.root;
		for(const [name, sym] of stackFrame.symtable.objects.entries()){
			if(sym.type == "FNC") continue; // skip functions
			if(!sym.interpreted) continue; // skip not yet interpreted

			//TODO determine nVertical from largest array size
			const nVertical = 3;

			console.log((Memviz.squareXYlen + Memviz.labelHeight*2 + 20) * nVertical);
			const stackFrameRectangle = this.graph.insertVertex({
				root,
				position: [Memviz.sfX, Memviz.sfY],
				value: sf.scopeInfo.name,
				size: [(Memviz.squareXYlen * 1.6 + Memviz.squareX) * stackFrame.symtable.objects.size, (Memviz.squareXYlen + Memviz.labelHeight*2 + 20) * nVertical], // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
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
			this.vizSym(sym);
		}
	}

	vizSym(sym/*TODO params I will need*/){
		console.log(sym);
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

	const square = graph.insertVertex({
		parent: groupRectangle,
		position: [squareX, rowY], // Square position
		size: [squareXYlen, squareXYlen], // Square size
		//value: "ptr",
		style: {
			// label style
			/*labelPosition: "center",
			verticalAlign: "bottom",
			verticalLabelPosition: "top",
			align: "left",
			spacingBottom: 5,*

			// vertex style
			fillColor: "#1BA1E2", // blue
			strokeColor: "#006EAF", // darker blue
			shape: "rectangle", // Explicitly defining it as a square

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
