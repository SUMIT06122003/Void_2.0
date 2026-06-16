const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
require("dotenv").config();

const apiProxyTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:4000";

module.exports = {
  entry: "./src/main.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "assets/[name].[contenthash].js",
    assetModuleFilename: "assets/[name].[hash][ext][query]",
    clean: true
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: "defaults" }],
              ["@babel/preset-react", { runtime: "automatic" }]
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpe?g|webp|svg|mp4)$/i,
        type: "asset/resource"
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __CLOUDINARY_CLOUD_NAME__: JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME || ""),
      __CLOUDINARY_BASE_FOLDER__: JSON.stringify(process.env.CLOUDINARY_BASE_FOLDER || "void"),
      __CLOUDINARY_IMAGE_TRANSFORM__: JSON.stringify(process.env.CLOUDINARY_IMAGE_TRANSFORM || "f_auto,q_auto"),
      __CLOUDINARY_VIDEO_TRANSFORM__: JSON.stringify(process.env.CLOUDINARY_VIDEO_TRANSFORM || "f_auto,q_auto")
    }),
    new HtmlWebpackPlugin({
      template: "./index.html"
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist")
    },
    historyApiFallback: true,
    proxy: [
      {
        context: ["/api", "/uploads"],
        target: apiProxyTarget,
        secure: false
      }
    ],
    port: 3000,
    hot: true
  }
};
