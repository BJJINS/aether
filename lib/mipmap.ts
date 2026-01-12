export const numMipLevels = (...size: number[]) => {
  return 1 + (Math.log2(Math.max(...size)) | 0);
};

export const loadImageBitmap = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return createImageBitmap(blob, { colorSpaceConversion: "none" });
};