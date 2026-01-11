import { WebGPURender } from "../../../lib";
import shader from "./shader.wgsl?raw";

const numMipLevels = (...sizes: number[]) => {
  const maxSize = Math.max(...sizes);
  return 1 + Math.log2(maxSize) | 0;
};


const res = await fetch("./f-texture.png");
const blob = await res.blob();
const bitmap = await createImageBitmap(blob, { colorSpaceConversion: "none" });



const webgpuRender = new WebGPURender();
await webgpuRender.init("canvas");
const { device, presentationFormat, canvas } = webgpuRender;

const render = () => {
  const { encoder, pass } = webgpuRender.handleEncoder();

  const vertexData = new Float32Array([
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    0.0, 1.0, 1.0,
    1.0, 1.0, 0.0,
  ]);

  const vertexBuffer = device.createBuffer({
    label: "vertex buffer",
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertexData);
  pass.setVertexBuffer(0, vertexBuffer);

  const texture = device.createTexture({
    label: "texture",
    mipLevelCount: numMipLevels(bitmap.width, bitmap.height),
    size: [bitmap.width, bitmap.height],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: bitmap, flipY: false },
    { texture },
    { width: bitmap.width, height: bitmap.height }
  );

  const sampler = device.createSampler({
    addressModeU: "repeat",
    addressModeV: "repeat",
    magFilter: "linear",
  });

  const module = device.createShaderModule({
    label: "vertex shader",
    code: shader,
  });

  const pipeline = device.createRenderPipeline({
    label: "hardcoded rgb triangle pipeline",
    layout: "auto",
    vertex: {
      module,
      buffers: [
        {
          arrayStride: 2 * 4,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x2",
            },
          ],
        },
      ],
    },
    fragment: {
      module,
      targets: [{ format: presentationFormat }],
    },
  });

  const bindGroup = device.createBindGroup({
    label: "bindGroup",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sampler },
      { binding: 1, resource: texture.createView() },
    ],
  });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);

  pass.draw(6);
  pass.end();
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
  requestAnimationFrame(render);
};

requestAnimationFrame(render);

const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    const canvas = entry.target as HTMLCanvasElement;
    const width = entry.contentBoxSize[0].inlineSize;
    const height = entry.contentBoxSize[0].blockSize;
    canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
    canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
  }
});
observer.observe(canvas);