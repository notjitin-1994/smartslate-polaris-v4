import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
* Convert the project's swirl logo into a set of favicon PNGs (including a 32x32 favicon) and save them into the app/public directories.
* @example
* convertToFavicon()
* // Promise<void> (resolves when files are written)
* @returns {Promise<void>} Resolves when favicon files are successfully created; exits the process on failure.
**/
async function convertToFavicon() {
  const inputPath = path.join(__dirname, '../public/logo-swirl.png');
  const outputPath = path.join(__dirname, '../app/favicon.ico');

  try {
    console.log('Converting swirl logo to favicon...');

    // Create a 32x32 favicon from the swirl logo
    await sharp(inputPath).resize(32, 32).png().toFile(outputPath.replace('.ico', '-temp.png'));

    // For ICO format, we'll use PNG since modern browsers support it
    // and Next.js metadata already points to the PNG version
    console.log('✅ Favicon conversion completed successfully!');

    // Also create additional sizes for better compatibility
    const sizes = [16, 32, 48, 64, 128, 256];
    for (const size of sizes) {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, `../public/favicon-${size}x${size}.png`));
      console.log(`✅ Created favicon-${size}x${size}.png`);
    }
  } catch (error) {
    console.error('❌ Error converting favicon:', error);
    process.exit(1);
  }
}

convertToFavicon();
