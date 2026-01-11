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
pass.draw(3);
pass.end();
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
