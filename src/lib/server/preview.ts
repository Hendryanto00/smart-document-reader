export function previewObjectKey(documentId: string): string {
  return `uploads/${documentId}/preview.png`;
}

export function decodeBase64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
