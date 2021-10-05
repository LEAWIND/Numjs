var nj = require("./numjs.js");



function mat_new() {
	// a = new nj.Mat(null, [5], 2);
	// print(a);
	// b = new nj.Mat(null, [2, 2], 3)
	// print(b);
	c = new nj.Mat(null, [2, 2, 2, 2], 4);
	print(c);
}

function mat_mul() {
	let a = new nj.Mat([
		[1, 2, 3],
		[4, 5, 6],
	]);
	let b = new nj.Mat([
		[3, 2],
		[1, 0],
		[2, 3],
	]);
	print(a + '\n' + b);
	print('====\n' + a.mul(b));
}

function mat_T() {
	a = new nj.Mat([
		[[1, 2, 3], [1, 2, 3], [4, 5, 6], [1, 2, 9]],
		[[1, 2, 3], [1, 2, 3], [4, 5, 6], [1, 5, 7]],
		[[6, 4, 1], [9, 8, 6], [3, 0, 5], [1, 6, 9]],
		[[3, 3, 5], [8, 7, 6], [3, 4, 5], [3, 2, 5]],
		[[3, 3, 5], [8, 7, 6], [3, 1, 5], [3, 2, 9]],
	]);
	b = a.T;
	print(a, b);
}

function mat_beijiahang() {
	a = new nj.Mat([
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9],
		[5, 6, 3],
	]);
	print(a);
	a._beijiahang(1, 0, 2, 3);
	print(a);
}

function mat_repeat() {
	a = nj.diag([5, 7, 9]);
	print(a);
	a.repeat(6);
	print(a);
	a.dmul(5);
	print(a);
}

//TODO
function mat_merge() {
	a = nj.ones([2, 3]);
	b = nj.zeros([2, 3]);
	c = nj.rands([2, 3]);
	res = nj.merge(a, b, c);
	print(a, b, c);
	print(res);
}

function mat_getARemainder() {
	a = new nj.Mat([
		1, 2, 3, 4, 5, 6, 7
	]);
	print(a);
	ar = a.getARemainder([2]);
	print(ar);

	b = new nj.Mat([
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9],
		[5, 6, 3],
	]);
	print(b);
	br = b.getARemainder([1, 2]);
	print(br);
}

//
function mat_det() {
	a = new nj.Mat([
		[1, 2, 1, 4, 5],
		[6, 7, 8, 9, 6],
		[9, 8, 7, 6, 5],
		[4, 3, 2, -7, 2],
		[3, 4, 5, 6, 7]
	]);// -768
	print(a);
	print(a.D);
}

//
function mat_cof_adj() {
	a = new nj.Mat([
		[1, 2, 1],
		[6, 7, 8],
		[9, 8, 7],
	]);
	print(a);
	print(a.cof);
	print(a.adj);
}

//
function mat_I() {
	a = new nj.Mat([
		[3, 2, 1],
		[1, 1, 6],
		[1, 0, 1],
	]);
	b = a.I;
	c = a.mul(b);
	c.sub(nj.Ident(c.shape[0]));
	c.map((e, ind) => e < 1E-10);
	print(c);
}

//
function conv2d() {
	a = new nj.Mat([
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9],
		[5, 6, 3],
	]);
	k = new nj.Mat([
		[0.25, 0.25],
		[0.25, 0.25],
	]);

	print('mat:' + a);
	print('kernel:' + k);
	r = nj.conv2d(a, k, [1, 1]);
	print('result:' + r);
}



//
function recurse_map() {
	let a = new nj.Mat([
		[1, 2, 3, 4],
		[4, 5, 6, 9],
		[7, 8, 9, 2],
	]);
	print(a);
	nj.recurse_map(a, (x, inds, ...arg) => {
		// return inds[0] +'' + inds[1];
		return x * arg[0];
	}, [], 4);
	print(a);
}

/** 遍历矩阵时 递归和非递归的性能比较
 */
