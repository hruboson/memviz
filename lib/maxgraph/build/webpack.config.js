const path = require("path");

module.exports = {
	entry: "./webpack.js", // entry (input) file 
	output: {
		filename: "maxgraph.bundle.js", // output filename
		path: path.resolve(__dirname, "output/"), // target directory (output directory)
		library: "maxgraph", // library name
		libraryTarget: "umd",
		clean: true,
	},
	mode: "production",
	resolve: {
		extensions: [".js", ".mjs", ".json"], // Umožní Webpacku rozpoznat přípony
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				resolve: {
					fullySpecified: false, // Povolit importy bez uvedení přípon
				},
			},
		],
	},
};
