const path = require("path");

module.exports = {
	mode: "production",
	entry: "./src/content.js",
	output: {
		filename: "content.js",
		path: path.resolve(__dirname, "dist"),
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"],
					},
				},
			},
		],
	},
	resolve: {
		fallback: {
			path: false,
		},
	},
};
