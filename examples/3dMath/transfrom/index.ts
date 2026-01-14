import GUI from "lil-gui";
import { createEncoderAndPass, initWebGpu, resize } from "../../../lib";
import shaderCode from "./shader.wgsl?raw";
type Mat3 = [
    number, number, number,
    number, number, number,
    number, number, number,
];

export const mat3 = {
    identity(): Mat3 {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
    },
    scale(x: number, y: number): Mat3 {
        return [
            x, 0, 0,
            0, y, 0,
            0, 0, 1
        ];
    },
    translate(x: number, y: number,): Mat3 {
        return [
            1, 0, 0,
            0, 1, 0,
            x, y, 1
        ];
    },
    rotation(radians: number): Mat3 {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        return [
            c, s, 0,
            -s, c, 0,
            0, 0, 1
        ];
    },
    multiply(a: Mat3, b: Mat3): Mat3 {
        const a00 = a[0 * 3 + 0];
        const a01 = a[0 * 3 + 1];
        const a02 = a[0 * 3 + 2];
        const a10 = a[1 * 3 + 0];
        const a11 = a[1 * 3 + 1];
        const a12 = a[1 * 3 + 2];
        const a20 = a[2 * 3 + 0];
        const a21 = a[2 * 3 + 1];
        const a22 = a[2 * 3 + 2];
        const b00 = b[0 * 3 + 0];
        const b01 = b[0 * 3 + 1];
        const b02 = b[0 * 3 + 2];
        const b10 = b[1 * 3 + 0];
        const b11 = b[1 * 3 + 1];
        const b12 = b[1 * 3 + 2];
        const b20 = b[2 * 3 + 0];
        const b21 = b[2 * 3 + 1];
        const b22 = b[2 * 3 + 2];

        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    }
};
const { canvas, device, context, presentationFormat } = await initWebGpu("canvas");

const vertexData = new Float32Array([
    // left column
    0, 0,
    30, 0,
    0, 150,
    30, 150,

    // top rung
    30, 0,
    100, 0,
    30, 30,
    100, 30,

    // middle rung
    30, 60,
    70, 60,
    30, 90,
    70, 90,
]);

const indexData = new Uint32Array([
    0, 1, 2, 2, 1, 3,  // left column
    4, 5, 6, 6, 5, 7,  // top run
    8, 9, 10, 10, 9, 11,  // middle run
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
                arrayStride: 8,
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x2"
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


const numObjects = 1;
const objectInfos: { uniformBuffer: GPUBuffer; uniformValues: Float32Array<ArrayBuffer>; resolutionValue: Float32Array<ArrayBuffer>; matrixValue: Float32Array<ArrayBuffer>; bindGroup: GPUBindGroup; }[] = [];
for (let i = 0; i < numObjects; ++i) {
    const uniformBufferSize = (4 + 2 + 2 + 12) * 4;
    const uniformBuffer = device.createBuffer({
        label: `uniforms ${i}`,
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const kColorOffset = 0;
    const kResolutionOffset = 4;
    const kMatrixOffset = 8;
    const uniformValues = new Float32Array(uniformBufferSize / 4);
    const colorValue = uniformValues.subarray(kColorOffset, kColorOffset + 4);
    const resolutionValue = uniformValues.subarray(kResolutionOffset, kResolutionOffset + 2);
    const matrixValue = uniformValues.subarray(kMatrixOffset, kMatrixOffset + 12);
    colorValue.set([Math.random(), Math.random(), Math.random(), 1]);
    const bindGroup = device.createBindGroup({
        label: `bind group for object ${i}`,
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
        ],
    });
    objectInfos.push({
        uniformBuffer,
        uniformValues,
        resolutionValue,
        matrixValue,
        bindGroup,
    });
}

const setting = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    scaleX: 1.0,
    scaleY: 1.0,
};

const gui = new GUI();
gui.add(setting, "translateX").min(-500).max(500).step(1);
gui.add(setting, "translateY").min(-500).max(500).step(1);
gui.add(setting, "rotate").min(-360).max(360).step(1);
gui.add(setting, "scaleX").min(0.1).max(2.0).step(0.1);
gui.add(setting, "scaleY").min(0.1).max(2.0).step(0.1);
const render = () => {
    const translationMatrix = mat3.translate(setting.translateX, setting.translateY);
    const rotationMatrix = mat3.rotation(setting.rotate / 180 * Math.PI);
    const scaleMatrix = mat3.scale(setting.scaleX, setting.scaleY);
    let transformMatrix = mat3.identity();
    const [encoder, pass] = createEncoderAndPass(device, context);
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, 'uint32');

    for (const obj of objectInfos) {
        const {
            uniformBuffer,
            uniformValues,
            resolutionValue,
            matrixValue,
            bindGroup,
        } = obj;
        transformMatrix = mat3.multiply(transformMatrix, mat3.translate(-50, -75));
        transformMatrix = mat3.multiply(scaleMatrix, transformMatrix);
        transformMatrix = mat3.multiply(rotationMatrix, transformMatrix);
        transformMatrix = mat3.multiply(mat3.translate(50, 75), transformMatrix);
        transformMatrix = mat3.multiply(translationMatrix, transformMatrix);
        resolutionValue.set([canvas.width, canvas.height]);
        matrixValue.set([
            ...transformMatrix.slice(0, 3), 0,
            ...transformMatrix.slice(3, 6), 0,
            ...transformMatrix.slice(6, 9), 0,
        ]);
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
        pass.setBindGroup(0, bindGroup);
        pass.drawIndexed(indexData.length);
    }
    pass.end();
    device.queue.submit([encoder.finish()]);
};

gui.onChange(render);

resize(device, canvas, render);
