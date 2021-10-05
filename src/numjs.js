class Random {
	seed;
	mean;
	stdDev;
	/**
	 * @param {number} [seed=Date.now()] 种子
	 * @param {number} [mean=0] 用于正态分布的默认均值
	 * @param {number} [stdDev=1] 用于正态分布的默认标准差
	 */
	constructor(seed = Date.now(), mean = 0, stdDev = 1) {
		if (typeof seed !== "number") throw new TypeError(`Expected number, got ${typeof seed}`);
		if (typeof mean !== "number") throw new TypeError(`Expected number, got ${typeof mean}`);
		if (typeof stdDev !== "number") throw new TypeError(`Expected number, got ${typeof stdDev}`);
		this.seed = seed;
		this.mean = mean;
		this.stdDev = stdDev;
	}

	/**
	 * 获取一个均匀分布随机数
	 */
	next() {
		const a = 9301, b = 49297, m = 233280;
		this.seed = (this.seed * a + b) % m;
		return this.seed / m;
	}

	/**
	 * 获取一个正态分布的随机数
	 */
	nextNormal(mean = this.mean, stdDev = this.stdDev) {
		var u = 1 - this.next(); // 生成一个0到1之间的随机数，用于保证u不为0
		var v = 1 - this.next(); // 生成一个0到1之间的随机数，用于保证v不为0
		var z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
		return z * stdDev + mean; // 将z转换为具有给定均值和标准差的正态分布随机数
	}

	/**
	 * 获取若干均匀分布的随机数
	 * @param {number} count 数量
	 */
	some(count) {
		let arr = [];
		for (let i = 0; i < count; i++)
			arr[i] = this.next();
		return arr;
	}
	/**
	 * 获取若干正态分布的随机数
	 * @param {number} count 数量
	 */
	someNormal(count) {
		let arr = [];
		for (let i = 0; i < count; i++)
			arr[i] = this.nextNormal();
		return arr;
	}
}

/**
 * 张量
 * 
 * 实现了任意维度的张量操作
 */
class Tensor {
	data;	// TypedArray
	#shape;	// number[]
	/**
	 * 张量的形状
	 * 
	 * number[]
	 */
	get shape() {
		return this.#shape;
	}
	set shape(s) {
		this.#shape = s;
		this.#shapeM = null;
	}

	/** 各维度的总大小
	 * 
	 * 例如:
	 * shape  = [  2,   1,   6,  9,  3]
	 * shapeM = [162, 162,  27,  3,  1]
	 */
	#shapeM;
	get shapeM() {
		if (!this.#shapeM) {
			this.#shapeM = [];
			this.#shapeM[this.shape.length - 1] = 1;
			for (let i = this.shape.length - 1; i > 0; i--)
				this.#shapeM[i - 1] = this.#shapeM[i] * this.shape[i];
		}
		return this.#shapeM;
	}
	set shapeM(s) {
		throw new Error("Tensor#shapeM is read only");
	}

	/** 类型化数组的类型
	 */
	get atype() {
		return this.data.constructor;
	}

	/**
	 * 张量中的标量总数
	 */
	get size() {
		return this.shape[0] * this.shapeM[0];
	}

	/** 由类型化数组创建一个一维张量
	 * @param {TypedArray} arr 
	 */
	constructor(arr) {
		if (Tensor.isTypedArrayInstance(arr)) {
			this.data = arr;
			this.shape = [arr.length];
		} else if (arr !== undefined) {
			throw new Error("Invalid argument type for Tensor constructor");
		}
	}
	/**
	 * 转换成字符串
	 */
	toString(indentStr = '\t') {
		return `Tensor:${this.atype.name}(${this.shape.join("*")}=${this.size})\n` + this._toStringRecursive(0, 0, indentStr);
	}

	/** 递归生成字符串
	 * @param {number} [idx=0] 索引
	 * @param {number} [dim=0] 维度
	 * @param {string} [indentStr='\t'] 缩进字符串
	 */
	_toStringRecursive(idx = 0, dim = 0, indentStr = '\t') {
		const dimLen = this.shape[dim];	// 当前维度的尺度 (此维度的元素数量)
		const eleSize = this.shapeM[dim];	// 此维度的元素的标量数量
		if (dim === this.shape.length - 1) {
			return "[" + this.data.slice(idx, idx + dimLen * eleSize).join(", ") + "]";
		} else {
			let s = '';
			for (let i = 0; i < dimLen; i++)
				s += this._toStringRecursive(idx + i * eleSize, dim + 1, indentStr) + ",\n";
			return "[\n" + s.replace(/^|(?<=\n)(?=.)/g, indentStr) + "]";
		}
	}

	/** 计算js数组的维度
	 */
	static shapeOfArray(arr) {
		if (!Array.isArray(arr))
			throw new Error("Input data must be an array");
		const shape = [];
		let curr = arr;
		while (Array.isArray(curr)) {
			shape.push(curr.length);
			curr = curr[0];
		}
		return shape;
	}

	/** 计算shape对应的标量数量，即各维长度相乘
	 * @param {number[]} shape 
	 */
	static sizeOfShape(shape) {
		return shape.reduce((x, y) => x * y);
	}


	/** 判断是否是 TypedArray 的实例
	 */
	static isTypedArrayInstance(arr) {
		const TypedArrayConstructors = [
			Int8Array,
			Uint8Array,
			Uint8ClampedArray,
			Int16Array,
			Uint16Array,
			Int32Array,
			Uint32Array,
			Float32Array,
			Float64Array,
		];
		return TypedArrayConstructors.some(T => arr instanceof T);
	}

