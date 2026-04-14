const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../tests/integration');

const replacements = {
  '0xInvestorA': '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0xInvestorB': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0xDupe': '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0xSecondary': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0xNonExistent': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  '0xAAA': '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0xBBB': '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0xPrimary': '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
};

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndReplace(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      for (const [oldVal, newVal] of Object.entries(replacements)) {
        if (content.includes(oldVal)) {
          content = content.split(oldVal).join(newVal);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walkAndReplace(targetDir);
console.log('Wallet string replacements complete.');
