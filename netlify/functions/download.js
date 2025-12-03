const { exec } = require('child_process');
const { join } = require('path');
const { tmpdir } = require('os');

exports.handler = async (event, context) => {
  const { url, format } = JSON.parse(event.body);
  const id = Date.now();
  const tempDir = tmpdir();
  const outputPath = join(tempDir, `${id}.%(ext)s`);
  
  let command;
  if (format === 'mp3') {
    command = `yt-dlp -x --audio-format mp3 -o '${outputPath}' '${url}'`;
  } else {
    command = `yt-dlp -f 'best[height<=${format}]' -o '${outputPath}' '${url}'`;
  }

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ statusCode: 500, body: JSON.stringify({ error: 'Gagal mendownload' }) });
        return;
      }
      // Cari nama file hasil
      const filename = stdout.match(/\[download\] Destination: (.+)/)?.[1];
      if (filename) {
        // Di Netlify, kita perlu menyediakan file untuk diunduh via redirect
        // Karena keterbatasan, kita arahkan ke URL download langsung yt-dlp (solusi praktis)
        const directUrl = `https://backend-downloader.onrender.com/download?url=${encodeURIComponent(url)}&format=${format}`;
        resolve({ statusCode: 200, body: JSON.stringify({ downloadUrl: directUrl }) });
      } else {
        resolve({ statusCode: 500, body: JSON.stringify({ error: 'File tidak ditemukan' }) });
      }
    });
  });
};