	/** 是否为数组或类型化数组
	 */
	static isArrayLike(arr) {
		return Array.isArray(arr) || Tensor.isTypedArrayInstance(arr);
	}


	/** 生成正态分布随机数
	 */
	static _generateNormalDistribution(mean = 0, stdDev = 1, rand = new Random()) {
		var u = 1 - rand.next(); // 生成一个0到1之间的随机数，用于保证u不为0
		var v = 1 - rand.next(); // 生成一个0到1之间的随机数，用于保证v不为0
		var z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
		return z * stdDev + mean; // 将z转换为具有给定均值和标准差的正态分布随机数
	}


	/** 全 0 张量
	 * @param {number[]} shape 
	 * @param {Float32ArrayConstructor} [atype=Float32Array] 类型
	 */
	static zeros(shape, atype = Float32Array) {
		return this.full(0, shape, atype);
	}
	/** 全 1 张量
	 * @param {number[]} shape 
	 * @param {Float32ArrayConstructor} [atype=Float32Array] 
	 */
	static ones(shape, atype = Float32Array) {
		return this.full(1, shape, atype);
	}
	static full(fillValue, shape, atype = Float32Array) {
		if (!Tensor.isArrayLike(shape)) throw new Error("Argument shape should be array like");
		const tensor = new Tensor();
		tensor.data = new atype(shape.reduce((a, b) => a * b));
		tensor.data.fill(fillValue);
		tensor.shape = shape;
		return tensor;
	}

	/** 返回一个张量，包含了从区间[0,1)的均匀分布中抽取的一组随机数
	 * @param {number[]} shape 
	 * @param {Random} rand 随机数生成器，要求实现 next() 方法
	 * @param {Float32ArrayConstructor} atype 数组类型
	 */
	static rand(shape, rand = new Random(), atype = Float32Array) {
		if (!Tensor.isArrayLike(shape)) throw new Error("Argument shape should be array like");
		const tensor = new Tensor();
		tensor.data = new atype(shape.reduce((a, b) => a * b)).map(x =>
			rand.next()
		);

		tensor.shape = shape;
		return tensor;
	}

	/** 返回一个张量，包含了从标准正态分布(均值为0，方差为 1，即高斯白噪声)中抽取一组随机数
	 */
	static randn(shape, rand = new Random(), atype = Float32Array) {
		if (!Tensor.isArrayLike(shape)) throw new Error("Argument shape should be array like");
		const tensor = new Tensor();
		tensor.data = new atype(shape.reduce((a, b) => a * b)).map(x =>
			Tensor._generateNormalDistribution(0, 1, rand)
		);
		tensor.shape = shape;
		return tensor;
	}
	/** 给定参数n，返回一个从0 到n -1 的随机整数排列。
	 */
	static randperm(n, shape, atype = Float32Array) {
		if (!Tensor.isArrayLike(shape)) throw new Error("Argument shape should be array like");
		const tensor = new Tensor();
		tensor.data = new atype(shape.reduce((a, b) => a * b)).map(x =>
			Math.floor(Math.random() * n)
		);
		tensor.shape = shape;
		return tensor;
	}

	/** 返回一个1维张量，包含在区间 [start, end] 上均匀间隔的 steps 个点，其中包括两端。输出1维张量的长度为steps。
	 * @param {number} start 
	 * @param {number} end 
	 * @param {number} [steps=100] 
	 * 
	 */
	static linspace(start, end, steps = 100, atype = Float32Array) {
		const tensor = new Tensor();
		tensor.data = new atype(steps);

		tensor.shape = [steps];
		const step = (end - start) / (steps - 1);
		for (let i = 0, d = start; i < steps; i++, d += step)
			tensor.data[i] = d;
		return tensor;
	}
	/** 返回一个1维张量，长度为 floor((end−start)/step)。
	 * 包含从start到end，以step为步长的一组序列值(默认步长为1)。
	 */
	static arange(start, end, step = 1, atype = Float32Array) {
		var steps = Math.floor(end - start) / step + 1;
		return Tensor.linspace(start, end, steps, atype);
	}

	/** 由数组创建张量
	 * 
	 * arr 可以是 js 数组。
	 * arr 如果是类型化数组，张量将复制一个新的类型化数组。
	 */
	static ofArray(arr, shape = null, atype = Float32Array) {
		const tensor = new Tensor();
		if (Array.isArray(arr)) {
			if (!Array.isArray(shape))
				shape = Tensor.shapeOfArray(arr);
			const flattenArr = arr.flat(Infinity);
			if (flattenArr.length !== Tensor.sizeOfShape(shape))
				throw new Error("Array shape should match the shape size", arr, shape);
			tensor.data = new atype(flattenArr);
		} else if (Tensor.isTypedArrayInstance(arr)) {
			if (!Array.isArray(shape))
				shape = Tensor.shapeOfArray(arr);
			tensor.data = new atype(arr);
		} else {
			throw new Error("First argument arr should be Array or TypedArray");
		}
		tensor.shape = shape;
		return tensor;
	}
}

function test() {
	print(Tensor.zeros([3, 5]));
	print(Tensor.ones([5, 3]));
	print(Tensor.rand([3, 3]));
	print(Tensor.randn([3, 3]));
	print(Tensor.randperm(10, [3, 3]));

	print(Tensor.linspace(-1, 1, steps = 17));
	print(Tensor.arange(-1, 1, step = 0.125));

	print(Tensor.ofArray([
		[1, 2, 3],
		[8, 7, 6],
		[7, 4, 0],
		[1, 1, 1],
	]));


	function print(...arg) {
		for (let i = 0; i < arg.length; i++)
			arg[i] += '';
		console.log(...arg);
	}
}


module.exports = {
	Random,
	Tensor,
	test,
};
