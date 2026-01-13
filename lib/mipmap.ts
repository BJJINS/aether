export const numMipmapLevels = (...size: number[]) => {
    return 1 + Math.log2(Math.max(...size)) | 0;
};


export const loadImageBitmap = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return createImageBitmap(blob, { colorSpaceConversion: "none" });
};


const mipmapShaderModuleCache = new WeakMap<GPUDevice, GPUShaderModule>();
const mipmapSamplerCache = new WeakMap<GPUDevice, GPUSampler>();
const mipmapPipelineCache = new WeakMap<GPUDevice, Map<GPUTextureFormat, GPURenderPipeline>>();
const mipmapPerTextureCache = new WeakMap<
    GPUTexture,
    {
        format: GPUTextureFormat;
        mipLevelCount: number;
        pipeline: GPURenderPipeline;
        mipViews: GPUTextureView[];
        mipBindGroups: Array<GPUBindGroup | undefined>;
        colorAttachment: GPURenderPassColorAttachment;
        renderPassDescriptor: GPURenderPassDescriptor;
    }
>();


const getMipmapShaderModule = (device: GPUDevice) => {
    const cached = mipmapShaderModuleCache.get(device);
    if (cached) {
        return cached;
    }
    const module = device.createShaderModule({
        label: "generate mipmaps shader module",
        code: /*wgsl*/`
            struct VertexShaderOutput {
                @builtin(position) position: vec4f,
                @location(0) uv: vec2f,
            } 
            @vertex
            fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexShaderOutput {
                let positions = array(
                    vec2f(0.0, 0.0),
                    vec2f(1.0, 0.0),
                    vec2f(0.0, 1.0),
                    vec2f(1.0, 1.0),
                    vec2f(1.0, 0.0),
                    vec2f(0.0, 1.0),
                );
                let pos = positions[vertexIndex];
                return VertexShaderOutput(vec4f(pos * 2.0 - 1.0, 0.0, 1.0), pos.xy);
            }
            @group(0) @binding(0) var ourSampler: sampler;
            @group(0) @binding(1) var ourTexture: texture_2d<f32>;
            @fragment
            fn fs(input: VertexShaderOutput) -> @location(0) vec4f {
                return textureSample(ourTexture, ourSampler, input.uv);
            }
        `
    });
    mipmapShaderModuleCache.set(device, module);
    return module;
};


const getMipmapSampler = (device: GPUDevice) => {
    const cached = mipmapSamplerCache.get(device);
    if (cached) {
        return cached;
    }
    const sampler = device.createSampler({
        minFilter: "linear"
    });
    mipmapSamplerCache.set(device, sampler);
    return sampler;
};


const getMipmapPipeline = (device: GPUDevice, format: GPUTextureFormat) => {
    let perDevice = mipmapPipelineCache.get(device);
    if (!perDevice) {
        perDevice = new Map();
        mipmapPipelineCache.set(device, perDevice);
    }
    const cached = perDevice.get(format);
    if (cached) {
        return cached;
    }
    const module = getMipmapShaderModule(device);
    const pipeline = device.createRenderPipeline({
        label: "generate mipmaps pipeline",
        layout: "auto",
        vertex: {
            module,
            entryPoint: "vs"
        },
        fragment: {
            module,
            entryPoint: "fs",
            targets: [{ format }]
        }
    });
    perDevice.set(format, pipeline);
    return pipeline;
};


export const generateMipmaps = (device: GPUDevice, texture: GPUTexture) => {
    const { mipLevelCount } = texture;
    if (mipLevelCount <= 1) {
        return;
    }

    const pipeline = getMipmapPipeline(device, texture.format);

    let cached = mipmapPerTextureCache.get(texture);
    if (!cached || cached.mipLevelCount !== mipLevelCount || cached.format !== texture.format || cached.pipeline !== pipeline) {
        const sampler = getMipmapSampler(device);
        const mipViews = Array.from({ length: mipLevelCount }, (_, baseMipLevel) => {
            return texture.createView({
                baseMipLevel,
                mipLevelCount: 1,
            });
        });

        const bindGroupLayout = pipeline.getBindGroupLayout(0);
        const mipBindGroups = Array.from({ length: mipLevelCount }, (_, baseMipLevel) => {
            if (baseMipLevel === 0) {
                return undefined;
            }
            return device.createBindGroup({
                label: `generate mipmaps bindGroup ${baseMipLevel}`,
                layout: bindGroupLayout,
                entries: [
                    { binding: 0, resource: sampler },
                    { binding: 1, resource: mipViews[baseMipLevel - 1] },
                ],
            });
        });

        const colorAttachment: GPURenderPassColorAttachment = {
            view: mipViews[0],
            loadOp: "clear",
            storeOp: "store",
        };
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: "generate mipmaps pass",
            colorAttachments: [colorAttachment],
        };

        cached = {
            format: texture.format,
            mipLevelCount,
            pipeline,
            mipViews,
            mipBindGroups,
            colorAttachment,
            renderPassDescriptor,
        };
        mipmapPerTextureCache.set(texture, cached);
    }

    const encoder = device.createCommandEncoder({
        label: "generate mipmaps encoder"
    });

    for (let baseMipLevel = 1; baseMipLevel < mipLevelCount; baseMipLevel++) {
        const bindGroup = cached.mipBindGroups[baseMipLevel]!;
        cached.colorAttachment.view = cached.mipViews[baseMipLevel];
        const pass = encoder.beginRenderPass(cached.renderPassDescriptor);
        pass.setPipeline(cached.pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
        pass.end();
    }

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
};
