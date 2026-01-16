
const mat4 = {
    // left < 0, right > 0, bottom < 0, top > 0, near > 0, far > 0
    ortho: (left: number, right: number, bottom: number, top: number, near: number, far: number, dst?: Float32Array) => {
        dst ??= new Float32Array(16);
        const w = right - left;
        const h = top - bottom;
        const d = far - near;
        dst[0] = 2 / w; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = 2 / h; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1 / (d); dst[11] = 0;
        dst[12] = -(right + left) / w; dst[13] = -(top + bottom) / h; dst[14] = -near / (d); dst[15] = 1;
        return dst;
    },
    perspective: (fov: number, aspect: number, near: number, far: number, dst?: Float32Array) => {
        dst ??= new Float32Array(16);
        const f = Math.tan(fov * 0.5);
        const rangeInv = 1.0 / (far - near);
        dst[0] = 1 / (f * aspect);  dst[1] = 0;                 dst[2] = 0;                         dst[3] = 0;
        dst[4] = 0;                 dst[5] = 1 / f;             dst[6] = 0;                         dst[7] = 0;
        dst[8] = 0;                 dst[9] = 0;                 dst[10] = far * rangeInv;           dst[11] = 1;
        dst[12] = 0;                dst[13] = 0;                dst[14] = -near * far * rangeInv;   dst[15] = 0;
        return dst;
    },
    identity: (dst?: Float32Array) => {
        dst ??= new Float32Array(16);
        dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    },
    multiply: (a: Float32Array, b: Float32Array, dst?: Float32Array) => {
        dst ??= new Float32Array(16);
        const a00 = a[0];
        const a10 = a[1];
        const a20 = a[2];
        const a30 = a[3];
        const a01 = a[4];
        const a11 = a[5];
        const a21 = a[6];
        const a31 = a[7];
        const a02 = a[8];
        const a12 = a[9];
        const a22 = a[10];
        const a32 = a[11];
        const a03 = a[12];
        const a13 = a[13];
        const a23 = a[14];
        const a33 = a[15];

        const b00 = b[0];
        const b10 = b[1];
        const b20 = b[2];
        const b30 = b[3];
        const b01 = b[4];
        const b11 = b[5];
        const b21 = b[6];
        const b31 = b[7];
        const b02 = b[8];
        const b12 = b[9];
        const b22 = b[10];
        const b32 = b[11];
        const b03 = b[12];
        const b13 = b[13];
        const b23 = b[14];
        const b33 = b[15];

        dst[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        dst[1] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
        dst[2] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
        dst[3] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;

        dst[4] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        dst[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
        dst[6] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
        dst[7] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;

        dst[8] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        dst[9] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
        dst[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
        dst[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;

        dst[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        dst[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
        dst[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
        dst[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

        return dst;
    },
    translation(tx: number, ty: number, tz: number, dst?: Float32Array) {
        dst ??= new Float32Array(16);
        dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = tx; dst[13] = ty; dst[14] = tz; dst[15] = 1;
        return dst;
    },
    rotationZ(radians: number, dst?: Float32Array) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        dst = dst || new Float32Array(16);
        dst[0] = c; dst[1] = s; dst[2] = 0; dst[3] = 0;
        dst[4] = -s; dst[5] = c; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    },
    rotationX(radians: number, dst?: Float32Array) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        dst = dst || new Float32Array(16);
        dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = c; dst[6] = s; dst[7] = 0;
        dst[8] = 0; dst[9] = -s; dst[10] = c; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    },
    rotationY(radians: number, dst?: Float32Array) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        dst = dst || new Float32Array(16);
        dst[0] = c; dst[1] = 0; dst[2] = -s; dst[3] = 0;
        dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
        dst[8] = s; dst[9] = 0; dst[10] = c; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    },
    scaling(sx: number, sy: number, sz: number, dst?: Float32Array) {
        dst = dst || new Float32Array(16);
        dst[0] = sx; dst[1] = 0; dst[2] = 0; dst[3] = 0;
        dst[4] = 0; dst[5] = sy; dst[6] = 0; dst[7] = 0;
        dst[8] = 0; dst[9] = 0; dst[10] = sz; dst[11] = 0;
        dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
        return dst;
    },
};


export default mat4;
