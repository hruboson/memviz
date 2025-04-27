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
 * @extends Pair
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
 * Memviz styles
 * @description Possible visualization styles and other options
 * @typedef MEMVIZSTYLES
 * @global
 * @const
 */
const MEMVIZSTYLES = {
	STYLE: {
		MEMROW: "MEMROW",
		SEMANTIC: "SEMANTIC",
		NONE: "NONE",
	},
	TRUESIZES: {
		TRUE: true,
		FALSE: false,
	},
}

/**
 * Helper options class, inspired by Vulkan xyCreateInfo
 * @class MemvizOptions
 * @param {string} style
 * @param {boolean} trueSizes
 */
class MemvizOptions {
	static get defaultStyle(){
		return MEMVIZSTYLES.STYLE.MEMROW;
	}

	static get defaultTrueSize(){
		return MEMVIZSTYLES.TRUESIZES.FALSE;
	}

	constructor(style, trueSizes){
		this.style = style ? style : MemvizOptions.defaultStyle;
		this.trueSizes = trueSizes ? trueSizes : MemvizOptions.defaultTrueSize;
	}
}

/**
 * @class Memviz
 * @description Main visualization class, handles memory visualization by choosing appropriate strategy (visualizer) and delegating the main style rendering. This class can render primitive Cells - value, pointer, array, ...
 * @param {Memsim} memsim
 * @param {CallStack} callStack
 * @param {Element} container HTML element to print to - get it by doing document.getElementById
 * @param {MemvizOptions} options
 */
class Memviz {

	constructor(memsim, callStack, container, options){
		if (!(container instanceof Element)) throw new AppError(`Container must be a HTML element!`);

		this.memsim = memsim;
		this.callStack = callStack;
		this.container = container;
		this.options = options;

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
		this.graph.setHtmlLabels(true);
		mxg.InternalEvent.disableContextMenu(this.container);
	}

