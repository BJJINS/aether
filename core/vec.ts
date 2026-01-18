export const vec3 = (x: number, y: number, z: number, vec?: Float32Array) => {
    vec = vec || new Float32Array(3);
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;
    return vec;
};

export const vec4 = (x: number, y: number, z: number, vec?: Float32Array) => {
    vec = vec || new Float32Array(4);
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;
    vec[3] = 1;
    return vec;
};


const Vec = {
    sub(a: Float32Array, b: Float32Array, dst?: Float32Array) {
        dst = dst || new Float32Array(3);
        dst[0] = a[0] - b[0];
        dst[1] = a[1] - b[1];
        dst[2] = a[2] - b[2];
        return dst;
    },
    normalize(a: Float32Array, dst?: Float32Array) {
        dst = dst || new Float32Array(3);
        const len = Math.hypot(a[0], a[1], a[2]);
        if (len > 0.00001) {
            dst[0] = a[0] / len;
            dst[1] = a[1] / len;
            dst[2] = a[2] / len;
        } else {
            dst[0] = 0;
            dst[1] = 0;
            dst[2] = 0;
        }
        return dst;
    },
    cross(a: Float32Array, b: Float32Array, dst?: Float32Array) {
        dst = dst || new Float32Array(3);
        dst[0] = a[1] * b[2] - a[2] * b[1];
        dst[1] = a[2] * b[0] - a[0] * b[2];
        dst[2] = a[0] * b[1] - a[1] * b[0];
        return dst;
    },
    dot(a: Float32Array, b: Float32Array) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
};

export default Vec;
