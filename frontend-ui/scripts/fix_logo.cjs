const Jimp = require('jimp');

Jimp.read('src/assets/logo.png')
    .then(img => {
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            // Make white or very light grey pixels transparent
            if (r > 240 && g > 240 && b > 240) {
                this.bitmap.data[idx + 3] = 0; // Alpha to 0
            }
        });
        img.write('../src/assets/logo.png', () => {
            console.log('Logo background removed successfully!');
        });
    })
    .catch(err => {
        console.error(err);
    });