	/**
	 * @param {MemvizOptions} options
	 * @private
	 */
	#setVisualizer(options){
		switch(options.style){
			case MEMVIZSTYLES.STYLE.MEMROW:
				this.#visualizer = new MemVisualizerRow(this);
				break;
			case MEMVIZSTYLES.STYLE.SEMANTIC:
				this.#visualizer = new MemVisualizerSemantic(this);
				break;
			default:
				this.#visualizer = undefined;
				break;
		}
	}

	/**
	 * Starts visualization. Outputs to container.
	 * @public
	 */
	updateHTML(){
		this.#setVisualizer(this.options);
		if(this.#visualizer){
			this.#visualizer.vizMemoryRecords();
		}
	}

	/**
	 * Visualizer strategy
	 * @type{MemVisualizer}
	 * @private
	 */
	#visualizer;

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
		return 100;
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
		return Memviz.squareXYlen / 3;
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

	/**
	 * Default font size.
	 * @returns {integer}
	 * @static
	 */
	static get fontSize(){
		return 30;
	}

	static get smallestFontSize(){
		return 7;
	}

	/**
	 * Pointer style
	 * @returns {Object}
	 * @static
	 */
	static get pointerStyle(){
		return {
			fillColor: "white",
			strokeColor: "white",
			fontSize: 14,
			labelPosition: "center",
			shape: "ellipse",
		}
	}

	/**
	 * Upper label style
	 * @returns {Object}
	 * @static
	 */
	static get labelAboveStyle(){
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

	/**
	 * Lower label style
	 * @returns {Object}
	 * @static
	 */
	static get labelBelowStyle(){
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
			whitespace: "wrap",
			overflow: "visible",
			editable: true,
		}
	}

	/**********************
	 * CORE VIZ FUNCTIONS *
	 **********************/

	/**
	 * Visualizes single MemoryRecord from frame.
	 * @public
	 * @param {MemoryRecord} record
	 * @param {Cell} parent This will be the records frame.
	 * @param {Number} x
	 * @param {Number} y
	 */
	vizRecord(record, parent, x, y){
		if(!record.address) console.warn(record);
		const style = this.getStyleFromMEMREGION(this.memsim.getMemoryRegion(record.address));

		if(record.size.length > 0){ // array
			return this.vizArrayValue(record, parent, style, x, y);
		}else if(record.indirection > 0){ // pointer
			return this.vizPointerRecord(record, parent, style, x, y);
		}else{ // value
			if(record.memtype == DATATYPE.void){
				const size = MEMSIZES[record.beingPointedToBy];
				const len = record.memsize/size;
				if(len > 1){
					record.specifiers = [record.beingPointedToBy];
					record.addresses = Array.from({length: len}, (_, i) => record.address + i*size);
					record.dimension = 1;
					record.size = [len];
					return this.vizArrayValue(record, parent, style, x, y);
				}

				record.specifiers = [record.beingPointedToBy];
			}
			return this.vizPrimitiveRecord(record, parent, style, x, y);
		} // todo struct
	}

	/**
	 * Visualizes primitive value.
	 * @public
	 * @param {MemoryRecord} record
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} x
	 * @param {Number} y
	 */
	vizPrimitiveRecord(record, parent, style, x, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight * 2;
		const labelAbove = record.name ? record.name : "";
		const labelBelow = record.specifiers ? record.specifiers.join(' ') : record.memtype;
		const ratioToInt = this.options.trueSizes ? MEMSIZES[DATATYPE.int]/record.memsize : 1;
		const width = Memviz.squareXYlen/ratioToInt;
		let value;
		if(record.address){
			value = this.memsim.readRecordValue(record);
		}

		this.vizValueCell(
			/* parent, x, y: */  parent, x, y,
			/* width, height: */ width, Memviz.squareXYlen,
			/* above, below: */  labelAbove, labelBelow,
			/* style: */         style,
			/* address, value:*/ record.address, value
		);

		return {x: x + width, y: y + height};
	}

	/**
	 * Visualizes pointer value.
	 * @public
	 * @param {MemoryRecord} record
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizPointerRecord(record, parent, style, x, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight * 2;
		const labelAbove = record.name ? record.name : "";
		const labelBelow = '*'.repeat(record.indirection) + record.specifiers.join(' ');
		const width = Memviz.squareXYlen;
		let pointingTo;
		if (record.address) {
			pointingTo = this.memsim.readRecordValue(record);
		}

		this.vizPointerCell(
			/* parent, x, y: */  parent, x, y,
			/* width, height: */ width, Memviz.squareXYlen,
			/* above, below: */  labelAbove, labelBelow,
			/* style: */         style,
			/* from, to: */      record.address, pointingTo
		);

		return {x: x + width, y: y + height};
	}

	/**
	 * Visualizes array.
	 * @public
	 * @param {MemoryRecord} record
	 * @param {Cell} parent
	 * @param {Object} style
	 * @param {Number} y
	 */
	vizArrayValue(record, parent, style, x, y){
		const height = Memviz.squareXYlen + Memviz.labelHeight * 2;

		let arrayValue;
		if (record.address) {
			arrayValue = this.memsim.readRecordValue(record);
		}

		if (!Array.isArray(arrayValue) || !arrayValue) {
			return {x: x, y: y + height};
		}

		let totalWidth = 0;
		arrayValue = arrayValue.flat(Infinity);
		let n = 0;
		for(let element of arrayValue){
			const last =  n == arrayValue.length - 1;
			if (record.indirection > 0) {
				let pointingTo = element;
				const width = Memviz.squareXYlen;
				const newX = x + ((Memviz.squareXYlen * n));
				const indices = flatIndexToDimensionalIndices(n, record.size);
				const name = record.name ? record.name : ""
				const labelAbove = name + indices.map(idx => `[${idx}]`).join('');
				let labelBelow = record.specifiers ? '*'.repeat(record.indirection) + record.specifiers.join(' ') : '*'.repeat(record.indirection) + record.memtype;
				labelBelow = n == arrayValue.length - 1 ? labelBelow : "";

				this.vizPointerCell(
					/* parent, x, y: */  parent, newX, y,
					/* width, height: */ width, Memviz.squareXYlen,
					/* above, below: */  labelAbove, labelBelow,
					/* style: */         this.getStyleFromMEMREGION(this.memsim.getMemoryRegion(record.address)),
					/* from, to: */      record.addresses[n], pointingTo
				);
				totalWidth += width;
			} else {
				const isChar = record.memtype == DATATYPE.char || record.memtype == DATATYPE.uchar;
				const value = isChar ? CCharToJsString(element) : element;
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
					/* parent, x, y: */  parent, x + (width * n), y,
					/* width, height: */ width, Memviz.squareXYlen,
					/* above, below: */  labelAbove, labelBelow,
					/* style: */         style,
					/* address, value:*/ record.addresses[n], value
				);
				totalWidth += width;
			}

			n++;
		}

		return {x: x + totalWidth, y: y + height};
	}

	/**
	 * Vizualizes single value cell
	 * @public
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
	vizValueCell(parent, x, y, width, height, labelAbove, labelBelow, cellStyle, cellAddress, cellValue){
		//Scale text size based on how many digits there are in the value and the width of the cell
		const baseFontSize = cellStyle.fontSize || 14;
		let adjustedFontSize = baseFontSize;

		if(cellValue != undefined && cellValue != null){
			const strValue = cellValue.toString();
			const charCount = strValue.length;

			// estimate character width (approx. 0.6em per character for many fonts)
			const approxCharWidth = 0.6 * baseFontSize;
			const totalTextWidth = charCount * approxCharWidth;

			// inside padding
			const availableWidth = width * 0.9;

			if (totalTextWidth > availableWidth) {
				const scaleFactor = availableWidth / totalTextWidth;
				adjustedFontSize = Math.max(Memviz.smallestFontSize, baseFontSize * scaleFactor); // smallest possible font size is 7
			}
		}

		const copyCellStyle = structuredClone(cellStyle);
		copyCellStyle.fontSize = adjustedFontSize;

		if(cellValue === '\\0') copyCellStyle.fontSize = cellStyle.fontSize/1.5; // make strign terminator smaller
		if(cellValue == undefined) cellValue = "";
		const valueBox = this.graph.insertVertex({
			parent: parent,
			position: [x, y],
			size: [width, height],
			value: cellValue,
			style: copyCellStyle,
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
	 * @public
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
	vizPointerCell(parent, x, y, width, height, labelAbove, labelBelow, cellStyle, pointingFrom, pointingTo){
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
	 * @public
	 */
	vizPointers(){
		const root = this.root;
		let pairsXcoords = [];

		for (let pair of this.pointerPairs) {
			// first determine where to point
			const targetCellValue = this.symbols.get(pair.to.address);
			if (!targetCellValue) { console.warn(`Cannot visualize pointer from ${pair.from.address} to ${pair.to.address}`); return; };
			pair.to.cell = targetCellValue.cell;

			// get x coordinates from global perspective
			const fromCellGlobal = this.graph.view.getState(pair.from.cell);
			const toCellGlobal = this.graph.view.getState(targetCellValue.cell);

			// count overlaps of already existing edges
			let overlapCount = 0;
			for(const existingPair of pairsXcoords){
				const newStart = Math.min(fromCellGlobal.x, toCellGlobal.x);
				const newEnd = Math.max(fromCellGlobal.x, toCellGlobal.x);
				const existingStart = Math.min(existingPair.first, existingPair.second);
				const existingEnd = Math.max(existingPair.first, existingPair.second);

				const overlap = !(newEnd < existingStart || newStart > existingEnd);
				if(overlap){
					overlapCount++;
				}
			}

			// add edge to existing edges
			pairsXcoords.push(new Pair(fromCellGlobal.x, toCellGlobal.x));

			if(this.edgeStyle == "visualizerEdgeStyle"){ // custom edge found
				const edge = this.graph.insertEdge({
					parent: root,
					source: pair.from.cell,
					target: pair.to.cell,
					style: {
						edgeStyle: "VisualizerEdgeStyle",
						strokeColor: "white",
						rounded: false,
						entryX: 0, // Left side of value vertex
						entryY: 0, // Top side of value vertex
						exitX: 0.5,  // Middle of the source cell
						exitY: 0.5,    // Top of the source cell
					},
				});
			}else if(this.edgeStyle == "rowEdgeStyle"){
				const styleName = `rowEdgeStyle${overlapCount+1}`;
				mxg.StyleRegistry.putValue(styleName, this.createRowEdgeStyle(overlapCount+1)); // get edge function that has offset of overlap count + 1
				const edge = this.graph.insertEdge({
					parent: root,
					source: pair.from.cell,
					target: pair.to.cell,
					style: {
						edgeStyle: styleName,
						strokeColor: "white",
						rounded: false,
						entryX: 0, // Left side of value vertex
						entryY: 0, // Top side of value vertex
						exitX: 0.5,  // Middle of the source cell
						exitY: 0.5,    // Top of the source cell
					},
				});
			}else{ // default to straight edge
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
			}

			this.graph.refresh();
		}
	}

	/********************
	 * HELPER FUNCTIONS *
	 ********************/

	/**
	 * Function generator. Generates different functions depending on the pairNo parameter
	 * @function
	 * @public
	 */
	createRowEdgeStyle(pairNo){
		return (state, source, target, points, result) => {
			// creates two points - one above source and one above target, these act as anchors, so the edge must go through them - todo: calculate height based on how many pointers there are
			if (source && target) {
				const ptSource = new mxg.Point();
				const ptTarget = new mxg.Point();

				ptSource.x = source.x + 10;
				ptSource.y = source.y - 50 - pairNo*5;

				ptTarget.x = target.x;
				ptTarget.y = target.y - 25 - pairNo*5;

				result.push(ptSource);
				result.push(ptTarget);
			}
		}
	};

	/**
	 * Returns style based on memregion.
	 * @param {MEMREGION} memregion
	 * @return {Object} style Can be used while inserting vertex to the graph.
	 */
	getStyleFromMEMREGION(memregion){
		const fontSize = Memviz.fontSize;
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

/**
 * @class MemVisualizer
 * @description Abstract class for different visualizers (strategy pattern). It's basically just interface.
 * @param {Memviz} memviz
 */
class MemVisualizer {
	constructor(memviz){
		abstract(this, "MemVisualizer");
		intfc(this, "vizMemoryRecords");
		intfc(this, "vizStackFrame");
		intfc(this, "vizHeapFrame");
		intfc(this, "vizDataFrame");
		this.memviz = memviz;

		/**
		 * MemVisualizer can also implement custom edge style, if it is defined, it will be used
		 */
	}
}

/**
 * @class MemVisualizerSemantic
 * @extends MemVisualizer
 * @description One of visualization strategies
 * @param {Memviz} memviz
 */
class MemVisualizerSemantic extends MemVisualizer {
	constructor(memviz){
		super(memviz);

		/**
		 * Function defining new edge style for the mxg library
		 */
		const VisualizerEdgeStyle = (state, source, target, points, result) => {
			if (source && target) {
				const pt = new mxg.Point(target.getCenterX(), source.getCenterY());

				if (mxg.mathUtils.contains(source, pt.x, pt.y)) {
					pt.y = source.y + source.height;
				}

				result.push(pt);
			}
		};

		mxg.StyleRegistry.putValue("visualizerEdgeStyle", VisualizerEdgeStyle); // register style with library
		this.memviz.edgeStyle = "visualizerEdgeStyle"; // will be used to connect pointers
	}

	/**
	 * Visualizes the whole call stack.
	 * @function
	 */
	vizMemoryRecords(){
		let nextY = 10;
		const hf = this.memviz.callStack.hFrame;
		const df = this.memviz.callStack.dFrame;

		if(!hf.empty()){
			nextY = this.vizHeapFrame(hf, nextY);
		}

		if(!df.empty()){
			nextY = this.vizDataFrame(df, nextY);
		}

		for (const sf of this.memviz.callStack) {
			nextY = this.vizStackFrame(sf, nextY);
		}

		this.memviz.vizPointers();
	}

	/**
	 * Visualizes heap part of callstack
	 * @function
	 */
	vizHeapFrame(hf, y){
		const nHorizontal = hf.records.length;
		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
		let sfY = y + Memviz.labelHeight + 10;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if (hf.records.length > 0) {
			height += 20; // inner padding for each row inside sf
			height *= hf.records.length;
		}
		height += 20; // bottom padding

		const root = this.memviz.root;
		const heapFrameRectangle = this.memviz.graph.insertVertex({
			root,
			position: [Memviz.sfX, sfY],
			height: height,
			width: width,
			value: "Heap",
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
			const xy = this.memviz.vizRecord(heapObject, heapFrameRectangle, Memviz.sfX, nextY);
			nextY = xy.y;
		}

		return sfY + height;
	}

	/**
	 * Visualizes data part (mostly strings) of callstack
	 * @function
	 */
	vizDataFrame(df, y){
		const nHorizontal = df.records.length;
		const width = (Memviz.squareXYlen * 1.6 + Memviz.squareX) * nHorizontal; // 1.6 is perfect for centering (same inner padding on both sides), 0 for auto height
		let sfY = y + Memviz.labelHeight + 10;

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if (df.records.length > 0) {
			height += 20; // inner padding for each row inside sf
			height *= df.records.length;
		}
		height += 20; // bottom padding

		const root = this.memviz.root;
		const dataFrameRectangle = this.memviz.graph.insertVertex({
			root,
			position: [Memviz.sfX, sfY],
			height: height,
			width: width,
			value: "Data",
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
			const xy = this.memviz.vizRecord(dataObject, dataFrameRectangle, Memviz.sfX, nextY);
			nextY = xy.y;
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
		let displayName = "";
		if (sf.emptyObjects() || sf.empty()) { // in case of no names in symtable
			return y;
		}

		if (sf.symtable.scopeInfo.type == "stmt") { // in case of compound statement (... {...} ...) keep the function name
			displayName = sf.parent.symtable.scopeInfo.name + " > " + sf.symtable.scopeInfo.name;
		}

		if (sf.symtable.scopeInfo.type == "function params") {
			displayName = sf.symtable.scopeInfo.name + " > parameters";
		}

		if(displayName == "") displayName = sf.symtable.scopeInfo.name;

		const filteredObjects = Array.from(sf.symtable.objects.entries()).filter(([_, sym]) => sym.type !== "FNC" && sym.interpreted);

		let height = (Memviz.squareXYlen + Memviz.labelHeight);
		if (filteredObjects.length > 0) {
			height += 20; // inner padding for each row inside sf
			height *= filteredObjects.length;
		}
		height += 20; // bottom padding

		const width = (Memviz.squareXYlen + Memviz.squareX/1.5); // 1.5 is perfect for centering (same inner padding on both sides), 0 for auto height

		let sfY = y + Memviz.labelHeight + 10;

		const root = this.memviz.root;
		const stackFrameRectangle = this.memviz.graph.insertVertex({
			root,
			position: [Memviz.sfX, sfY],
			value: displayName,
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
		for(const [_, record] of filteredObjects){
			const xy = this.memviz.vizRecord(record, stackFrameRectangle, Memviz.sfX, nextY);
			nextY = xy.y;
		}

		return sfY + height;
	}
}

/**
 * @class MemVisualizerSemantic
 * @extends MemVisualizer
 * @description One of visualization strategie
 * @param {Memviz} memviz
 */
class MemVisualizerRow extends MemVisualizer {
	constructor(memviz){
		super(memviz);

		this.memviz.edgeStyle = "rowEdgeStyle"; // will be used to connect pointers
	}

	static get memoryRowHeight(){
		return 200;
	}

	static get memoryRowSegmentStyle(){
		return {
			// label style
			labelPosition: "left",
			verticalAlign: "bottom",
			verticalLabelPosition: "top",
			spacingBottom: 5,
			align: "right",

			// 
			fillColor: "transparent",
			strokeColor: "grey",
			shape: "rectangle",
			dashed: true,
			dashPattern: "3 7", // 3px dash, 7px gap

			// fonts
			fontSize: 11,
			fontColor: Memviz.fontColor,
			fontFamily: Memviz.fontFamily,
		};
	}

	vizDivider(parent, x, y, width, height){
		const stripedRectangle = this.memviz.graph.insertVertex({
			parent,
			position: [x, y],
			width: width,
			height: height,
			style: {
				shape: "image",
				image: "img/diagonal-stripes.svg",
				imageAlign: "center",
				imageAspect: true,

				strokeColor: "gray",
				flipH: false,
				flipV: false
			},
		});

		return {x: x+width, y: y+height};
	}

	vizDottedDivider(parent, x, y, width, height){
		const stripedRectangle = this.memviz.graph.insertVertex({
			parent,
			position: [x, y],
			width: width,
			height: height,
			style: {
				shape: "image",
				image: "img/white-dots.svg",
				imageAlign: "center",
				imageAspect: true,

				strokeColor: "gray",
				flipH: false,
				flipV: false
			},
		});

		return {x: x+width, y: y+height};
	}

	/**
	 * Visualizes the whole call stack.
	 * @function
	 */
	vizMemoryRecords(){
		const rectHeight = MemVisualizerRow.memoryRowHeight;

		const hf = this.memviz.callStack.hFrame;
		const df = this.memviz.callStack.dFrame;

		// calculate center y from container height
		const graphContainer = this.memviz.graph.container;
		const containerHeight = graphContainer.clientHeight;
		const containerWidth = graphContainer.clientWidth;
		const y = (containerHeight - rectHeight) / 2;
		const x = Memviz.sfX;

		const root = this.memviz.root;
		const scrollableRectangle = this.memviz.graph.insertVertex({
			root,
			position: [x, y],
			//value: `<div style="transform: rotate(45deg); transform-origin: top right; white-space: nowrap;">Application memory</div>`,
			height: rectHeight,
			/*width: containerWidth-50-x,*/
			style: {
				// label style
				labelPosition: "left",
				verticalAlign: "bottom",
				verticalLabelPosition: "top",
				spacingBottom: 5,
				align: "right",

				strokeColor: "grey",
				fillColor: "transparent",
				shape: "rectangle",

				// font style
				fontSize: 14,
				fontColor: Memviz.fontColor,

				fontFamily: Memviz.fontFamily,
			},
		});

		// bss frame
		const bf = [];

		// move globals to dataframe and unitialized to bss, also check if there are any stacks, also move uninitialized variables to bss frame
		let stackEmpty = true;
		for(const sf of this.memviz.callStack){
			if(sf.symtable.scopeInfo.name == "global" && sf.symtable.scopeInfo.type == "global"){
				for(const [_, symbol] of sf.symtable.objects){
					if(symbol.initialized && !symbol.isFunction && !symbol.isNative && !df.records.includes(symbol)){
						df.add(symbol);
					}
					if(!symbol.initialized && !symbol.isFunction && !symbol.isNative && !bf.includes(symbol) && !symbol.type == SYMTYPE.OBJ){
						bf.push(symbol);
					}
				}
				continue;
			}else{
				for(const [_, sym] of sf.symtable.objects){
					if(sym.interpreted){
						stackEmpty = false;
						break;
					}
				}
			}
		}

		let nextX = 0;

		const codeSegmentWidth = 70;
		if(!df.empty() || !hf.empty() || !stackEmpty || bf.length != 0){
			const firstDivXY = this.vizDivider(scrollableRectangle, nextX, 0, 50, MemVisualizerRow.memoryRowHeight);
			nextX = firstDivXY.x;
			const codeSegmentParent = this.memviz.graph.insertVertex({
				parent: scrollableRectangle,
				value: `<div style="transform: rotate(90deg); transform-origin: center; white-space: nowrap;">Code segment</div>`,
				position: [nextX, 0],
				height: rectHeight,
				width: codeSegmentWidth,
				style: {
					fillColor: "grey",
					strokeColor: "grey",
					shape: "rectangle",
					fontSize: 12,
					fontColor: Memviz.fontColor,
					fontFamily: Memviz.fontFamily,
				},
			});
			nextX += codeSegmentWidth;
			const secondDivXY = this.vizDivider(scrollableRectangle, nextX, 0, 50, MemVisualizerRow.memoryRowHeight);
			nextX = secondDivXY.x;
		}

		if(!df.empty()){
			const dfStyle = MemVisualizerRow.memoryRowSegmentStyle;
			dfStyle.dashed = false;
			const dataSegmentParent = this.memviz.graph.insertVertex({
				parent: scrollableRectangle,
				position: [nextX, 0],
				height: rectHeight,
				value: `<div style="transform: rotate(45deg); transform-origin: top right; white-space: nowrap;">Data</div>`,
				style: dfStyle, 
			});
			nextX += this.vizDataFrame(df, dataSegmentParent, 0);
			const thirdDivXY = this.vizDivider(scrollableRectangle, nextX, 0, 50, MemVisualizerRow.memoryRowHeight);
			nextX = thirdDivXY.x;
		}

		if(bf.length > 0){
			const bssStyle = MemVisualizerRow.memoryRowSegmentStyle;
			bssStyle.dashed = false;
			const bssSegmentParent = this.memviz.graph.insertVertex({
				parent: scrollableRectangle,
				position: [nextX, 0],
				height: rectHeight,
				value: `<div style="transform: rotate(45deg); transform-origin: top right; white-space: nowrap;">BSS</div>`,
				style: bssStyle, 
			});
			nextX += this.vizBssFrame(bf, bssSegmentParent, 0);
			const thirdDivXY = this.vizDivider(scrollableRectangle, nextX, 0, 50, MemVisualizerRow.memoryRowHeight);
			nextX = thirdDivXY.x;
		}

		if(!hf.empty()){
			const hfStyle = MemVisualizerRow.memoryRowSegmentStyle;
			const heapParent = this.memviz.graph.insertVertex({
				parent: scrollableRectangle,
				position: [nextX, 0],
				height: rectHeight,
				value: `<div style="transform: rotate(45deg); transform-origin: top right; white-space: nowrap;">Heap</div>`,
				style: hfStyle, 
			});
			nextX += this.vizHeapFrame(hf, heapParent, 0);
			if(!stackEmpty){
				const variableDivider = this.vizDottedDivider(scrollableRectangle, nextX, 0, 50, MemVisualizerRow.memoryRowHeight);
				nextX = variableDivider.x;
			}
		}


		if(!stackEmpty){
			const stackParent = this.memviz.graph.insertVertex({
				parent: scrollableRectangle,
				position: [nextX, 0],
				height: rectHeight,
				value: `<div style="transform: rotate(45deg); transform-origin: top right; white-space: nowrap;">Stack</div>`,
				style: MemVisualizerRow.memoryRowSegmentStyle, 
			});

			let stackX = 0;
			for(let i = this.memviz.callStack.sFrames.length - 1; i >= 0; i--){
				const sf = this.memviz.callStack.sFrames[i];
				if(sf.symtable.scopeInfo.name == "global" && sf.symtable.scopeInfo.type == "global"){ // skip global frame
					continue;
				}
				stackX = this.vizStackFrame(sf, stackParent, stackX);
			}

			nextX += stackX;
			const thirdDivXY = this.vizDivider(scrollableRectangle, nextX, 0, 50, MemVisualizerRow.memoryRowHeight);
			nextX = thirdDivXY.x;
		}

		this.memviz.vizPointers();
	}

	/**
	 * Visualizes data part (mostly strings) of callstack
	 * @function
	 */
	vizDataFrame(df, parent, x){
		let nextX = x;
		for(const dataObject of df.records){
			const xy = this.memviz.vizRecord(dataObject, parent, nextX, (MemVisualizerRow.memoryRowHeight/2)-(Memviz.squareXYlen/2));
			nextX = xy.x;
		}
		return nextX;
	}

	/**
	 * Visualized uninitialized symbols
	 * @function
	 */
	vizBssFrame(bf, parent, x){
		let nextX = x;
		for(const dataObject of bf){
			const xy = this.memviz.vizRecord(dataObject, parent, nextX, (MemVisualizerRow.memoryRowHeight/2)-(Memviz.squareXYlen/2));
			nextX = xy.x;
		}
		return nextX;
	}

	/**
	 * Visualizes heap part of callstack
	 * @function
	 */
	vizHeapFrame(hf, parent, x){
		let nextX = x;
		for(const dataObject of hf.records){
			const xy = this.memviz.vizRecord(dataObject, parent, nextX, (MemVisualizerRow.memoryRowHeight/2)-(Memviz.squareXYlen/2));
			nextX = xy.x;
		}
		return nextX;
	}

	/**
	 * Visualizes one stack frame.
	 * @function
	 * @param {StackFrame} sf
	 * @param {Number} y Y coordinate to visualize the stack frame.
	 * @returns {Number} newY Used to calculate the position of next stack frame.
	 */
	vizStackFrame(sf, parent, x){
		let nextX = x;
		const filteredObjects = Array.from(sf.symtable.objects.entries()).filter(([_, sym]) => sym.type !== "FNC" && sym.interpreted).reverse();
		for(const [_, record] of filteredObjects){
			const xy = this.memviz.vizRecord(record, parent, nextX, (MemVisualizerRow.memoryRowHeight/2)-(Memviz.squareXYlen/2));
			nextX = xy.x;
		}
		return nextX;
	}
}
