export class WebGPURender {
  device!: GPUDevice;
  adapter!: GPUAdapter | null;
  presentationFormat!: GPUTextureFormat;
  context!: GPUCanvasContext;
  canvas!: HTMLCanvasElement;

  constructor(id: string, render: (ins: WebGPURender) => void) {
    const main = async () => {
      await this.init(id);
      const observe = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const canvas = entry.target as HTMLCanvasElement;
          const width = entry.contentBoxSize[0].inlineSize;
          const height = entry.contentBoxSize[0].blockSize;
          canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
          canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
          render(this);
        }
      });

      observe.observe(this.canvas);
    };
    main();
  }

  async init(canvasId: string) {
    await this.handleDevice();
    this.handleCanvas(canvasId);
  }

  async handleDevice() {
    this.adapter = await navigator?.gpu?.requestAdapter();
    this.device = await this.adapter?.requestDevice()!;
    if (!this.device) {
      throw "Failed to request device";
    }
  }

  async handleCanvas(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.context = this.canvas.getContext("webgpu")!;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device!,
      format: this.presentationFormat,
    });
  }

  handleEncoder() {
    const encoder = this.device!.createCommandEncoder({
      label: "render triangle encoder",
    });
    const pass = encoder.beginRenderPass({
      label: "our basic canvas renderPass",
      colorAttachments: [
        {
          view: this.context!.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    return { encoder, pass };
  }
}

export const initWebGpu = async (canvasId: string) => {
  const adapter = await navigator?.gpu?.requestAdapter();
  const device = await adapter?.requestDevice()!;
  if (!device) {
    throw "Failed to request device";
  }
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const context = canvas.getContext("webgpu")!;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: presentationFormat,
  });
  return {
    device,
    canvas,
    context,
    presentationFormat
  };
};

export const resize = (device: GPUDevice, canvas: HTMLCanvasElement, cb?: () => void) => {
  const observe = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const canvas = entry.target as HTMLCanvasElement;
      const width = entry.contentBoxSize[0].inlineSize;
      const height = entry.contentBoxSize[0].blockSize;
      canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
      canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
      cb && cb();
    }
  });

  observe.observe(canvas);
};

export const createEncoderAndPass = (device: GPUDevice, context: GPUCanvasContext): [GPUCommandEncoder, GPURenderPassEncoder] => {
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
  return [encoder, pass];
};