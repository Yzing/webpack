"use strict";

const errorMessage = (schema, data, message) => ({
	keyword: "absolutePath",
	params: { absolutePath: data },
	message: message,
	parentSchema: schema
});

const getErrorFor = (shouldBeAbsolute, data, schema) => {
	const message = shouldBeAbsolute
		? `The provided value ${JSON.stringify(data)} is not an absolute path!`
		: `A relative path is expected. However, the provided value ${JSON.stringify(
				data
		  )} is an absolute path!`;

	return errorMessage(schema, data, message);
};

module.exports = ajv =>
	ajv.addKeyword("absolutePath", {
		errors: true,
		type: "string",
		compile(expected, schema) {
			function callback(data) {
				let passes = true;
				const isExclamationMarkPresent = data.includes("!");

				// 匹配 windows 或者 unix 的绝对路径
				const isCorrectAbsoluteOrRelativePath =
					expected === /^(?:[A-Za-z]:\\|\/)/.test(data);

				// ! 号为 loader 分隔符，不能用在绝对路径中
				if (isExclamationMarkPresent) {
					callback.errors = [
						errorMessage(
							schema,
							data,
							`The provided value ${JSON.stringify(
								data
							)} contans exclamation mark (!) which is not allowed because it's reserved for loader syntax.`
						)
					];
					passes = false;
				}

				if (!isCorrectAbsoluteOrRelativePath) {
					callback.errors = [getErrorFor(expected, data, schema)];
					passes = false;
				}

				return passes;
			}
			callback.errors = [];

			return callback;
		}
	});
