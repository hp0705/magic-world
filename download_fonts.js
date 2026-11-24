const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS = [
  {
    name: 'Baloo2-SemiBold.ttf',
    url: 'https://fonts.gstatic.com/s/baloo2/v23/wXK0E3kTposypRydzVT08TS3JnAmtdjEyqpv.ttf'
  },
  {
    name: 'Baloo2-ExtraBold.ttf',
    url: 'https://fonts.gstatic.com/s/baloo2/v23/wXK0E3kTposypRydzVT08TS3JnAmtdiayqpv.ttf'
  },
  {
    name: 'Nunito-SemiBold.ttf',
    url: 'https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDGUmRTM.ttf'
  },
  {
    name: 'Nunito-Bold.ttf',
    url: 'https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmRTM.ttf'
  },
  {
    name: 'Nunito-ExtraBold.ttf',
    url: 'https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDGAmRTM.ttf'
  }
];

let pending = FONTS.length;
FONTS.forEach(font => {
  const dest = path.join(__dirname, 'css', 'fonts', font.name);
  const file = fs.createWriteStream(dest);
  https.get(font.url, res => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded font:', font.name);
      pending--;
      if (pending === 0) {
        console.log('All fonts downloaded successfully!');
      }
    });
  }).on('error', err => {
    console.error('Failed to download', font.name, err);
  });
});
