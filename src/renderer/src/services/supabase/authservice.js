import { supabase } from './SupabaseClient.js'
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }

  return true
}
export const register = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  if (error) {
    throw new Error(error.message)
  }
  const userId = data.user.id
  const { error: insertError } = await supabase.from('users').insert([
    {
      id: userId,
      email,
      role: 'basic'
    }
  ])

  if (insertError) {
    throw new Error(insertError.message)
  }

  return data
}

export const getCurrentUser = () => {
  return supabase.auth.user()
}
