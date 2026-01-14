
const mat4 = {
    identity: (dst?: Float32Array) => {
        dst ??= new Float32Array(16);
        dst[ 0] = 1; dst[ 1] = 0; dst[ 2] = 0; dst[ 3] = 0;
        dst[ 4] = 0; dst[ 5] = 1; dst[ 6] = 0; dst[ 7] = 0; 
        dst[ 8] = 0; dst[ 9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    },
    multiply: (a: Float32Array, b: Float32Array, dst?: Float32Array) => {
        dst ??= new Float32Array(16);
        dst[ 0] = a[ 0] * b[0] + a[ 1] * b[4] + a[ 2] * b[ 8] + a[ 3] * b[12];
        dst[ 1] = a[ 0] * b[1] + a[ 1] * b[5] + a[ 2] * b[ 9] + a[ 3] * b[13];
        dst[ 2] = a[ 0] * b[2] + a[ 1] * b[6] + a[ 2] * b[10] + a[ 3] * b[14];
        dst[ 3] = a[ 0] * b[3] + a[ 1] * b[7] + a[ 2] * b[11] + a[ 3] * b[15];  

        dst[ 4] = a[ 4] * b[0] + a[ 5] * b[4] + a[ 6] * b[ 8] + a[ 7] * b[12];
        dst[ 5] = a[ 4] * b[1] + a[ 5] * b[5] + a[ 6] * b[ 9] + a[ 7] * b[13];
        dst[ 6] = a[ 4] * b[2] + a[ 5] * b[6] + a[ 6] * b[10] + a[ 7] * b[14];
        dst[ 7] = a[ 4] * b[3] + a[ 5] * b[7] + a[ 6] * b[11] + a[ 7] * b[15];

        dst[ 8] = a[ 8] * b[0] + a[ 9] * b[4] + a[10] * b[ 8] + a[11] * b[12];
        dst[ 9] = a[ 8] * b[1] + a[ 9] * b[5] + a[10] * b[ 9] + a[11] * b[13];
        dst[10] = a[ 8] * b[2] + a[ 9] * b[6] + a[10] * b[10] + a[11] * b[14];
        dst[11] = a[ 8] * b[3] + a[ 9] * b[7] + a[10] * b[11] + a[11] * b[15];

        dst[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[ 8] + a[15] * b[12];
        dst[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[ 9] + a[15] * b[13];
        dst[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
        dst[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

        return dst;
    },
    translation(tx: number, ty: number, tz: number, dst?: Float32Array) {
        dst ??= new Float32Array(16);
        dst[ 0] = 1;   dst[ 1] = 0;   dst[ 2] = 0;   dst[ 3] = 0;
        dst[ 4] = 0;   dst[ 5] = 1;   dst[ 6] = 0;   dst[ 7] = 0;
        dst[ 8] = 0;   dst[ 9] = 0;   dst[10] = 1;   dst[11] = 0;
        dst[12] = tx;  dst[13] = ty;  dst[14] = tz;  dst[15] = 1;
        return dst;
    },
    rotationZ(radians: number, dst?: Float32Array) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        dst = dst || new Float32Array(16);
        dst[ 0] = c;   dst[ 1] = s;  dst[ 2] = 0;  dst[ 3] = 0;
        dst[ 4] = -s;  dst[ 5] = c;  dst[ 6] = 0;  dst[ 7] = 0;
        dst[ 8] = 0;   dst[ 9] = 0;  dst[10] = 1;  dst[11] = 0;
        dst[12] = 0;   dst[13] = 0;  dst[14] = 0;  dst[15] = 1;
        return dst;
    },
    rotationX(radians: number, dst?: Float32Array) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        dst = dst || new Float32Array(16);
        dst[ 0] = 1;  dst[ 1] = 0;   dst[ 2] = 0;  dst[ 3] = 0;
        dst[ 4] = 0;  dst[ 5] = c;   dst[ 6] = s;  dst[ 7] = 0;
        dst[ 8] = 0;  dst[ 9] = -s;  dst[10] = c;  dst[11] = 0;
        dst[12] = 0;  dst[13] = 0;   dst[14] = 0;  dst[15] = 1;
        return dst;
    },
    rotationY(radians: number, dst?: Float32Array) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        dst = dst || new Float32Array(16);
        dst[ 0] = c;  dst[ 1] = 0;  dst[ 2] = -s;  dst[ 3] = 0;
        dst[ 4] = 0;  dst[ 5] = 1;  dst[ 6] = 0;  dst[ 7] = 0;
        dst[ 8] = s;  dst[ 9] = 0;  dst[10] = c;  dst[11] = 0;
        dst[12] = 0;  dst[13] = 0;  dst[14] = 0;  dst[15] = 1;
        return dst;
    },
    scaling(sx: number, sy: number, sz: number, dst?: Float32Array) {
        dst = dst || new Float32Array(16);
        dst[ 0] = sx;  dst[ 1] = 0;   dst[ 2] = 0;    dst[ 3] = 0;
        dst[ 4] = 0;   dst[ 5] = sy;  dst[ 6] = 0;    dst[ 7] = 0;
        dst[ 8] = 0;   dst[ 9] = 0;   dst[10] = sz;   dst[11] = 0;
        dst[12] = 0;   dst[13] = 0;   dst[14] = 0;    dst[15] = 1;
        return dst;
    },
};


export default mat4;
