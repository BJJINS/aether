import { WebGPURender } from "../../../lib";
import { generateMipmaps, loadImageBitmap, numMipmapLevels } from "../../../lib/mipmap";
import shaderCode from "./shader.wgsl?raw";

const imageBitmap = await loadImageBitmap("https://webgpufundamentals.org/webgpu/resources/images/f-texture.png");

new WebGPURender("canvas", (webGpuRender) => {
    const { device, presentationFormat } = webGpuRender;

    const { pass, encoder } = webGpuRender.handleEncoder();

    const module = device.createShaderModule({
        label: "mipmap shader module",
        code: shaderCode
    });

    const vertexData = new Float32Array([
        0, 0,
        1, 0,
        0, 1,
        1, 1,
        1, 0,
        0, 1
    ]);

    const vertexBuffer = device.createBuffer({
        label: "vertex buffer",
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const sampler = device.createSampler({
        magFilter: "nearest",
        minFilter: "linear",
        mipmapFilter: "linear"
    });

    const texture = device.createTexture({
        label: "mipmap texture",
        format: "rgba8unorm",
        mipLevelCount: numMipmapLevels(imageBitmap.width, imageBitmap.height),
        size: [imageBitmap.width, imageBitmap.height, 1],
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });
    device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [imageBitmap.width, imageBitmap.height, 1]);
    generateMipmaps(device, texture);

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

    const bindGroup = device.createBindGroup({
        label: "mipmap bindGroup",
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: texture.createView()
            },
            {
                binding: 1,
                resource: sampler
            }
        ]
    });


    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
});



