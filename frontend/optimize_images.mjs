import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimize(file) {
  const ext = file.split('.').pop();
  try {
      const buff = fs.readFileSync(file);
      const metadata = await sharp(buff).metadata();
      
      // Resize if it's too large, e.g., > 1920 width
      let width = metadata.width;
      if(width > 1920) width = 1920;

      let tempFile = file + '.tmp.' + ext;

      if (ext.toLowerCase() === 'png') {
          await sharp(buff)
            .resize({width})
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(tempFile);
      } else if (ext.toLowerCase() === 'jpg' || ext.toLowerCase() === 'jpeg') {
          await sharp(buff)
            .resize({width})
            .jpeg({ quality: 80, progressive: true })
            .toFile(tempFile);
      } else {
         console.log('Skipping', file);
         return;
      }

      fs.renameSync(tempFile, file);
      console.log('Optimized:', file);
   } catch(e) {
      console.error('Error optimizing', file, e);
   }
}

const files = [
  'src/assets/abc.png',
  'src/assets/logo.png',
  'src/assets/sealcertificate.png',
  'src/assets/farooq_lefty1.jpg',
  'src/assets/welcome.jpg',
  'src/assets/farooq12.jpg',
  'src/assets/bg1.jpeg',
  'src/assets/bg2.jpeg',
  'src/assets/facebook.jpg'
];

async function run() {
  for(const f of files) {
     if(fs.existsSync(f)) {
        await optimize(f);
     }
  }
}
run();
