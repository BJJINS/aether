import { createEncoderAndPass, initWebGpu, resize } from "../../../lib";

const { canvas, device, context, presentationFormat } = await initWebGpu("canvas");
resize(device, canvas);

const [encoder, pass] = createEncoderAndPass(device, context);
