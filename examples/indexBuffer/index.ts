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

const module = device.createShaderModule({
  label: "vertex shader",
  code: shader,
});

const pipeline = device.createRenderPipeline({
  label: "hardcoded rgb triangle pipeline",
  layout: "auto",
  vertex: {
    module,
    buffers: [{
      arrayStride: 2 * 4,
      attributes: [{
        shaderLocation: 0, offset: 0, format: "float32x2"
      }]
    }]
  },
  fragment: {
    module,
    targets: [{ format: presentationFormat }],
  },
});


const vertexData = new Float32Array([
  0.5, 0.5,
  -0.5, -0.5,
  0.5, -0.5,
  -0.5, 0.5,
]);

const indexData = new Uint32Array([
  0, 1, 2,
  0, 3, 1
])


const vertexBuffer = device.createBuffer({
  label: "vertexBuffer",
  size: vertexData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const indexBuffer = device.createBuffer({
  label: "vertexBuffer",
  size: indexData.byteLength,
  usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertexData);
device.queue.writeBuffer(indexBuffer, 0, indexData);

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
pass.setPipeline(pipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.setIndexBuffer(indexBuffer, "uint32");

pass.drawIndexed(6);

pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
