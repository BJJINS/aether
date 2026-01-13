import { createEncoderAndPass, initWebGpu, resize } from "../../../lib";
import { generateMipmaps, loadImageBitmap, numMipmapLevels } from "../../../lib/mipmap";
import shaderCode from "./shader.wgsl?raw";

const { canvas, device, context, presentationFormat } = await initWebGpu("webgpu-canvas");

const imageBitmap = await loadImageBitmap("https://webgpufundamentals.org/webgpu/resources/images/f-texture.png");

const mipLevelCount = numMipmapLevels(imageBitmap.width, imageBitmap.height);

const module = device.createShaderModule({
    label: "mipmap shader",
    code: shaderCode
});

const pipeline = device.createRenderPipeline({
    label: "mipmap pipeline",
    layout: "auto",
    vertex: {
        module,
        entryPoint: "vs",
        buffers: [{
            arrayStride: 8,
            attributes: [{
                shaderLocation: 0,
                offset: 0,
                format: "float32x2"
            }]
        }]
    },
    fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: presentationFormat }]
    }
});

const vertexData = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
    1, 0,
    0, 1,
]);

const vertexBuffer = device.createBuffer({
    label: "vertex buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertexData);

const texture = device.createTexture({
    label: "mipmap texture",
    format: "rgba8unorm",
    mipLevelCount,
    size: [imageBitmap.width, imageBitmap.height, 1],
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST
});

device.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: true }, { texture }, [imageBitmap.width, imageBitmap.height, 1]);
generateMipmaps(device, texture);

const sample = device.createSampler({
    magFilter: "linear",
});
const bindGroup = device.createBindGroup({
    label: "mipmap bindGroup",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: sample },
        { binding: 1, resource: texture.createView() }
    ]
});

const render = () => {
    const [encoder, pass] = createEncoderAndPass(device, context);
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
};

resize(device, canvas, render);
