import { WebGPURender } from "../../../lib";
import { generateMipmaps, loadImageBitmap, numMipmapLevels } from "../../../lib/mipmap";
import shaderCode from "./shader.wgsl?raw";

const size = 256;
const half = size / 2;

const ctx = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
ctx.canvas.width = size;
ctx.canvas.height = size;

const hsl = (h: number, s: number, l: number) => `hsl(${h * 360 | 0}, ${s * 100}%, ${l * 100 | 0}%)`;

function update2DCanvas(time: number) {
    time *= 0.0001;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(half, half);
    const num = 20;
    for (let i = 0; i < num; ++i) {
        ctx.fillStyle = hsl(i / num * 0.2 + time * 0.1, 1, i % 2 * 0.5);
        ctx.fillRect(-half, -half, size, size);
        ctx.rotate(time * 0.5);
        ctx.scale(0.85, 0.85);
        ctx.translate(size / 16, 0);
    }
    ctx.restore();
}


new WebGPURender("canvas", (webGpuRender) => {
    const { device, presentationFormat } = webGpuRender;

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


    const renderer = (time: number) => {
        update2DCanvas(time);

        const texture = device.createTexture({
            label: "mipmap texture",
            format: "rgba8unorm",
            mipLevelCount: numMipmapLevels(ctx.canvas.width, ctx.canvas.height),
            size: [ctx.canvas.width, ctx.canvas.height, 1],
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
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
        device.queue.copyExternalImageToTexture({ source: ctx.canvas }, { texture }, [ctx.canvas.width, ctx.canvas.height, 1]);
        generateMipmaps(device, texture);

        const { encoder, pass } = webGpuRender.handleEncoder();

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(6);
        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(renderer);
    };
    requestAnimationFrame(renderer);
});



