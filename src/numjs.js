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

	/**
	 * 维度的数量
	 */
	get dimensions() {
		return this.shape.length;
	}

	/**
	 * 所有标量平方和的平方根
	 */
	get hypot() {
		return Math.hypot(...this.data);
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
	 * 用值填充
	 * 
	 * @param {number} value 值
	 */
	fill(value) {
		this.data.fill(value);
	}
	/** 
	 * 根据索引获取视图
	 * 原张量的变化在视图张量中可见，反之亦然
	 * @param {number[]|...number} indexes 索引序列
	 */
	getView(...indexes) {
		if (indexes.length === 0) throw new Error("Invalid arguments");
		let idArr = Array.isArray(indexes[0]) ? indexes[0] : indexes;
		if (idArr.length > this.shape.length) throw new Error("Index array should not longer than shape");

		let idx = idArr.reduce((idx, x, i) => idx + x * this.shapeM[i], 0);
		let tensor = new Tensor();
		tensor.data = this.data.subarray(idx, idx + this.shapeM[idArr.length - 1]);
		tensor.shape = this.shape.slice(idArr.length);
		return tensor;
	}
	/**
	* 计算索引序列对应的扁平化索引
	* @param {number[]|...number} indexes 索引序列
	*/
	flattenIndex(...indexes) {
		if (indexes.length === 0) throw new Error("Invalid arguments");
		const idArr = Array.isArray(indexes[0]) ? indexes[0] : indexes;
		if (idArr.length > this.shape.length) throw new Error("Index array should not longer match shape");
		return idArr.reduce((a, b, i) => a + b * this.shapeM[i], 0);
	}

	/**
	 * 计算扁平化索引对应的索引序列
	 * @param {number} [idx=0] 扁平化索引
	 */
	deflattenIndex(idx = 0) {
		if (idx < 0 || idx > this.data.length) throw new Error("Index out of bounds");
		const idArr = [];
		this.shapeM.forEach((ds, i) => idx -= ds * (idArr[i] = Math.floor(idx / ds)));
		return idArr;
	}

	/** 从坐标idArr开始，递归遍历到更深的维度maxDim为止
	 * @param {(value: number, idxArr: number[]) => void} [callback=(t, idxArr) => {}] 
	 * @param {number} [maxDim=this.dimensions - 1] 最深维度
	 * @param {any[]} [idArr=[]] 起始位置的索引序列
	 */
	forEach(callback = (value, idxArr) => {}, maxDim = this.dimensions - 1, idArr = []) {
		if (maxDim >= this.dimensions) throw new Error("maxDim should less than this.dimensions");
		if (idArr.length === maxDim) {
			const offset = this.flattenIndex(idArr);
			if (maxDim === this.dimensions - 1) {
				for (let i = 0; i < this.shape[maxDim]; i++)
					callback(this.data[offset + i], idArr.concat(i));
			} else {
				const eleSize = this.shapeM[maxDim];
				for (let i = 0; i < this.shape[maxDim]; i++) {
					let eleOffset = offset + i * eleSize;
					let viewerTensor = new Tensor();
					viewerTensor.data = this.data.subarray(eleOffset, eleOffset + eleSize);
					viewerTensor.shape = this.shape.slice(maxDim + 1);
					callback(viewerTensor, idArr.concat(i));
				}
			}
		} else {
			for (let i = 0; i < this.shape[idArr.length]; i++)
				this.forEach(callback, maxDim, idArr.concat(i));
		}
		return this;
	}

	/** 遍历所有标量
	 * @param {(t: number, idxFlat: number, arr: TypedArray) => void} [callback=(t, idxFlat, arr) => {}] 
	 * callback 参数：
	 * 
	 *     t        标量值
	 * 
	 *     idxFlat  在原始数组中的索引
	 * 
	 *     arr      原始数组
	 */
	forEachScalar(callback = (value, idxFlat, arr) => {}) {
		this.data.forEach((value, idxFlat) => callback(value, idxFlat, this.data));
		return this;
	}

	/** 对每一个标量进行映射
	 */
	mapScalar(mapper = x => x) {
		this.data = this.data.map(mapper);
		return this;
	}

	/** 将输入张量分割成相等形状的 chunks（如果可分）。 如果沿指定维的张量形状大小不能被 chunkSize 整除， 则最后一个分块会小于其它分块。
	 * @param {number} chunkSize 分块的大小
	 * @param {number} dim 维度 //TODO
	 * 
	 * @return {Tensor[]} 分块数组
	 */
	splitView(chunkSize = Infinity, dim = 0) {
		let chunks = [];
		let eleSize = this.shapeM[dim];
		for (let offset = 0; offset < this.shape[0]; offset += chunkSize) {
			let chunk = new Tensor();
			chunk.data = this.data.subarray(offset * eleSize, (offset + chunkSize) * eleSize);
			chunk.shape = [~~(chunk.data.length / eleSize)].concat(this.shape.slice(dim + 1));
			chunks.push(chunk);
		}
		return chunks;
	}


	/** 修改本张量的形状
	 * @param {number[]} newShape 新的形状
	 */
	reshape(newShape) {
		if (Tensor.sizeOfShape(newShape) !== this.size)
			throw new Error("New shape size not match");
		this.shape = newShape;
		return this;
	}
	/** 复制出一个新的张量，不共享内存。
	 * @param {TypedArray} [atype=this.atype] 
	 */
	clone(atype = this.atype) {
		const tensor = new Tensor();
		tensor.data = new atype(this.data);
		tensor.shape = this.shape.slice();
		return tensor;
	}

	/**
	 * 复制出一个相同形状的空张
	 * @param {type} [atype=this.atype] 数组类型
	 * @returns {Tensor}
	 */
	cloneShape(atype = this.atype) {
		const tensor = new Tensor();
		tensor.data = new atype(this.size);
		tensor.shape = this.shape.slice();
		return tensor;
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

	/** 对张量中的每个标量执行一元操作
	 * @param {Tensor} tensor 
	 * @param {(x:number)=>number} operator 一元操作
	 * @param {Tensor} [out] 存放结果的张量
	 */
	static _unaryOperateForEach(tensor, operator, out = tensor.cloneShape()) {
		for (let i = 0; i < tensor.data.length; i++)
			out.data[i] = operator(tensor.data[i]);
		return out;
	}
	// 将输入张量每个元素的夹紧到区间 [min, max]
	static clamp(tensor, min, max, out = tensor.cloneShape()) {
		return Tensor._unaryOperateForEach(tensor, x => Math.min(Math.max(x, min), max), out);
	}
	// 按元素取负。 x = − x
	static neg(tensor, out = tensor.cloneShape()) {
		return Tensor._unaryOperateForEach(tensor, x => -x, out);
	}
	// 按元素求倒数。 x = x ? 1 / x : Infinity
	static reciprocal(tensor, out = tensor.cloneShape()) {
		return Tensor._unaryOperateForEach(tensor, x => x ? 1 / x : Infinity, out);
	}
	// 每个元素的sigmoid值
	static sigmoid(tensor, out = tensor.cloneShape()) {
		return Tensor._unaryOperateForEach(tensor, x => Tensor._sigmoid(x), out);
	}
	static _sigmoid(x) {
		return 1 / (1 + Math.exp(-x));
	}

	/** 全 0 张量
	 * @param {number[]} shape 
	 * @param {Float32ArrayConstructor} [atype=Float32Array] 类型
	 * @return {Tensor}
	 */
	static zeros(shape, atype = Float32Array) {
		return this.full(0, shape, atype);
	}
	/** 全 1 张量
	 * @param {number[]} shape 
	 * @param {Float32ArrayConstructor} [atype=Float32Array] 
	 * @return {Tensor}
	 */
	static ones(shape, atype = Float32Array) {
		return this.full(1, shape, atype);
	}
	/**
	 * @return {Tensor}
	 */
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
	 * 
	 * @return {Tensor}
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
	 * @return {Tensor}
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
	 * @return {Tensor}
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
	 * @return {Tensor}
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
	 * @return {Tensor}
	 */
	static arange(start, end, step = 1, atype = Float32Array) {
		var steps = Math.floor(end - start) / step + 1;
		return Tensor.linspace(start, end, steps, atype);
	}

	/** 由数组创建张量
	 * 
	 * arr 可以是 js 数组。
	 * arr 如果是类型化数组，张量将复制一个新的类型化数组。
	 * @return {Tensor}
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
	// 初始化
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

	{
		// 获取基本属性
		let a = Tensor.ofArray([3, 4]);
		assert(isArrayLike(a.shape, [2]));
		assert(a.dimensions === 1);
		assert(a.hypot === 5);
	}
	{
		// getView
		let a = Tensor.ones([3, 4, 5]);
		let b = a.getView(1, 3);
		b.fill(6);
		print(a);
	}
	{
		// flattenIndex, deflattenIndex
		let a = Tensor.ones([3, 4, 5]);
		assert(a.flattenIndex(2, 3, 4) === a.size - 1);
		assert(a.flattenIndex(...a.deflattenIndex(23)) === 23);
	}
	{
		// splitView
		let a = Tensor.randperm(10, [8, 10]);
		let chunks = a.splitView(3);
		assert(chunks[0].shape[0] === 3);
		assert(chunks[1].shape[0] === 3);
		assert(chunks[2].shape[0] === 2);
	}

	{
		// forEach, forEachScalar
		let a = Tensor.ofArray([
			[3, 4, 5, 6, 7],
			[9, 8, 7, 6, 5],
		]);
		a.forEach((x, i) => print(`[${i}] ${x}`));
		a.forEachScalar((x, i) => print(`[${i}] ${x}`));
	}
	{
		// map
		let a = Tensor.randn([32, 32, 32]);
		a.mapScalar(x => x > 0 ? 1 : 0);
		let n = 0;
		a.forEachScalar(x => n += x);
		print(n / a.size);
	}
	{
		// reshape
		let a = Tensor.randn([32, 32, 32]);
		print(a.shape);
		a.reshape([4, 128, 64]);
		print(a.shape);
	}
	{
		// clone, cloneShape
		let a = Tensor.ones([2]);
		let b = a.clone();
		let c = a.cloneShape();
		b.data[0] = 9;
		assert(a.data[0] === 1);
		assert(c.data[0] === 0);
	}
	{
		// _unaryOperateForEach
		let a = Tensor.linspace(1, 60, 60).reshape([3, 4, 5]);
		Tensor._unaryOperateForEach(a, x => x ** 2, a);
		print(a);
		a = a.getView(0).clone();
		Tensor.clamp(a, 0, 100, a);
		Tensor.neg(a, a);
		print(a);
	}

	function isArrayLike(...args) {
		const m = JSON.stringify(args[0]);
		for (i = 1; i < args.length; i++)
			if (m !== JSON.stringify(args[i]))
				return false;
		return true;
	}

	function print(...args) {
		for (let i = 0; i < args.length; i++)
			args[i] += '';
		console.log(...args);
	}

	function assert(...args) {
		for (let arg of args)
			if (!arg)
				throw new Error('Assertion failed');
	}
}


module.exports = {
	Random,
	Tensor,
	test,
};
