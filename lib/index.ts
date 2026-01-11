export class WebGPURender {
  device!: GPUDevice;
  adapter!: GPUAdapter | null;
  presentationFormat!: GPUTextureFormat;
  context!: GPUCanvasContext;
  canvas!: HTMLCanvasElement;

  constructor() {}

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
