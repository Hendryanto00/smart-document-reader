/**
 * Generate PNG/JPG/PDF samples from SVG sources (run: npm run samples:generate)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'scripts', 'sample-sources');
const outDirs = [join(root, 'samples'), join(root, 'static', 'samples')];

for (const dir of outDirs) mkdirSync(dir, { recursive: true });

function writeOut(name, data) {
	for (const dir of outDirs) writeFileSync(join(dir, name), data);
}

async function svgToPng(svgName, pngName) {
	const svg = readFileSync(join(srcDir, svgName));
	const png = await sharp(svg).png().toBuffer();
	writeOut(pngName, png);
	console.log('wrote', pngName);
	return png;
}

async function pngToJpg(pngBuffer, jpgName) {
	const jpg = await sharp(pngBuffer).jpeg({ quality: 92 }).toBuffer();
	writeOut(jpgName, jpg);
	console.log('wrote', jpgName);
}

async function pngToPdf(pngBuffer, pdfName) {
	const pdfDoc = await PDFDocument.create();
	const image = await pdfDoc.embedPng(pngBuffer);
	const page = pdfDoc.addPage([image.width, image.height]);
	page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
	const bytes = await pdfDoc.save();
	writeOut(pdfName, bytes);
	console.log('wrote', pdfName);
}

const indomaretPng = await svgToPng('sample-indomaret.svg', 'sample-indomaret.png');
const invoicePng = await svgToPng('sample-invoice.svg', 'sample-invoice.png');
await svgToPng('sample-blur-receipt.svg', 'sample-blur-receipt.png');

await pngToJpg(indomaretPng, 'sample-indomaret.jpg');
await pngToPdf(invoicePng, 'sample-invoice.pdf');

console.log('Done — samples in /samples');
