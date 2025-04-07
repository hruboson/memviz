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
	constructor(address, cell) {
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
	constructor(address, cell) {
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
	constructor(from, to) {
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

	constructor(memVizStyle, memsim, callStack, container) {
		if (!(container instanceof Element)) throw new AppError(`Container must be a HTML element!`);

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
	#init() {
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
	#setGraphOptions() {
		this.graph.setEnabled(false);
		mxg.InternalEvent.disableContextMenu(this.container);
	}

	/**
	 * Starts visualization. Outputs to container.
	 * @public
	 */
	updateHTML() {
		//console.log(this.memVizStyle);
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
	static get squareXYlen() {
		return 70;
	}

	/**
	 * Height and width of pointer circle (inside of memory unit)
	 * @returns {Number}
	 * @static
	 */
	static get circleXYlen() {
		return 20;
	}

	/**
	 * Starting X position of first element in stack frame
	 * @returns {Number}
	 * @static
	 */
	static get squareX() {
		return 30;
	}

	/**
	 * Starting Y position of the first element in stack frame
	 * @returns {Number}
	 * @static
	 */
	static get rowY() {
		return 30;
	}

	/**
	 * Starting X position of the first stack frame (global)
	 * @returns {Number}
	 * @static
	 */
	static get sfX() {
		return 30;
	}

	/**
	 * Starting Y position of the first stack frame (global)
	 * @returns {Number}
	 * @static
	 */
	static get sfY() {
		return 30;
	}

	/**
	 * Height of label above and below of memory unit
	 * @returns {Number}
	 * @static
	 */
	static get labelHeight() {
		return Memviz.squareXYlen / 3;
	}

	/**
	 * Font family. Is set to all visualized elements.
	 * @returns {string}
	 * @static
	 */
	static get fontFamily() {
		return "FiraCode";
	}

	/**
	 * Font color. Is set to all visualized elements.
	 * @returns {string}
	 * @static
	 */
	static get fontColor() {
		return "white";
	}

	static get pointerStyle() {
		return {
			fillColor: "white",
			strokeColor: "white",
			fontSize: 14,
			labelPosition: "center",
			shape: "ellipse",
		}
	}

	static get labelAboveStyle() {
		return {
			fillColor: "transparent",
			strokeColor: "transparent",
			labelPosition: "center",
			verticalLabelPosition: "middle",
			align: "left",

			// font style
			fontSize: 11,
			fontColor: Memviz.fontColor,
			fontFamily: Memviz.fontFamily,

			// overflow
			whitespace: 'wrap',
			overflow: 'hidden',
			editable: true,
		}
	}

	static get labelBelowStyle() {
		return {
			fillColor: "transparent",
			strokeColor: "transparent",
			labelPosition: "center",
			verticalLabelPosition: "middle",
			align: "right",

			// font style
			fontSize: 14,
			fontColor: Memviz.fontColor,
			fontFamily: Memviz.fontFamily,

			// overflow
			whitespace: 'wrap',
			overflow: 'hidden',
			editable: true,
		}
	}

	/**********************
	 * CORE VIZ FUNCTIONS *
	 **********************/

	/**
	 * Visualizes the whole call stack.
	 * @function
	 */
	vizMemoryRecords() {
		this.#init();

		let nextY = 10;
		const hf = this.callStack.hFrame;
		const df = this.callStack.dFrame;

		nextY = this.vizHeapFrame(hf, nextY);
		nextY = this.vizDataFrame(df, nextY);

		for (const sf of this.callStack) {
			nextY = this.vizStackFrame(sf, nextY);
		}

		this.vizPointers();
	}

	vizHeapFrame(hf, y) {
		const nHorizontal = hf.records.length;
		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
		let sfY = y + Memviz.labelHeight + 10;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if (hf.records.length > 0) {
			height += 20; // inner padding for each row inside sf
			height *= hf.records.length;
		}
		height += 20; // bottom padding

		const root = this.root;
		const heapFrameRectangle = this.graph.insertVertex({
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

		for (const heapObject of hf.records) {
			nextY = this.vizRecord(heapObject, heapFrameRectangle, nextY);
		}

		return sfY + height;

	}

	vizDataFrame(df, y) {
		const nHorizontal = df.records.length;
		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
		let sfY = y + Memviz.labelHeight + 10;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if (df.records.length > 0) {
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

		for (const dataObject of df.records) {
			nextY = this.vizRecord(dataObject, dataFrameRectangle, nextY);
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
	vizStackFrame(sf, y) {
		if (sf.empty()) { // in case of no names in symtable
			return y;
		}

		if (sf.symtable.scopeInfo.type == "stmt") { // in case of compound statement (... {...} ...) keep the function name
			sf.symtable.scopeInfo.name = sf.parent.symtable.scopeInfo.name + " > " + sf.symtable.scopeInfo.name;
		}

		if (sf.symtable.scopeInfo.type == "function params") {
			sf.symtable.scopeInfo.name = sf.symtable.scopeInfo.name + " > parameters";
		}

		const filteredObjects = Array.from(sf.symtable.objects.entries()).filter(([name, sym]) => sym.type !== "FNC" && sym.interpreted);

		//TODO determine nVertical from largest array size
		const nHorizontal = 3;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if (filteredObjects.length > 0) {
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
		for (const [name, record] of filteredObjects) {
			nextY = this.vizRecord(record, stackFrameRectangle, nextY);
		}

		return sfY + height;
	}

	/**
	 * Visualizes single MemoryRecord from stack frame.
	 * @param {MemoryRecord} record
	 * @param {Cell} parent This will be the recordbols stack frame.
	 * @param {Number} y
	 */
	vizRecord(record, parent, y) {
		if (!record.address) console.warn(record);
		const style = this.getStyleFromMEMREGION(this.memsim.getMemoryRegion(record.address));

		if (record.size.length > 0) { // array
			return this.vizArrayValue(record, parent, style, y);
		} else if (record.indirection > 0) { // pointer
			return this.vizPointerRecord(record, parent, style, y);
		} else { // value
			return this.vizPrimitiveRecord(record, parent, style, y);
		} // todo struct
	}

	/**
	 * Visualizes primitive value.
	 * @param {MemoryRecord} record
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizPrimitiveRecord(record, parent, style, y) {
		const height = Memviz.squareXYlen + Memviz.labelHeight * 2;
		const labelAbove = record.name ? record.name : "";
		const labelBelow = record.specifiers ? record.specifiers.join(' ') : record.memtype;
		const width = record.memtype == DATATYPE.char || record.memtype == DATATYPE.uchar ? Memviz.squareXYlen / 2 : Memviz.squareXYlen;
		let value;
		if (record.address) {
			value = this.memsim.readRecordValue(record);
		}

		this.vizValueCell(
			/* parent, x, y: */  parent, Memviz.squareX, y,
			/* width, height: */ width, Memviz.squareXYlen,
			/* above, below: */  labelAbove, labelBelow,
			/* style: */         style,
			/* address, value:*/ record.address, value
		);

		return y + height;
	}

	/**
	 * Visualizes pointer value.
	 * @param {MemoryRecord} record
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizPointerRecord(record, parent, style, y) {
		const height = Memviz.squareXYlen + Memviz.labelHeight * 2;
		const labelAbove = record.name ? record.name : "";
		const labelBelow = '*'.repeat(record.indirection) + record.specifiers.join(' ');
		let pointingTo;
		if (record.address) {
			pointingTo = this.memsim.readRecordValue(record);
		}

		this.vizPointerCell(
			/* parent, x, y: */  parent, Memviz.squareX, y,
			/* width, height: */ Memviz.squareXYlen, Memviz.squareXYlen,
			/* above, below: */  labelAbove, labelBelow,
			/* style: */         style,
			/* from, to: */      record.address, pointingTo
		);

		return y + height;
	}

	/**
	 * Visualizes array.
	 * @param {MemoryRecord} record
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizArrayValue(record, parent, style, y) {
		const height = Memviz.squareXYlen + Memviz.labelHeight * 2;

		let arrayValue;
		if (record.address) {
			arrayValue = this.memsim.readRecordValue(record);
		}

		if (!Array.isArray(arrayValue) || !arrayValue) {
			return y + height;
		}

		arrayValue = arrayValue.flat(Infinity);
		let n = 0;
		for (let element of arrayValue) {
			const last =  n == arrayValue.length - 1;
			if (record.indirection > 0) {
				let pointingTo = element;
				const x = Memviz.squareX + ((Memviz.squareXYlen * n));
				const indices = flatIndexToDimensionalIndices(n, record.size);
				const name = record.name ? record.name : ""
				const labelAbove = name + indices.map(idx => `[${idx}]`).join('');
				let labelBelow = record.specifiers ? '*'.repeat(record.indirection) + record.specifiers.join(' ') : '*'.repeat(record.indirection) + record.memtype;
				labelBelow = n == arrayValue.length - 1 ? labelBelow : "";

				this.vizPointerCell(
					/* parent, x, y: */  parent, x, y,
					/* width, height: */ Memviz.squareXYlen, Memviz.squareXYlen,
					/* above, below: */  labelAbove, labelBelow,
					/* style: */         this.getStyleFromMEMREGION(this.memsim.getMemoryRegion(record.address)),
					/* from, to: */      record.addresses[n], pointingTo
				);
			} else {
				const isChar = record.memtype == DATATYPE.char || record.memtype == DATATYPE.uchar;
				const value = record.memtype == DATATYPE.char || record.memtype == DATATYPE.uchar ? CCharToJsString(element) : element;
				const indices = flatIndexToDimensionalIndices(n, record.size);
				const name = record.name ? record.name : ""
				let labelAbove = name + indices.map(idx => `[${idx}]`).join('');
				let labelBelow = record.specifiers ? record.specifiers.join(' ') : record.memtype;
				labelBelow = last ? labelBelow : "";
				const width = isChar ? Memviz.squareXYlen / 2 : Memviz.squareXYlen;

				if(labelAbove.length > 5 && isChar){ // shorten record name
					labelAbove = name[0] + indices.map(idx => `[${idx}]`).join('');
				}

				if(labelAbove.length > 8 && !isChar){
					labelAbove = name.slice(0, 7) + indices.map(idx => `[${idx}]`).join('');
				}

				this.vizValueCell(
					/* parent, x, y: */  parent, Memviz.squareX + (width * n), y,
					/* width, height: */ width, Memviz.squareXYlen,
					/* above, below: */  labelAbove, labelBelow,
					/* style: */         style,
					/* address, value:*/ record.addresses[n], value
				);
			}

			n++;
		}

		return y + height;
	}

	/**
	 * Vizualizes single value cell
	 * @param {Cell} parent
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @param {string} labelAbove
	 * @param {string} labelBelow
	 * @param {Object} cellStyle
	 * @param {integer} cellAddress
	 * @param {integer|string} cellValue
	 */
	vizValueCell(parent, x, y, width, height, labelAbove, labelBelow, cellStyle, cellAddress, cellValue) {
		const valueBox = this.graph.insertVertex({
			parent: parent,
			position: [x, y],
			size: [width, height],
			value: cellValue,
			style: cellStyle,
		});

		const labelAboveCell = this.graph.insertVertex({
			parent: parent,
			position: [x, y - Memviz.labelHeight],
			size: [width, Memviz.labelHeight],
			value: labelAbove,
			style: Memviz.labelAboveStyle,
		});

		const labelBelowCell = this.graph.insertVertex({
			parent: parent,
			position: [x, y + height], // Position below the square
			size: [width, Memviz.labelHeight],
			value: labelBelow,
			style: Memviz.labelBelowStyle,
		});

		this.symbols.set(cellAddress, new VizCellValue(cellAddress, valueBox));
	}

	/**
	 * Vizualizes single pointer cell
	 * @param {Cell} parent
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 * @param {string} labelAbove
	 * @param {string} labelBelow
	 * @param {Object} cellStyle
	 * @param {integer} pointingFrom
	 * @param {integer} pointingTo
	 */
	vizPointerCell(parent, x, y, width, height, labelAbove, labelBelow, cellStyle, pointingFrom, pointingTo) {
		const valueBox = this.graph.insertVertex({
			parent: parent,
			position: [x, y],
			size: [width, height],
			style: cellStyle,
		});

		let circle;
		if (pointingTo) {
			circle = this.graph.insertVertex({
				parent: valueBox, // the square is the parent
				position: [(width / 2) - (Memviz.circleXYlen / 2), (height / 2) - (Memviz.circleXYlen / 2)], // position relative to the square
				size: [Memviz.circleXYlen, Memviz.circleXYlen], // circle size
				style: Memviz.pointerStyle,
			});
		}

		const labelAboveCell = this.graph.insertVertex({
			parent: parent,
			position: [x, y - Memviz.labelHeight], // this might make some trouble later on
			size: [width, Memviz.labelHeight],
			value: labelAbove,
			style: Memviz.labelAboveStyle,
		});

		const labelBelowCell = this.graph.insertVertex({
			parent: parent,
			position: [x, y + height], // Position below the square
			size: [width, Memviz.labelHeight],
			value: labelBelow,
			style: Memviz.labelBelowStyle,
		});

		if (pointingTo) {
			this.pointerPairs.push(
				new VizPointerPair(
					new VizCellPointer(pointingFrom, circle),
					new VizCellValue(pointingTo, null) // will be determined at the end of call stack visualization
				)
			);
		}

		this.symbols.set(pointingFrom, new VizCellValue(pointingFrom, valueBox));
	}

	/**
	 * Creates edges of pointers pointing to values.
	 * @function
	 */
	vizPointers() {
		const root = this.root;
		for (let pair of this.pointerPairs) {
			// first determine where to point
			const targetCellValue = this.symbols.get(pair.to.address);
			if (!targetCellValue) { console.warn(`Cannot visualize pointer from ${pair.from.address} to ${pair.to.address}`); return; };
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
	getStyleFromMEMREGION(memregion) {
		const fontSize = 30;
		const fontColor = Memviz.fontColor;
		const fontFamily = Memviz.fontFamily;

		switch (memregion) {
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
