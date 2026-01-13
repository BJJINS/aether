import { createEncoderAndPass, initWebGpu, resize } from "../../../lib";
import { mat3 } from "../../../lib/mat";
import shaderCode from "./shader.wgsl?raw";
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

const uniformBufferSize = (4 + 2 + 2 + 12) * 4;
const uniformBuffer = device.createBuffer({
    label: 'uniforms',
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
    label: 'bind group for object',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
    ],
});

const translationMatrix = mat3.translate(0, 0);
const rotationMatrix = mat3.rotation(61 / 180 * Math.PI);
const scaleMatrix = mat3.scale(1.0, 1.0);
const transformMatrix = mat3.multiply(translationMatrix,scaleMatrix);
matrixValue.set([
    ...transformMatrix.slice(0, 3), 0,
    ...transformMatrix.slice(3, 6), 0,
    ...transformMatrix.slice(6, 9), 0,
]);
const render = () => {
    const [encoder, pass] = createEncoderAndPass(device, context);
    resolutionValue.set([canvas.width, canvas.height]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setIndexBuffer(indexBuffer, "uint32");
    pass.setVertexBuffer(0, vertexBuffer);
    pass.drawIndexed(indexData.length);
    pass.end();
    device.queue.submit([encoder.finish()]);
};

resize(device, canvas, render);
