/**
 * Returns intelligent default zone coordinates for a certificate canvas.
 * Admin calibrates visually after upload — these are starting estimates only.
 */
function detectZones(imageWidth, imageHeight) {
  return {
    name: {
      x: Math.round(imageWidth / 2),
      y: 490,
      maxWidth: Math.round(imageWidth * 0.75),
      maxHeight: 102,
      align: 'center',
      fontSize: 90,
      color: '#ffffff',
    },
    memberId: {
      x: Math.round(imageWidth * 0.88),
      y: 1370,
      maxWidth: 700,
      maxHeight: 50,
      align: 'right',
      fontSize: 28,
      color: '#ffffff',
    },
    date: {
      x: Math.round(imageWidth * 0.12),
      y: 1370,
      maxWidth: 700,
      maxHeight: 50,
      align: 'left',
      fontSize: 28,
      color: '#ffffff',
    },
    city: {
      x: Math.round(imageWidth / 2),
      y: 1300,
      maxWidth: Math.round(imageWidth * 0.5),
      maxHeight: 40,
      align: 'center',
      fontSize: 22,
      color: '#ffffff',
    },
  };
}

module.exports = { detectZones };
