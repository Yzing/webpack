/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Compiler = require("./Compiler");
const MultiCompiler = require("./MultiCompiler");
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const WebpackOptionsDefaulter = require("./WebpackOptionsDefaulter");
const validateSchema = require("./validateSchema");
const WebpackOptionsValidationError = require("./WebpackOptionsValidationError");
const webpackOptionsSchema = require("../schemas/WebpackOptions.json");
const RemovedPluginError = require("./RemovedPluginError");
const version = require("../package.json").version;

// 核心是 compiler
const webpack = (options, callback) => {
	// 校验 options 是否合法
	const webpackOptionsValidationErrors = validateSchema(
		webpackOptionsSchema,
		options
	);
	if (webpackOptionsValidationErrors.length) {
		throw new WebpackOptionsValidationError(webpackOptionsValidationErrors);
	}
	let compiler;
	// 判断是否是多个配置
	if (Array.isArray(options)) {
		// 对每个配置编译得到一个 compiler 数组用来构造 multi-compiler
		compiler = new MultiCompiler(options.map(options => webpack(options)));
	} else if (typeof options === "object") {
		// 添加默认配置
		options = new WebpackOptionsDefaulter().process(options);

		// 创建 compiler 实例
		compiler = new Compiler(options.context);
		compiler.options = options;
		// 注入插件
		new NodeEnvironmentPlugin().apply(compiler);
		// 调用自定义插件
		if (options.plugins && Array.isArray(options.plugins)) {
			for (const plugin of options.plugins) {
				plugin.apply(compiler);
			}
		}
		// 掉用环境初始化完成的钩子
		compiler.hooks.environment.call();
		compiler.hooks.afterEnvironment.call();
		compiler.options = new WebpackOptionsApply().process(options, compiler);
	} else {
		throw new Error("Invalid argument: options");
	}
	// 至此， complier 初始化完成
	if (callback) {
		if (typeof callback !== "function") {
			throw new Error("Invalid argument: callback");
		}
		// 添加文件监听
		if (
			options.watch === true ||
			(Array.isArray(options) && options.some(o => o.watch))
		) {
			const watchOptions = Array.isArray(options)
				? options.map(o => o.watchOptions || {})
				: options.watchOptions || {};
			return compiler.watch(watchOptions, callback);
		}
		// 开始编译文件
		compiler.run(callback);
	}
	return compiler;
};

exports = module.exports = webpack;
exports.version = version;

// 初始化 webpack 对象，常用的配置、插件、和方法
webpack.WebpackOptionsDefaulter = WebpackOptionsDefaulter;
webpack.WebpackOptionsApply = WebpackOptionsApply;
webpack.Compiler = Compiler;
webpack.MultiCompiler = MultiCompiler;
webpack.NodeEnvironmentPlugin = NodeEnvironmentPlugin;
webpack.validate = validateSchema.bind(this, webpackOptionsSchema);
webpack.validateSchema = validateSchema;
webpack.WebpackOptionsValidationError = WebpackOptionsValidationError;

const exportPlugins = (obj, mappings) => {
	for (const name of Object.keys(mappings)) {
		Object.defineProperty(obj, name, {
			configurable: false,
			enumerable: true,
			get: mappings[name]
		});
	}
};