function pf_map() {
	let t0, t1, i;
	const times_1 = 100;
	const times_2 = 100;
	const times_3 = 100;
	const times_4 = 100;
	let m1 = nj.rands([10000]);
	let m2 = nj.rands([1E5, 1]);
	let m3 = nj.rands([1E4, 1E1, 1]);
	let m4 = nj.rands([1E3, 1E2, 1E1, 1]);

	// 热身
	for (i = 0; i < times_1; i++)
		m1.map(x => x);
	for (i = 0; i < times_2; i++)
		m2.map(x => x);
	for (i = 0; i < times_3; i++)
		m3.map(x => x);
	for (i = 0; i < times_4; i++)
		m4.map(x => x);


	// 非递归
	// took: 3629 ms
	let dt0 = timeTest(() => {
		for (i = 0; i < times_1; i++)
			m1.map(x => x);
		for (i = 0; i < times_2; i++)
			m2.map(x => x);
		for (i = 0; i < times_3; i++)
			m3.map(x => x);
		for (i = 0; i < times_4; i++)
			m4.map(x => x);
	});
	print('1.Took:', dt0, 'ms');
	// 递归
	// took: 10336 ms
	let dt1 = timeTest(() => {
		for (i = 0; i < times_1; i++)
			nj.recurse_map(m1, x => x);
		for (i = 0; i < times_2; i++)
			nj.recurse_map(m2, x => x);
		for (i = 0; i < times_3; i++)
			nj.recurse_map(m3, x => x);
		for (i = 0; i < times_4; i++)
			nj.recurse_map(m4, x => x);
	});
	print('2.Took:', dt1, 'ms');

}

//TODO
function layer_customize() {
	a = new nj.Mat([
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9],
		[5, 6, 4],
	]);
	p = [
		new nj.Mat([
			[0.25, 0.25],
			[0.25, 0.25],
		]),
		new nj.Mat([
			[0.1, 0.1],
			[0.1, 0.1],
		]),
	];
	la = new nj.layer_customize("customize layer", {
		inputShape: [4, 3],
		outputShape: [2, 4, 3],
		exec: function(input) {
			return mat_merge(
				nj.conv2d(input, this.param[0], [1, 1, 1]),
				nj.conv2d(input, this.param[1], [1, 1, 1]),
			);
		},
		paramShape: [2, 2],
		paramLen: 2,
		param: p,
	});
	print(a);
	b = la.exec(a);
	print(b);
	print("end");
}

// TODO
function layer_conv2d() {
	// TODO layer_conv2d 测试
	a = new nj.Mat([
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9],
		[5, 6, 3],
	]);
	k = new nj.Mat([
		[0.25, 0.25],
		[0.25, 0.25],
	]);

	la = new nj.Layer("Conv2d", {
		inputShape: a.shape,
		kernel: k,
	});
	lb = new nj.Layer("Conv2d", {
		inputShape: a.shape,
		kernelShape: k.shape,
	});
	print(a);
	print(la.exec(a));
	print(lb.exec(a));

}
//TODO
function layer_conv3d() {
	// a = new nj.Mat([
	// 	[[1, 2, 3], [4, 7, 6], [1, 8, 9]],
	// 	[[1, 1, 9], [5, 7, 8], [1, 8, 7]],
	// 	[[1, 2, 7], [5, 1, 9], [2, 4, 8]],
	// 	[[1, 6, 8], [0, 5, 9], [2, 4, 8]],
	// 	[[1, 6, 3], [4, 5, 4], [7, 8, 9]],
	// ])
	// a = new nj.Mat([
	// 	[[1,2,3], [1,2,3], [4,5,6], [1,2,9]],
	// 	[[1,2,3], [1,2,3], [4,5,6], [1,5,9]],
	// 	[[3,3,5], [8,7,6], [3,4,5], [1,2,9]],
	// 	[[6,4,1], [9,8,6], [3,0,5], [1,6,9]],
	// ])
	a = nj.rands([5, 5, 3]);

	// k = new nj.Mat([
	// 	[[1/12, 1/12, 1/12], [1/12, 1/12, 1/12]],
	// 	[[1/12, 1/12, 1/12], [1/12, 1/12, 1/12]],
	// ])
	k = nj.ones([2, 2, 3]);
	k.dmul(1 / k.size);


	l3 = new nj.Layer("Conv3d", {
		inputShape: a.shape,
		kernel: k,
	});

	c1 = nj.conv3d(a, k, [1, 1, 1]);
	c2 = l3.exec(a);
	print(a, k);
	print(c1, c2);
}

function layer_conv() {
	// a = nj.ones([32, 32]);
	la = new nj.layer_customize();
}


function main() {
	print("## Test START #21#");

	// mat_new();
	// mat_mul();
	// mat_T();
	// mat_beijiahang();
	// mat_repeat();
	// mat_merge();

	// mat_getARemainder();
	// mat_det(); 
	// mat_cof_adj();
	// mat_I();

	layer_customize();

	// recurse_map();
	// pf_map();
	// layer_conv();
}
let mainTime = timeTest(main);
console.log("Main() took", mainTime, 'ms');




function print(...arg) {
	for (let i = 0; i < arg.length; i++)
		arg[i] += '';
	console.log(...arg);
}
function timeTest(func, ...arg) {
	let t0 = new Date() * 1;
	// try{
	func(...arg);
	// }catch(e){
	// 	console.log(`ERROR: ${e}`);
	// }
	return new Date() * 1 - t0;
}
