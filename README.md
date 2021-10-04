# Numjs

## Usage

```js
// require
var nj = require("./numjs.js");
// 创建矩阵
var a = new nj.Mat([
    [1/15, 1/15, 1/15],
    [1/15, 1/15, 1/15],
    [1/15, 1/15, 1/15],
    [1/15, 1/15, 1/15],
    [1/15, 1/15, 1/15],
]);
// 创建全 1 矩阵
var b = nj.ones(a.shape);
// 数乘矩阵
b.dmul(1 / a.size);
// 打印
console.log('' + a);
console.log('' + b);
```

