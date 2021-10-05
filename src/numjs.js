class Matrix {
	d = [];
	#shape = [];
	#dim;
	#size = 1;

	/**
	 * 当 arr 为数组时，将根据 arr 生成矩阵
	 * @param {array} arr     数据源数组, 可设置为null
	 * 否则 生成形状为 shape 的矩阵，每个元素的值都是 value
	 * @param {number[]} shape   表示各维度尺度的数组
	 * @param {number} value  所有元素初始化为某个固定值
	 */
	constructor(arr = null, shape = null, value = 0) {
		if (Array.isArray(arr)) {
			// 从第一项深入，计算 维度dim 和 形状shape
			var iter = arr;
			for (
				this.#dim = 0;
				Array.isArray(iter);
				this.#dim++, iter = iter[0]
			)
				this.#shape[this.#dim] = iter.length;
			this.d = JSON.parse(JSON.stringify(arr)); // 深拷贝

			// 确保形状正确 (还是不要了，节省点时间)
			// if(!Matrix.checkShape(this.d, this.#shape)) throw "Shape Uncorrect!";
		} else if (shape) {
			this.#shape = Array.from(shape);
			this.#dim = shape.length;
			if (this.#dim === 2) {
				this.d = new Array(shape[0]);
				for (let i = 0; i < shape[0]; i++)
					this.d[i] = new Array(shape[1]).fill(value);
			} else if (this.#dim === 1) {
				this.d = new Array(shape[0]).fill(value);
			} else if (this.#dim === 3) {
				for (let i = 0; i < shape[0]; i++)
					for (let j = (this.d.push([]), 0); j < shape[1]; j++)
						this.d[i].push(new Array(shape[2]).fill(value));
			} else if (this.#dim === 4) {
				for (let i = 0; i < shape[0]; i++)
					for (let j = (this.d.push([]), 0); j < shape[1]; j++)
						for (let k = (this.d[i].push([]), 0); k < shape[2]; k++)
							for (
								let l = (this.d[i][j].push([]), 0);
								l < shape[3];
								l++
							)
								this.d[i][j][k].push(value);
			} else {
				// 任意维度的张量初始化 new Array(len)   array.fill(value)
				throw "Shape must be less than 5";
			}
		} else {
			throw new Error("Matrix constructor: Parameter Error!");
		}

		// 计算 size
		for (let i of this.#shape) this.#size *= i;
	}
	toString(info = true) {
		let t = info
			? `<class Matrix size=${this.size}, shape=${this.#shape.join("*")}>`
			: "";
		switch (this.dim) {
			default:
				t += JSON.stringify(this.d, 0, 4)
					.replace(/(?<=\d,)\s+/g, " ")
					.replace(/(?<=\[)\s+(?=\d)/g, "")
					.replace(/(?<=\d)\s+(?=\])/g, "");
				break;
			case 2:
				t += "[";
				for (let i = 0; i < this.shape[0]; i++) {
					t += "\n\t";
					for (let j = 0; j < this.shape[1]; j++)
						t += `${this.d[i][j]}, `;
				}
				t += "\n]";
				break;
			case 1:
				t += "[\n\t";
				t += this.d.join(", ");
				t += "\n]";
				break;
		}
		return t;
	}

	/** 用函数遍历自身的每一个元素
	 * @param {function} filter  针对每一个元素应用的函数
	 * @param {any} ...arg       传递给 filter 的参数
	 *
	 * @return {object}     返回自身
	 *
	 * filter 的参数:
	 *  	@param {number} 0           元素的值
	 *  	@param {number[]} ind   元素的下标列表
	 *  	@param {any} ...arg         map的arg参数，需要自定义
	 *
	 *  	@return {number}      元素被修改后的值
	 */
	map(filter, ...arg) {
		if (this.#dim === 2) {
			for (let i = 0; i < this.#shape[0]; i++)
				for (let j = 0; j < this.#shape[1]; j++)
					this.d[i][j] = filter(this.d[i][j], [i, j], ...arg);
		} else if (this.#dim === 1) {
			for (let i = 0; i < this.#shape[0]; i++)
				this.d[i] = filter(this.d[i], [i]);
		} else if (this.#dim === 3) {
			for (let i = 0; i < this.#shape[0]; i++)
				for (let j = 0; j < this.#shape[1]; j++)
					for (let k = 0; k < this.#shape[2]; k++)
						this.d[i][j][k] = filter(
							this.d[i][j][k],
							[i, j, k],
							...arg
						);
		} else if (this.#dim === 4) {
			for (let i = 0; i < this.#shape[0]; i++)
				for (let j = 0; j < this.#shape[1]; j++)
					for (let k = 0; k < this.#shape[2]; k++)
						for (let l = 0; l < this.#shape[3]; l++)
							this.d[i][j][k][l] = filter(
								this.d[i][j][k][l],
								[i, j, k, l],
								...arg
							);
		} else {
			recurse_map(this.d, filter, [], ...arg);
		}
		return this;
	}

	/**
	 * 对各项取绝对值
	 */
	toAbs() {
		this.map(Math.abs);
	}

	/**
	 * 各项加法
	 */
	dadd(n) {
		this.map((x) => x + n);
		return this;
	}

	/** 数乘矩阵
	 *    或
	 * 矩阵对应元素相乘
	 */
	dmul(n) {
		if (typeof n === "number") {
			this.map((x) => n * x);
		} else if (typeof n === "object" && n.type == "Matrix") {
			this.map((x, ind) => x * n.getItemByIndList(ind));
		}
		return this;
	}
	/** 矩阵加法
	 */
	add(m) {
		this.map((x, ind) => x + m.getItemByIndList(ind));
	}
	/** 矩阵减法
	 */
	sub(m) {
		this.map((x, ind) => x - m.getItemByIndList(ind));
	}
	/** 矩阵乘法
	 */
	mul(m) {
		switch (this.dim) {
			case 1:
				break;
			case 2:
				let n = this.shape[1];
				let r = new Matrix(false, [this.shape[0], m.shape[1]], 0);

				for (let x = 0; x < this.shape[0]; x++)
					for (let y = 0; y < m.shape[1]; y++)
						for (let i = 0; i < n; i++)
							r.d[x][y] += this.d[x][i] * m.d[i][y];
				return r;
				break;
			case 3:
				throw new Error("Matrix.mul: dim too big");
				break;
		}
	}

	/** 倍加行/列
	 * @param {number} hl 0代表行，1代表列
	 * @param {number} la
	 * @param {number} lb
	 * @param {number} times
	 * 把 la 乘以 times 加到 lb 去
	 */
	_beijiahang(hl, la, lb, times) {
		if (this.#dim != 2) throw new Error("倍加行/列只可用于二维矩阵");
		if (!hl) {
			// 行
			for (let i = 0; i < this.shape[1]; i++)
				this.d[lb][i] += this.d[la][i] * times;
		} else {
			// 列
			for (let i = 0; i < this.shape[0]; i++)
				this.d[i][lb] += this.d[i][la] * times;
		}
	}

	/** 重复
	 * 会添加一个维度
	 * @param {number} n	重复次数
	 */
	repeat(n) {
		this.#dim++;
		this.#shape.unshift(n);
		this.#size *= n;
		let d = JSON.stringify(this.d);
		this.d = [];
		for (let i = 0; i < n; i++) this.d.push(JSON.parse(d));
		return this;
	}

	/*===================
	 * 以下方法不改变自身
	===================*/

	//返回类型名
	get type() {
		return "Matrix";
	}

	// 矩阵维度
	get dim() {
		return this.#dim;
	}
	// 矩阵形状
	get shape() {
		return this.#shape;
	}
	// 总元素个数
	get size() {
		return this.#size;
	}
	/** 按照索引列表读取某个元素
	 * 例如 ind=[1,2,3] 代表索引为 [1][2][3]
	 * 索引可以为负值
	 */
	getItemByIndList(ind) {
		let v = this.d;
		for (let i = 0; i < this.dim; i++) v = v[ind[i] % this.#shape[i]];
		return v;
	}

	// 复制一份
	get copy() {
		return new Matrix(this.d);
	}
	// 对各项取绝对值，返回新矩阵
	get abs() {
		return new Matrix(this.d).map(Math.abs);
	}
	// 转置后的矩阵
	get T() {
		if (this.#dim === 2) {
			let d = [];
			for (let i = 0; i < this.#shape[1]; i++)
				for (let j = ((d[i] = []), 0); j < this.#shape[0]; j++)
					d[i][j] = this.d[j][i];
			return new Matrix(d);
		} else if (this.#dim === 3) {
			let mat = new Matrix(null, [
				this.#shape[1],
				this.#shape[2],
				this.shape[0],
			]);
			for (let i = 0; i < this.#shape[0]; i++)
				for (let j = 0; j < this.#shape[1]; j++)
					for (let k = 0; k < this.#shape[2]; k++) {
						mat.d[j][k][i] = this.d[i][j][k];
					}
			return mat;
		} else {
			throw new Error("Matrix.T: matrix dim too big!");
		}
	}

	// 各元素之和
	get sum() {
		let s = 0;
		this.map((x) => (s += x));
		return s;
	}

	/**
	 * 余子式(矩阵)
	 * @param {number[]} ind 索引列表
	 * @return {Matrix} 余子式(矩阵)
	 */
	getARemainder(ind) {
		let aShape = Array.from(this.#shape);
		for (let i = 0; i < aShape.length; i++) aShape[i]--;
		let A = new Matrix(null, aShape);
		switch (this.#dim) {
			case 1:
				for (let i = 0; i < aShape[0]; i++)
					A.d[i] = this.d[i + (i >= ind[0])];
				break;
			case 2:
				for (let i = 0; i < aShape[0]; i++)
					for (let j = 0; j < aShape[1]; j++)
						A.d[i][j] =
							this.d[i + (i >= ind[0])][j + (j >= ind[1])];
				break;
			case 3:
				for (let i = 0; i < aShape[0]; i++)
					for (let j = 0; j < aShape[1]; j++)
						for (let k = 0; k < aShape[2]; k++)
							A.d[i][j][k] =
								this.d[i + (i >= ind[0])][j + (j >= ind[1])][
								k + (k >= ind[2])
								];
				break;
			case 4:
				throw new Error("getARemainder: dim too big");
		}
		return A;
	}

	// 代数余子式矩阵
	get cof() {
		if (this.#dim !== 2) throw new Error("cof: Dim of Matrix must be 2!");
		let mat = new Matrix(null, this.#shape);
		for (let i = 0; i < this.#shape[0]; i++)
			for (let j = 0; j < this.#shape[1]; j++)
				mat.d[i][j] =
					this.getARemainder([i, j]).D * Math.pow(-1, i + j);
		return mat;
	}
	// 伴随矩阵
	get adj() {
		return this.cof.T;
	}

	// 判断是否可逆
	get canInvert() {
		let a = this.#shape[0];
		for (let i of this.#shape) if (i !== a) return false;
		return this.D !== 0;
	}

	/** 行列式
	 */
	get D() {
		return detOf(this);
	}

	/** 矩阵的逆
	 *
	 */
	get I() {
		if (this.#dim !== 2)
			throw new Error("Method I only support 2-dim matrix!");
		if (!this.canInvert) throw new Error("This Matrix cannot be inverted!");
		return this.adj.dmul(1 / this.D);
	}
}

/** 递归遍历 适用于任意维度的矩阵或数组，但性能略差
 * @param {Matrix|array[]} mat	被遍历的矩阵或数组
 * @param {function} filter	遍历用的函数
 * @param {number[]} indList	递归到这时的索引列表
 * @param {...any} arg	将传递给 filter 的参数
 */
function recurse_map(mat, filter, indList = [], ...arg) {
	if (mat instanceof Matrix) mat = mat.d;
	if (!Array.isArray(indList)) indList = [];
	if (Array.isArray(mat)) {
		if (Array.isArray(mat[0])) {
			let inds = Array.from(indList);
			inds.push(0);
			for (let i = 0; i < mat.length; i++) {
				inds[inds.length - 1] = i;
				recurse_map(mat[i], filter, inds, ...arg);
			}
		} else {
			let inds = Array.from(indList);
			inds.push(0);
			for (let i = 0; i < mat.length; i++) {
				inds[inds.length - 1] = i;
				mat[i] = filter(mat[i], inds, ...arg);
			}
		}
	}
}

/** 求矩阵某项的余子式
 * @param {Matrix|array[]} mat	矩阵
 * @param {number[]} ind	索引列表
 * @return {Matrix} 矩阵, 各维大小比输入矩阵对应维度小 1
 */
function aRemainderOf(mat, ind) {
	return mat instanceof Matrix
		? mat.getARemainder(ind)
		: new Matrix(mat).getARemainder(ind);
}

/** 求矩阵行列式
 * @param {Matrix|number[][]} mat 矩阵或数组
 * @return {number} 行列式的值
 */
function detOf(mat) {
	if (mat.dim !== 2) throw new Error("detOf: Dim of Matrix must be 2!");
	if (mat instanceof Matrix) mat = mat.d;
	switch (mat.length) {
		case 0:
			return 0;
		case 1:
			return mat[0];
		case 2:
			return mat[0][0] * mat[1][1] - mat[1][0] * mat[0][1];
	}
	let D = 0;
	for (let i = 0; i < mat.length; i++)
		D += detOf(aRemainderOf(mat, [0, i])) * (i % 2 ? -1 : 1) * mat[0][i];
	return D;
}

// TODO 判断一个数组是否符合给定的形状，例如 [1,[2,3]], (2) 是不符合的(利用递归)
function checkShape(iter, shape) {
	return true;
}

/** 生成全 0 矩阵
 * @param {number[]} shape 矩阵形状
 * @returns {matrix} 全 0 矩阵
 */
function zeros(shape) {
	return new Matrix(false, shape, 0);
}
/** 生成全 1 矩阵
 * @param {number[]} shape 矩阵形状
 * @returns {matrix} 全 1 矩阵
 */
function ones(shape) {
	return new Matrix(false, shape, 1);
}

/** 生成全 随机 矩阵
 * @param {number[]} shape 矩阵形状
 * @returns {matrix} 随机值矩阵
 */
function rands(shape) {
	return new Matrix(false, shape, 0).map(Math.random);
}

/** 生成 单位矩阵
 * @param {number[]}	n 边长0
 * @param {number}	dim	矩阵维度
 * @returns {matrix} 单位矩阵
 */
function Ident(n = 2, dim = 2) {
	let li = [];
	while (n--) li.push(1);
	return diag(li, dim);
}

/** 生成对角矩阵
 * @param {number[]} li 对角元列表
 * @param {number} dim 矩阵维度
 * @return {Matrix} 对角矩阵
 */
function diag(li, dim = 2) {
	let n = li.length,
		m;
	if (dim === 2) {
		m = new Matrix(false, [n, n], 0);
		for (let i = 0; i < n; i++) m.d[i][i] = li[[i]];
	} else if (dim === 3) {
		m = new Matrix(false, [n, n, n], 0);
		for (let i = 0; i < n; i++) m.d[i][i][i] = li[i];
	} else if (dim === 4) {
		m = new Matrix(false, [n, n, n, n], 0);
		for (let i = 0; i < n; i++) m.d[i][i][i][i] = li[i];
	} else {
		throw new Error("diag: dim too big");
	}
	return m;
}

/** TODO
 * 合并
 */
function merge(...mats) {
	for (let i = mats.length - 1; i >= 0; i--) mats[i] = mats[i].d;
	return new Matrix(mats);
}

/** 二维卷积
 * @param {Matrix} kernel   卷积核
 * @param {Matrix} mat      被卷积的矩阵
 * @step  {(number*)array}  步长数组, 在每个维度的步长
 */
function conv2d(mat, kernel, step = [1, 1]) {
	let d = [];
	for (let i = 0; i + kernel.shape[0] <= mat.shape[0]; i += step[0]) {
		d.push([]);
		for (let j = 0; j + kernel.shape[1] <= mat.shape[1]; j += step[1]) {
			let s = 0;
			for (let x = 0; x < kernel.shape[0]; x++)
				for (let y = 0; y < kernel.shape[1]; y++)
					s += kernel.d[x][y] * mat.d[i + x][j + y];
			d[d.length - 1].push(s);
		}
	}
	return new Matrix(d);
}

/** 三维卷积
 * @param {Matrix} kernel   卷积核
 * @param {Matrix} mat      被卷积的矩阵
 * @step  {(number*)array}  步长数组, 在每个维度的步长
 * @return {Matrix}     卷积结果矩阵
 */
function conv3d(mat, kernel, step = [1, 1, 1]) {
	let d = [];
	for (let i = 0; i + kernel.shape[0] <= mat.shape[0]; i += step[0]) {
		d.push([]);
		for (let j = 0; j + kernel.shape[1] <= mat.shape[1]; j += step[1]) {
			d[d.length - 1].push([]);
			for (let k = 0; k + kernel.shape[2] <= mat.shape[2]; k += step[2]) {
				let s = 0;
				for (let x = 0; x < kernel.shape[0]; x++)
					for (let y = 0; y < kernel.shape[1]; y++)
						for (let z = 0; z < kernel.shape[2]; z++) {
							s += kernel.d[x][y][z] * mat.d[i + x][j + y][k + z];
						}
				d[d.length - 1][d[d.length - 1].length - 1].push(s);
			}
		}
	}
	return new Matrix(d);
}

/** 卷积
 * @param {Matrix} mat 被卷积的家伙
 * @param {Matrix} kernel 卷积核
 * @step {number[]} 步长
 */
function convolution(mat, kernel, step) {
	if ((mat.dim *= kernel.dim))
		throw new Error("Conv: Matrix and kernel must have same dim!");
	switch (mat.dim) {
		case 2:
			return conv2d(mat, kernel, step);
		case 3:
			return conv3d(mat, kernel, step);
	}
	// 任意维函数的卷积
	throw new Error(`convolution: Dim of the matrix is too big! (${mat.dim})`);
}

/** //TODO class abstract Layer
 */
class Layer {
	typeName = null;
	layerName = "unnamed";
	inputShape = null;
	outputShape = null;
	param = null;

	constructor(layerName, opt) {}
	/**
	 * @param {Matrix} input
	 * @return {Matrix} output
	 */
	exec(input) {}
	toText() {
		let obj = {
			type: "Layer",
			layerName: this.layerName,
			typeName: this.typeName,
			param: this.param.d,
		};
		return JSON.stringify(obj);
	}
}

// TODO
class layer_customize extends Layer {
	typeName = "Customize";
	constructor(layerName, opt) {
		super();
		this.layerName = layerName;
		this.inputShape = opt.inputShape;
		this.outputShape = opt.outputShape;
		this.exec = opt.exec.bind(this);
		// a = "0123456789abcdef"
		// a[10] == 'a'
		this.param = new Matrix(null, opt.paramShape);
		if ("param" in opt) this.param = opt.param;
		else this.param = new Matrix(null, opt);
	}
}

class LayerGroup {
	layers = [];
	inputShape = null;
	outputShape = null;
}

/**
 * //TODO class: Net
 * @param {Layer[]} layerList 层列表
 */
class Net {
	layers;
	constructor(layerList) {}
	// 从文本解析
	parse(text) {}
	// 保存为文本
	toText() {}
}

module.exports = {
	Mat: Matrix,
	recurse_map: recurse_map,
	detOf: detOf,
	checkShape: checkShape,
	zeros: zeros,
	ones: ones,
	rands: rands,
	Ident: Ident,
	diag: diag,
	merge: merge,
	conv2d: conv2d,
	conv3d: conv3d,
	conv: convolution,

	layer_customize: layer_customize,
	LayerGroup: LayerGroup,
	Net: Net,
};
