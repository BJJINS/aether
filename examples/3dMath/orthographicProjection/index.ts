import GUI from "lil-gui";
import { createEncoderAndPass, initWebGpu, resize } from "../../../lib";
import shaderCode from "./shader.wgsl?raw";
import mat4 from "../../../lib/mat";
const { canvas, device, context, presentationFormat } = await initWebGpu("canvas");

const vertexData = new Float32Array([
    // left column
    0, 0, 0,
    0, -150, 0,
    30, 0, 0,
    30, -150, 0,

    // top rung
    30, 0, 0,
    30, -30, 0,
    100, 0, 0,
    100, -30, 0,

    // middle rung
    30, -60, 0,
    30, -90, 0,
    70, -60, 0,
    70, -90, 0,

    // left column
    0, 0, 30,
    0, -150, 30,
    30, 0, 30,
    30, -150, 30,

    // top rung
    30, 0, 30,
    30, -30, 30,
    100, 0, 30,
    100, -30, 30,

    // middle rung
    30, -60, 30,
    30, -90, 30,
    70, -60, 30,
    70, -90, 30,
]);

const indexData = new Uint16Array([
    // front face
    0, 1, 2, 2, 1, 3,  // left column
    4, 5, 6, 6, 5, 7,  // top rung
    8, 9, 10, 10, 9, 11,  // middle rung

    // back face
    12, 14, 13, 14, 15, 13,  // left column
    16, 18, 17, 18, 19, 17,  // top rung
    20, 22, 21, 22, 23, 21,  // middle rung

    // sides
    0, 12, 13, 0, 13, 1,    // left
    1, 13, 15, 1, 15, 3,    // bottom
    3, 15, 21, 3, 21, 9,    // right (bottom)
    9, 21, 23, 9, 23, 11,   // middle rung bottom
    11, 23, 22, 11, 22, 10, // middle rung right
    10, 22, 20, 10, 20, 8,  // middle rung top
    8, 20, 17, 8, 17, 5,    // right (middle)
    5, 17, 19, 5, 19, 7,    // top rung bottom
    7, 19, 18, 7, 18, 6,    // top rung right
    6, 18, 16, 6, 16, 4,    // top rung top
    4, 16, 12, 4, 12, 0,    // left column top
]);

const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});

const indexBuffer = device.createBuffer({
    label: "Index Buffer",
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(indexBuffer, 0, indexData);
device.queue.writeBuffer(vertexBuffer, 0, vertexData);
const module = device.createShaderModule({
    label: "Simple Pipeline Vertex Shader",
    code: shaderCode
});

const pipeline = device.createRenderPipeline({
    label: "Simple Pipeline",
    layout: "auto",
    vertex: {
        module,
        entryPoint: "vs",
        buffers: [
            {
                arrayStride: 12,
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    }
                ]
            }
        ]
    },
    fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: presentationFormat }]
    },
});
const uniformBufferSize = (4 + 16) * 4;
const uniformBuffer = device.createBuffer({
    label: `uniforms`,
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const kColorOffset = 0;
const kMatrixOffset = 4;
const uniformValues = new Float32Array(uniformBufferSize / 4);
const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
const matrixValue = uniformValues.subarray(kMatrixOffset, kMatrixOffset + 16);

const aspect = canvas.width / canvas.height;
const projectionMatrix = mat4.projection(500, aspect, 400);

colorValue.set([Math.random(), Math.random(), Math.random(), 1]);
const bindGroup = device.createBindGroup({
    label: `bind group for object`,
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
    ],
});


const setting = {
    translateX: 0,
    translateY: 0,
    translateZ: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scaleX: 1,
    scaleY: 1,
};

const gui = new GUI();
gui.add(setting, "translateX").min(-500).max(500).step(1);
gui.add(setting, "translateY").min(-500).max(500).step(1);
gui.add(setting, "translateZ").min(-500).max(500).step(1);
gui.add(setting, "rotateX").min(-180).max(180).step(0.1);
gui.add(setting, "rotateY").min(-180).max(180).step(0.1);
gui.add(setting, "rotateZ").min(-180).max(180).step(0.1);
gui.add(setting, "scaleX").min(0.1).max(2).step(0.1);
gui.add(setting, "scaleY").min(0.1).max(2).step(0.1);



const render = () => {
    const translateMatrix = mat4.translation(setting.translateX, setting.translateY, setting.translateZ);
    const rotationXY = mat4.multiply(mat4.rotationX(setting.rotateX / 180 * Math.PI), mat4.rotationY(setting.rotateY / 180 * Math.PI));
    const rotateMatrix = mat4.multiply(rotationXY, mat4.rotationZ(setting.rotateZ / 180 * Math.PI), rotationXY);
    const scaleMatrix = mat4.scaling(setting.scaleX, setting.scaleY, 1);
    const modelMatrix = mat4.multiply(projectionMatrix, mat4.multiply(translateMatrix, mat4.multiply(rotateMatrix, scaleMatrix)));
    matrixValue.set(modelMatrix);

    const [encoder, pass] = createEncoderAndPass(device, context);
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint16");

    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    pass.setBindGroup(0, bindGroup);
    pass.drawIndexed(indexData.length);
    pass.end();
    device.queue.submit([encoder.finish()]);
};

gui.onChange(() => {
    render();
});

resize(device, canvas, render);
