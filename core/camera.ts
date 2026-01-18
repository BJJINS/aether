import Mat4 from "./mat";
import { vec3 } from "./vec";

class Camera {
    projection = new Float32Array(16);
    position = new Float32Array(3);
    constructor() {
        this.setPosition();
    }
    setPosition(x = 0, y = 0, z = 0) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
    }
    lookAt(target: Float32Array) {

    }
}

export class OrthoCamera extends Camera {
    up = new Float32Array([0, 1, 0]);
    constructor(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        super();
        Mat4.ortho(left, right, bottom, top, near, far, this.projection);
    }
}