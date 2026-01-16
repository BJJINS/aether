import GUI from "lil-gui";
import { initWebGpu, resize } from "../../../lib";
import shaderCode from "./shader.wgsl?raw";
import mat4 from "../../../lib/mat";
const { canvas, device, context, presentationFormat } = await initWebGpu("canvas");

const positions = [
    // left column
    0, 0, 0,
    0, -150, 0, // 1
    30, -150, 0, // 2
    30, 0, 0, // 3

    // top rung
    30, 0, 0,
    30, -30, 0, //5
    90, -30, 0,
    90, 0, 0, // 7

    // middle rung
    30, -50, 0, //8
    30, -80, 0,
    60, -80, 0,
    60, -50, 0, // 11

    // left column
    0, 0, 30, // 12
    0, -150, 30, //13
    30, -150, 30, // 14
    30, 0, 30,

    // top rung
    30, 0, 30,
    30, -30, 30,
    90, -30, 30, // 18
    90, 0, 30, // 19

    // middle rung
    30, -50, 30, // 20
    30, -80, 30,
    60, -80, 30,
    60, -50, 30, // 23
];

const indices = [
    // front face
    0, 1, 2, 2, 3, 0,  // left column
    4, 5, 6, 6, 7, 4,  // top rung
    8, 9, 10, 10, 11, 8,  // middle rung

    // back face
    12, 15, 14, 14, 13, 12,  // left column
    16, 19, 18, 18, 17, 16,  // top rung
    20, 23, 22, 22, 21, 20,  // middle rung

    // sides
    12, 13, 1, 1, 0, 12,    // left
    0, 7, 19, 19, 12, 0,
    2, 1, 13, 13, 14, 2,
    3, 2, 14, 14, 15, 3,
    7, 6, 18, 18, 19, 7,
    6, 5, 17, 17, 18, 6,
    8, 11, 23, 23, 20, 8,
    10, 9, 21, 21, 22, 10,
    11, 10, 22, 22, 23, 11,
];

const quadColors = [
    200, 70, 120,  // left column front
    200, 70, 120,  // top rung front
    200, 70, 120,  // middle rung front

    80, 70, 200,  // left column back
    80, 70, 200,  // top rung back
    80, 70, 200,  // middle rung back

    140, 210, 80,  // left
    76, 210, 100,  // bottom
    100, 70, 210,  // right (bottom)
    70, 180, 210,  // middle rung bottom
    210, 160, 70,  // middle rung right
    210, 100, 70,  // middle rung top
    200, 200, 70,  // right (middle)
    90, 130, 110,  // top rung bottom
    160, 160, 220,  // top rung right
    70, 200, 210,  // top rung top
    100, 100, 100, // left column top
];

const numVertices = indices.length;

const vertexData = new Float32Array(numVertices * 4);
const colorData = new Uint8Array(vertexData.buffer);
for (let i = 0; i < indices.length; i++) {
    const posIdx = indices[i] * 3;
    const x = positions[posIdx];
    const y = positions[posIdx + 1];
    const z = positions[posIdx + 2];

    vertexData.set([x, y, z], i * 4);
    const quadNdx = (i / 6 | 0) * 3;
    const color = quadColors.slice(quadNdx, quadNdx + 3);
    colorData.set(color, i * 16 + 12);
    colorData[i * 16 + 15] = 255;
}

const vertexBuffer = device.createBuffer({
    label: "Vertex Buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});

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
                arrayStride: 16,
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    },
                    {
                        shaderLocation: 1,
                        offset: 12,
                        format: "unorm8x4"
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
    primitive: {
        cullMode: "back"
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
    }
});
const uniformBufferSize = (16) * 4;
const uniformBuffer = device.createBuffer({
    label: `uniforms`,
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const uniformValues = new Float32Array(uniformBufferSize / 4);

const aspect = canvas.width / canvas.height;
const projectionMatrix = mat4.perspective(Math.PI / 3, aspect, 10 , 1000)


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
    translateZ: 200,
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
gui.add(setting, "scaleX").min(0.1).max(5).step(0.1);
gui.add(setting, "scaleY").min(0.1).max(5).step(0.1);



let depthTexture: GPUTexture;
const colorAttachment: any = {
    loadOp: "clear",
    storeOp: "store",
};

const renderPassDescriptor: any = {
    label: "our basic canvas renderPass",
    colorAttachments: [colorAttachment],
    depthStencilAttachment: {
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
    }
};


const render = () => {
    const translateMatrix = mat4.translation(setting.translateX, setting.translateY, setting.translateZ);
    const rotationXY = mat4.multiply(mat4.rotationX(setting.rotateX / 180 * Math.PI), mat4.rotationY(setting.rotateY / 180 * Math.PI));
    const rotateMatrix = mat4.multiply(rotationXY, mat4.rotationZ(setting.rotateZ / 180 * Math.PI), rotationXY);
    const scaleMatrix = mat4.scaling(setting.scaleX, setting.scaleY, 1);
    const modelMatrix = mat4.multiply(projectionMatrix, mat4.multiply(translateMatrix, mat4.multiply(rotateMatrix, scaleMatrix)));
    uniformValues.set(modelMatrix);

    const canvasTexture = context.getCurrentTexture();
    if (!depthTexture || depthTexture.width !== canvasTexture.width || depthTexture.height !== canvasTexture.height) {
        if (depthTexture) {
            depthTexture.destroy();
        }
        depthTexture = device.createTexture({
            label: "depth texture",
            size: [canvasTexture.width, canvasTexture.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    const encoder = device.createCommandEncoder({
        label: "render triangle encoder",
    });
    colorAttachment.view = canvasTexture.createView();
    renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView();
    const pass = encoder.beginRenderPass(renderPassDescriptor as GPURenderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);

    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    pass.setBindGroup(0, bindGroup);
    pass.draw(numVertices);
    pass.end();
    device.queue.submit([encoder.finish()]);
};

gui.onChange(() => {
    render();
});

resize(device, canvas, render);
