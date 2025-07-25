import { machineId } from 'node-machine-id'
import api from '../utils/api'
import { getDeviceFingerprint } from './get-device-fingerprint'
export const validatePremiumKey = async (apiKey) => {
  try {
    const { machine_id } = await getDeviceFingerprint()
    const response = await api.post('/validate-key', {
      api_key: apiKey,
      machine_id
    })

    return {
      success: true,
      valid: response.data.valid,
      message: response.data.message
    }
  } catch (error) {
    console.error('Error validating premium key:', error)
    return {
      success: false,
      valid: false,
      message: error.response?.data?.message || 'Gagal validasi premium key'
    }
  }
}

export const savePremiumToStorage = (store, premiumData) => {
  try {
    store.set('premium', {
      apiKey: premiumData.apiKey,
      isPremium: premiumData.isPremium,
      activatedAt: premiumData.activatedAt,
      machineId: premiumData.machineId,
      lastValidated: new Date().toISOString()
    })
    return {
      success: true,
      message: 'Premium Status Berhasil Disimpan'
    }
  } catch (error) {
    console.error('Error saving premium to storage:', error)
    return {
      success: false,
      message: 'Gagal menyimpan status premium'
    }
  }
}

export const getPremiumFromStorage = (store) => {
  try {
    const premiumData = store.get('premium', {
      isPremium: false,
      apiKey: null,
      activatedAt: null,
      machineId: null,
      lastValidated: null
    })

    return {
      success: true,
      data: premiumData
    }
  } catch (error) {
    console.error('Error getting premium from storage:', error)
    return {
      success: false,
      data: {
        isPremium: false,
        apiKey: null
      }
    }
  }
}

export const clearPremiumFromStorage = (store) => {
  try {
    store.delete('premium')
    return {
      success: true,
      message: 'Premium data berhasil dihapus'
    }
  } catch (error) {
    console.error('Error clearing premium storage:', error)
    return {
      success: false,
      message: 'Gagal menghapus data premium'
    }
  }
}
