import shader from "./shader.wgsl?raw";

const adapter = await navigator?.gpu?.requestAdapter();
const device = await adapter?.requestDevice();
if (!device) {
  throw new Error("Failed to request device");
}
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("webgpu")!;
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
context.configure({
  device,
  format: presentationFormat,
});

const encoder = device.createCommandEncoder({
  label: "render triangle encoder",
});
const pass = encoder.beginRenderPass({
  label: "our basic canvas renderPass",
  colorAttachments: [
    {
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
    },
  ],
});

const vertexData = new Float32Array([
  0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

  0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
]);
const vertexBuffer = device.createBuffer({
  label: "vertex buffer",
  size: vertexData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertexData);
pass.setVertexBuffer(0, vertexBuffer);

const textureWidth = 5;
const textureHeight = 7;
const _ = [255, 0, 0, 255]; // red
const y = [255, 255, 0, 255]; // yellow
const b = [0, 0, 255, 255]; // blue
const textureData = new Uint8Array([
    b, _, _, _, _,
    _, y, y, y, _,
    _, y, _, _, _,
    _, y, y, _, _,
    _, y, _, _, _,
    _, y, _, _, _,
    _, _, _, _, _,
].flat());

const texture = device.createTexture({
  label: "texture",
  size: [textureWidth, textureHeight],
  format: "rgba8unorm",
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

device.queue.writeTexture(
  { texture },
  textureData,
  { bytesPerRow: textureWidth * 4 },
  { width: textureWidth, height: textureHeight }
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
  label:"bindGroup",
  layout: pipeline.getBindGroupLayout(0),
  entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: texture.createView() },
    ],
})

pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);

pass.draw(6);
pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
