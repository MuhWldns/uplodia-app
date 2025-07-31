export const log = (level, message, sender = null) => {
  console.log(`[${level.toUpperCase()}] ${message}`)
  if (sender) {
    sender.send('tiktok-upload-log', { level, message })
  }
}