// 对外暴露的插件，可以通过 webpack.plugin 引用
exportPlugins(exports, {
	AutomaticPrefetchPlugin: () => require("./AutomaticPrefetchPlugin"),
	BannerPlugin: () => require("./BannerPlugin"),
	CachePlugin: () => require("./CachePlugin"),
	ContextExclusionPlugin: () => require("./ContextExclusionPlugin"),
	ContextReplacementPlugin: () => require("./ContextReplacementPlugin"),
	DefinePlugin: () => require("./DefinePlugin"),
	Dependency: () => require("./Dependency"),
	DllPlugin: () => require("./DllPlugin"),
	DllReferencePlugin: () => require("./DllReferencePlugin"),
	EnvironmentPlugin: () => require("./EnvironmentPlugin"),
	EvalDevToolModulePlugin: () => require("./EvalDevToolModulePlugin"),
	EvalSourceMapDevToolPlugin: () => require("./EvalSourceMapDevToolPlugin"),
	ExtendedAPIPlugin: () => require("./ExtendedAPIPlugin"),
	ExternalsPlugin: () => require("./ExternalsPlugin"),
	HashedModuleIdsPlugin: () => require("./HashedModuleIdsPlugin"),
	HotModuleReplacementPlugin: () => require("./HotModuleReplacementPlugin"),
	IgnorePlugin: () => require("./IgnorePlugin"),
	LibraryTemplatePlugin: () => require("./LibraryTemplatePlugin"),
	LoaderOptionsPlugin: () => require("./LoaderOptionsPlugin"),
	LoaderTargetPlugin: () => require("./LoaderTargetPlugin"),
	MemoryOutputFileSystem: () => require("./MemoryOutputFileSystem"),
	Module: () => require("./Module"),
	ModuleFilenameHelpers: () => require("./ModuleFilenameHelpers"),
	NamedChunksPlugin: () => require("./NamedChunksPlugin"),
	NamedModulesPlugin: () => require("./NamedModulesPlugin"),
	NoEmitOnErrorsPlugin: () => require("./NoEmitOnErrorsPlugin"),
	NormalModuleReplacementPlugin: () =>
		require("./NormalModuleReplacementPlugin"),
	PrefetchPlugin: () => require("./PrefetchPlugin"),
	ProgressPlugin: () => require("./ProgressPlugin"),
	ProvidePlugin: () => require("./ProvidePlugin"),
	SetVarMainTemplatePlugin: () => require("./SetVarMainTemplatePlugin"),
	SingleEntryPlugin: () => require("./SingleEntryPlugin"),
	SourceMapDevToolPlugin: () => require("./SourceMapDevToolPlugin"),
	Stats: () => require("./Stats"),
	Template: () => require("./Template"),
	UmdMainTemplatePlugin: () => require("./UmdMainTemplatePlugin"),
	WatchIgnorePlugin: () => require("./WatchIgnorePlugin")
});

// 用于性能优化的插件
exportPlugins((exports.optimize = {}), {
	AggressiveMergingPlugin: () => require("./optimize/AggressiveMergingPlugin"),
	AggressiveSplittingPlugin: () =>
		require("./optimize/AggressiveSplittingPlugin"),
	ChunkModuleIdRangePlugin: () =>
		require("./optimize/ChunkModuleIdRangePlugin"),
	LimitChunkCountPlugin: () => require("./optimize/LimitChunkCountPlugin"),
	MinChunkSizePlugin: () => require("./optimize/MinChunkSizePlugin"),
	ModuleConcatenationPlugin: () =>
		require("./optimize/ModuleConcatenationPlugin"),
	OccurrenceOrderPlugin: () => require("./optimize/OccurrenceOrderPlugin"),
	RuntimeChunkPlugin: () => require("./optimize/RuntimeChunkPlugin"),
	SideEffectsFlagPlugin: () => require("./optimize/SideEffectsFlagPlugin"),
	SplitChunksPlugin: () => require("./optimize/SplitChunksPlugin")
});

// web 插件
exportPlugins((exports.web = {}), {
	FetchCompileWasmTemplatePlugin: () =>
		require("./web/FetchCompileWasmTemplatePlugin"),
	JsonpTemplatePlugin: () => require("./web/JsonpTemplatePlugin")
});

// webworker 插件
exportPlugins((exports.webworker = {}), {
	WebWorkerTemplatePlugin: () => require("./webworker/WebWorkerTemplatePlugin")
});

// node 插件
exportPlugins((exports.node = {}), {
	NodeTemplatePlugin: () => require("./node/NodeTemplatePlugin"),
	ReadFileCompileWasmTemplatePlugin: () =>
		require("./node/ReadFileCompileWasmTemplatePlugin")
});

// debug 插件
exportPlugins((exports.debug = {}), {
	ProfilingPlugin: () => require("./debug/ProfilingPlugin")
});

// 工具 插件
exportPlugins((exports.util = {}), {
	createHash: () => require("./util/createHash")
});

const defineMissingPluginError = (namespace, pluginName, errorMessage) => {
	Object.defineProperty(namespace, pluginName, {
		configurable: false,
		enumerable: true,
		get() {
			throw new RemovedPluginError(errorMessage);
		}
	});
};

// TODO remove in webpack 5
defineMissingPluginError(
	exports.optimize,
	"UglifyJsPlugin",
	"webpack.optimize.UglifyJsPlugin has been removed, please use config.optimization.minimize instead."
);

// TODO remove in webpack 5
defineMissingPluginError(
	exports.optimize,
	"CommonsChunkPlugin",
	"webpack.optimize.CommonsChunkPlugin has been removed, please use config.optimization.splitChunks instead."
);
