import shader from "./shader.wgsl?raw";

const rand = (min: number, max: number) => {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};

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

const module = device.createShaderModule({
  label: "vertex shader",
  code: shader,
});

const pipeline = device.createRenderPipeline({
  label: "hardcoded rgb triangle pipeline",
  layout: "auto",
  vertex: {
    module,
  },
  fragment: {
    module,
    targets: [{ format: presentationFormat }],
  },
});

const encoder = device.createCommandEncoder({
  label: "render triangle encoder",
});
const pass = encoder.beginRenderPass({
  label: "our basic canvas renderPass",
  colorAttachments: [
    {
      view: context.getCurrentTexture().createView(),
      clearValue: [0.3, 0.3, 0.3, 1],
      loadOp: "clear",
      storeOp: "store",
    },
  ],
});
pass.setPipeline(pipeline);

const uniformOurBufferSize = 4 * 4 + 2 * 4 + 2 * 4;
const uniformOtherBufferSize = 2 * 4;
const kNumObjects = 100;

const uniformOurBuffer = device.createBuffer({
  label: `uniform ourStruct`,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  size: uniformOurBufferSize * kNumObjects,
});
const uniformOtherBuffer = device.createBuffer({
  label: `uniform otherStruct`,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  size: uniformOtherBufferSize * kNumObjects,
});
const vertexBuffer = device.createBuffer({
  label: `vertexBuffer`,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  size: 2 * 3 * 4,
});
const vertexData = new Float32Array(2 * 3);
vertexData.set([0.0, 0.5, 0.5, -0.5, -0.5, -0.5], 0);

const uniformOurValue = new Float32Array(uniformOurBufferSize * kNumObjects * 0.25);
const uniformOtherValue = new Float32Array(uniformOtherBufferSize * kNumObjects * 0.25);

for (let i = 0; i < kNumObjects; i++) {
  uniformOurValue.set([rand(0, 1), rand(0, 1), rand(0, 1)], i * 8 + 0);
  uniformOurValue.set([rand(-1, 1), rand(-1, 1)], i * 8 + 4);
  uniformOtherValue.set([rand(0, 1), rand(0, 1)], i * 2 + 0);
}

device.queue.writeBuffer(uniformOurBuffer, 0, uniformOurValue);
device.queue.writeBuffer(uniformOtherBuffer, 0, uniformOtherValue);
device.queue.writeBuffer(vertexBuffer, 0, vertexData);

const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: uniformOurBuffer },
    },
    {
      binding: 1,
      resource: { buffer: uniformOtherBuffer },
    },
    {
      binding: 2,
      resource: { buffer: vertexBuffer },
    },
  ],
});
pass.setBindGroup(0, bindGroup);
pass.draw(3, kNumObjects);

pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
