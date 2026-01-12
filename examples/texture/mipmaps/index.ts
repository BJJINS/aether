import { WebGPURender } from "../../../lib";
import { loadImageBitmap, numMipLevels } from "../../../lib/mipmap";
import shaderCode from "./shader.wgsl?raw";

const webgpuRender = new WebGPURender();
await webgpuRender.init("webgpu-canvas");
const { device, presentationFormat, canvas } = webgpuRender;

const imageBitmap = await loadImageBitmap("https://webgpufundamentals.org/webgpu/resources/images/f-texture.png");

const mipLevelCount = numMipLevels(imageBitmap.width, imageBitmap.height);

const render = () => {
    const { encoder, pass } = webgpuRender.handleEncoder();


    const module = device.createShaderModule({
        label: "mipmap shader",
        code: shaderCode
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
        mipLevelCount: 1,
        size: [imageBitmap.width, imageBitmap.height, 1],
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST
    });

    device.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: true }, { texture }, [imageBitmap.width, imageBitmap.height, 1]);

    const textureView = texture.createView();


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

    const sample = device.createSampler({
        magFilter: "linear",
    });
    const bindGroup = device.createBindGroup({
        label: "mipmap bindGroup",
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: sample },
            { binding: 1, resource: textureView }
        ]
    });

    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
};

const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const canvas = entry.target as HTMLCanvasElement;
        const width = entry.contentBoxSize[0].inlineSize;
        const height = entry.contentBoxSize[0].blockSize;
        canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
        render();
    }
});
observer.observe(canvas);

