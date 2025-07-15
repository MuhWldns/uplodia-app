import { machineIdSync } from 'node-machine-id'
import os from 'os'

export const getDeviceFingerprint = async () => {
  try {
    const machineId = machineIdSync(true) // Gunakan ID yang stabil
    console.log('Machine ID:', machineId)

    const hostname = os.hostname()
    console.log('Hostname:', hostname)

    const platform = os.platform()
    console.log('Platform:', platform)

    const ipResponse = await fetch('https://api.ipify.org?format=json')
    const { ip } = await ipResponse.json()
    console.log('IP Address:', ip)

    return {
      machine_id: machineId || 'unknown',
      hostname: hostname || 'unknown',
      platform: platform || 'unknown',
      ip_address: ip || 'unknown'
    }
  } catch (error) {
    console.error(`Failed to get device fingerprint: ${error}`)
    return null
  }
}
