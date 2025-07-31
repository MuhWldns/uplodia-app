import machineIdModule from 'node-machine-id'
const { machineIdSync } = machineIdModule
import os from 'os'

export const getDeviceFingerprint = async () => {
  try {
    console.log('tes')
    const machineId = machineIdSync(true) // Gunakan ID yang stabil
    console.log('getting machine id')

    const hostname = os.hostname()

    const platform = os.platform()

    const ipResponse = await fetch('https://api.ipify.org?format=json')
    const { ip } = await ipResponse.json()
    console.log('IP Address:', ip)

    return {
      machine_id: machineId,
      hostname: hostname,
      platform: platform,
      ip_address: ip
    }
  } catch (error) {
    console.error(`Failed to get device fingerprint: ${error}`)
    return null
  }
}
