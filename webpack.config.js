const path = require("path");

module.exports = {
	mode: "production",
	entry: {
		background: "./src/background.js",
		content: "./src/content.js",
	},
	output: {
		filename: "[name].js",
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
		extensions: [".js"],
	},
};
